import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Activity, Phone, Mail } from "lucide-react";
import { auth, googleProvider, db, handleFirestoreError } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "firebase/auth";
import { setDoc, doc, getDoc } from "firebase/firestore";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Get dashboard type from sessionStorage
      const dashboardType = sessionStorage.getItem('dashboardType');
      const isAdmin = dashboardType === 'admin';
      
      // Fetch or create user doc
      const userRef = doc(db, "users", user.uid);
      let userRole = isAdmin ? "admin" : "user";
      try {
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          console.log('Creating new user document for Google sign-in');
          await setDoc(userRef, { email: user.email, role: userRole });
        } else {
          // If user exists, check if they're trying to access admin panel
          const existingRole = userSnap.data().role || "user";
          if (isAdmin && existingRole !== "admin") {
            // Update role to admin if accessing admin panel
            await setDoc(userRef, { email: user.email, role: "admin" }, { merge: true });
            userRole = "admin";
          } else {
            userRole = existingRole;
          }
        }
      } catch (error) {
        console.error('Error handling user document:', error);
        handleFirestoreError(error, 'user document creation');
      }
      toast({
        title: "Success",
        description: "You have been logged in successfully.",
      });
      // Store user info in sessionStorage
      sessionStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: userRole
      }));
      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to sign in with Google. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create a new RecaptchaVerifier instance for each attempt
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'normal',
        'callback': () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
          console.log('reCAPTCHA verified');
        }
      });

      // Format phone number to E.164 format
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      setVerificationId(confirmationResult.verificationId);
      setShowVerification(true);
      
      toast({
        title: "Verification Code Sent",
        description: "Please check your phone for the verification code.",
      });
    } catch (error: any) {
      console.error('Phone auth error:', error);
      let errorMessage = "Failed to send verification code. Please try again.";
      
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = "Invalid phone number format. Please use international format (e.g., +1234567890)";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many attempts. Please try again later.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPhoneCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const credential = await signInWithPhoneNumber(auth, phoneNumber, new RecaptchaVerifier(auth, 'recaptcha-container'));
      const result = await credential.confirm(verificationCode);
      const user = result.user;
      
      // Get dashboard type from sessionStorage
      const dashboardType = sessionStorage.getItem('dashboardType');
      const isAdmin = dashboardType === 'admin';
      
      // Fetch or create user doc
      const userRef = doc(db, "users", user.uid);
      let userRole = isAdmin ? "admin" : "user";
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, { phoneNumber: user.phoneNumber, role: userRole });
      } else {
        // If user exists, check if they're trying to access admin panel
        const existingRole = userSnap.data().role || "user";
        if (isAdmin && existingRole !== "admin") {
          // Update role to admin if accessing admin panel
          await setDoc(userRef, { phoneNumber: user.phoneNumber, role: "admin" }, { merge: true });
          userRole = "admin";
        } else {
          userRole = existingRole;
        }
      }
      toast({
        title: "Success",
        description: "Phone number verified successfully.",
      });
      // Store user info in sessionStorage
      sessionStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        phoneNumber: user.phoneNumber,
        role: userRole
      }));
      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error: any) {
      console.error('Verification error:', error);
      let errorMessage = "Invalid verification code. Please try again.";
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = "Invalid verification code. Please check and try again.";
      } else if (error.code === 'auth/code-expired') {
        errorMessage = "Verification code has expired. Please request a new one.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get dashboard type from sessionStorage
      const dashboardType = sessionStorage.getItem('dashboardType');
      const isAdmin = dashboardType === 'admin';
      
      // Fetch user role from Firestore
      let userRole = "user";
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const existingRole = userSnap.data().role || "user";
        if (isAdmin && existingRole !== "admin") {
          // Update role to admin if accessing admin panel
          await setDoc(userRef, { email: user.email, role: "admin" }, { merge: true });
          userRole = "admin";
        } else {
          userRole = existingRole;
        }
      }
      toast({
        title: "Success",
        description: "You have been logged in successfully.",
      });
      
      // Store user info in sessionStorage
      sessionStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        role: userRole
      }));
      // Redirect based on dashboard type
      if (!dashboardType) {
        toast({
          title: "Select Dashboard Type",
          description: "Please select Admin or User from the home page before logging in.",
          variant: "destructive",
        });
        navigate('/');
      } else {
        navigate('/dashboard');
        window.location.reload();
      }
    } catch (error: any) {
      let errorMessage = "Failed to login. Please try again.";
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Invalid email or password.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get dashboard type from sessionStorage
      const dashboardType = sessionStorage.getItem('dashboardType');
      const isAdmin = dashboardType === 'admin';
      const userRole = isAdmin ? "admin" : "user";
      
      try {
        console.log('Creating user document for new signup');
        // Create user doc in Firestore
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          role: userRole
        });
        
        console.log('Creating device document for new user');
        // Create device doc in Firestore for the new user
        await setDoc(doc(db, "devices", user.uid), {
          name: `${user.email}'s Device`,
          status: "active",
          type: "desktop",
          usage: 0,
          user: user.email,
          ip: "0.0.0.0"
        });
      } catch (error) {
        console.error('Error creating user/device documents:', error);
        handleFirestoreError(error, 'user/device document creation');
      }
      toast({
        title: "Success",
        description: "Your account has been created successfully.",
      });
      
      // Store user info in sessionStorage
      sessionStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        role: userRole
      }));
      // Redirect based on dashboard type
      if (!dashboardType) {
        toast({
          title: "Select Dashboard Type",
          description: "Please select Admin or User from the home page before signing up.",
          variant: "destructive",
        });
        navigate('/');
      } else {
        navigate('/dashboard');
        window.location.reload();
      }
    } catch (error: any) {
      let errorMessage = "Failed to create account. Please try again.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "An account with this email already exists.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password should be at least 6 characters.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get the dashboard type from sessionStorage
  const dashboardType = sessionStorage.getItem('dashboardType');
  const isAdmin = dashboardType === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-cyan-500/20 rounded-full">
              <Activity className="h-12 w-12 text-cyan-400" />
            </div>
          </div>
        </div>
        <Card className="w-[400px] bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all duration-300">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-white">Bandwidth Beacon Watch</CardTitle>
            <CardDescription className="text-center text-slate-300">
              {isAdmin ? "Admin Access" : "User Access"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-700/50 border border-slate-600">
                <TabsTrigger 
                  value="login" 
                  className="data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-300"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Login
                </TabsTrigger>
                {!isAdmin && (
                <TabsTrigger 
                  value="signup" 
                  className="data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-300"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Sign Up
                </TabsTrigger>
                )}
              </TabsList>
              {/* Email Login/Signup Tabs */}
              <TabsContent value="login" className="mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="name@example.com"
                      required
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-500/50 focus:ring-cyan-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-300">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-500/50 focus:ring-cyan-500/50"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white transition-colors duration-200" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </TabsContent>
              {!isAdmin && (
              <TabsContent value="signup" className="mt-6">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-slate-300">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="name@example.com"
                      required
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-500/50 focus:ring-cyan-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-slate-300">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      required
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-500/50 focus:ring-cyan-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-slate-300">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      name="confirmPassword"
                      type="password"
                      required
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-500/50 focus:ring-cyan-500/50"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white transition-colors duration-200" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create account"}
                  </Button>
                </form>
              </TabsContent>
              )}
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-slate-400 text-center">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </div>
            <Button
              variant="ghost"
              className="w-full text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors duration-200"
              onClick={() => {
                sessionStorage.removeItem('dashboardType');
                navigate('/');
              }}
            >
              Back to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 