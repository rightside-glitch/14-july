import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Activity,
  Router,
  Settings,
  AlertTriangle,
  TrendingUp,
  Shield,
  Home,
  Smartphone,
  Laptop
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { db, handleFirestoreError } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit, getDocs, updateDoc, doc, addDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { VisitorsNetworkManager } from "@/components/VisitorsNetworkManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRealNetwork } from "@/hooks/use-real-network";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [realTimeData, setRealTimeData] = useState([]);
  const [devices, setDevices] = useState([]);
  const [userCount, setUserCount] = useState(0);

  const [userStats, setUserStats] = useState([]);
  const [totalBandwidthUsage, setTotalBandwidthUsage] = useState(0);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDevice, setNewDevice] = useState({
    name: '',
    type: 'desktop',
    user: '',
    ip: '',
    usage: 0
  });
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [realUsers, setRealUsers] = useState([]);
  const [realUserBandwidth, setRealUserBandwidth] = useState({});
  const [lastUserCount, setLastUserCount] = useState(0);
  const [newUserNotification, setNewUserNotification] = useState('');
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  
  // Real network data hook
  const {
    networkStatus,
    systemInfo,
    userBandwidth,
    isLoading: networkLoading,
    error: networkError,
    isConnected,
    currentBandwidth,
    bandwidthHistory,
    activeInterfaces,
    bandwidthGBh,
    hasRealData,
    validateEmail,
    getUserBandwidth
  } = useRealNetwork();
  
  // Role-based access control
  useEffect(() => {
    if (!user.uid) {
      navigate('/auth');
      return;
    }
    
    if (user.role !== 'admin') {
      alert('Access denied. Admin privileges required.');
      navigate('/');
      return;
    }
  }, [user.uid, user.role, navigate]);
  
  const readOnly = user.role !== 'admin';

  // Fetch real user bandwidth data
  const fetchRealUserBandwidth = async (users) => {
    try {
      const userBandwidthData = {};
      let totalRealBandwidth = 0;
      
      for (const userDoc of users) {
        const userData = userDoc.data();
        if (userData.email) {
          try {
            const bandwidthData = await getUserBandwidth(userData.email);
            if (bandwidthData) {
              userBandwidthData[userData.email] = bandwidthData;
              // Use the same calculation as User Dashboard (Mbps)
              totalRealBandwidth += bandwidthData.bandwidth.current.total;
            }
          } catch (error) {
            console.error(`Error fetching bandwidth for ${userData.email}:`, error);
          }
        }
      }
      
      setRealUserBandwidth(userBandwidthData);
      // Store total bandwidth in Mbps (same as User Dashboard)
      setTotalBandwidthUsage(totalRealBandwidth);
    } catch (error) {
      console.error('Error fetching real user bandwidth:', error);
    }
  };

  // Listen to Firestore devices collection
  useEffect(() => {
    console.log('Setting up devices listener...');
    const unsub = onSnapshot(
      collection(db, "devices"), 
      (snapshot) => {
        console.log('Devices snapshot received:', snapshot.docs.length, 'devices');
        setDevices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        console.error('Devices listener error:', error);
        handleFirestoreError(error, 'devices listener');
      }
    );
    return () => unsub();
  }, []);

  // Listen to Firestore users collection for ALL users (including admins) in real-time
  useEffect(() => {
    console.log('Setting up ALL users listener...');
    // Initial fetch in case onSnapshot doesn't fire if collection is empty
    getDocs(collection(db, "users"))
      .then(snapshot => {
        const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const regularUsers = allUsers.filter(user => user.role === 'user');
        const adminUsers = allUsers.filter(user => user.role === 'admin');
        
        setUserCount(regularUsers.length);
        setRealUsers(allUsers); // Store ALL users for monitoring
        
        // Check for new user signups
        if (lastUserCount > 0 && allUsers.length > lastUserCount) {
          const newUsers = allUsers.slice(lastUserCount);
          const newUserNames = newUsers.map(u => u.email || u.phoneNumber).join(', ');
          setNewUserNotification(`New user(s) signed up: ${newUserNames}`);
          setTimeout(() => setNewUserNotification(''), 5000); // Clear after 5 seconds
        }
        setLastUserCount(allUsers.length);
        
        console.log(`Found ${allUsers.length} total users: ${regularUsers.length} regular users, ${adminUsers.length} admins`);
        
        // Fetch bandwidth data for each user (both regular and admin)
        fetchRealUserBandwidth(snapshot.docs);
      })
      .catch(error => {
        handleFirestoreError(error, 'initial users fetch');
      });
    
    const unsub = onSnapshot(
      collection(db, "users"), 
      (snapshot) => {
        const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const regularUsers = allUsers.filter(user => user.role === 'user');
        const adminUsers = allUsers.filter(user => user.role === 'admin');
        
        setUserCount(regularUsers.length);
        setRealUsers(allUsers); // Store ALL users for monitoring
        
        // Check for new user signups in real-time
        if (lastUserCount > 0 && allUsers.length > lastUserCount) {
          const newUsers = allUsers.slice(lastUserCount);
          const newUserNames = newUsers.map(u => u.email || u.phoneNumber).join(', ');
          setNewUserNotification(`New user(s) signed up: ${newUserNames}`);
          setTimeout(() => setNewUserNotification(''), 5000); // Clear after 5 seconds
        }
        setLastUserCount(allUsers.length);
        
        console.log(`Real-time update: ${allUsers.length} total users: ${regularUsers.length} regular users, ${adminUsers.length} admins`);
        
        // Fetch bandwidth data for each user (both regular and admin)
        fetchRealUserBandwidth(snapshot.docs);
      },
      (error) => {
        handleFirestoreError(error, 'users listener');
      }
    );
    return () => unsub();
  }, [getUserBandwidth]);

  // Listen to userStats collection to sync with actual user data (only users with 'user' role)
  useEffect(() => {
    console.log('Setting up userStats listener...');
    const unsub = onSnapshot(
      collection(db, "userStats"), 
      (snapshot) => {
        console.log('UserStats snapshot received:', snapshot.docs.length, 'users');
        const stats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filter to only include users with 'user' role
        const userStatsFiltered = stats.filter((stat: any) => stat.role === 'user' || !stat.role);
        setUserStats(userStatsFiltered);
        
        // Calculate total usage from actual user data (only users with 'user' role)
        const totalUsage = userStatsFiltered.reduce((sum, stat: any) => sum + (stat.currentUsage || 0), 0);
        setTotalBandwidthUsage(totalUsage);
        
        console.log(`Total bandwidth usage from ${userStatsFiltered.length} users: ${totalUsage.toFixed(2)} GB/h`);
        console.log('User stats for calculation:', userStatsFiltered.map((stat: any) => ({ email: stat.userEmail, usage: stat.currentUsage })));
      },
      (error) => {
        console.error('UserStats listener error:', error);
        handleFirestoreError(error, 'userStats listener');
      }
    );
    return () => unsub();
  }, []);

  // Listen to Firestore bandwidth collection (last 20 points, ordered by timestamp)
  useEffect(() => {
    console.log('Setting up bandwidth listener...');
    const q = query(collection(db, "bandwidth"), orderBy("timestamp", "desc"), limit(20));
    const unsub = onSnapshot(
      q, 
      (snapshot) => {
        console.log('Bandwidth snapshot received:', snapshot.docs.length, 'points');
        // Reverse to get oldest first for chart
        setRealTimeData(snapshot.docs.map(doc => doc.data()).reverse());
      },
      (error) => {
        console.error('Bandwidth listener error:', error);
        handleFirestoreError(error, 'bandwidth listener');
      }
    );
    return () => unsub();
  }, []);

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'desktop': return <Settings className="h-4 w-4" />;
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'laptop': return <Laptop className="h-4 w-4" />;
      case 'tv': return <Router className="h-4 w-4" />;
      case 'gaming': return <Activity className="h-4 w-4" />;
      default: return <Router className="h-4 w-4" />;
    }
  };

  const handleAddDevice = async () => {
    if (!newDevice.name || !newDevice.user || !newDevice.ip) {
      alert('Please fill in all required fields');
      return;
    }

    setIsAddingDevice(true);
    try {
      const deviceData = {
        ...newDevice,
        status: 'active',
        lastSeen: new Date(),
        createdAt: new Date()
      };

      await addDoc(collection(db, "devices"), deviceData);
      console.log('Device added successfully');
      
      // Reset form
      setNewDevice({
        name: '',
        type: 'desktop',
        user: '',
        ip: '',
        usage: 0
      });
      setShowAddDevice(false);
    } catch (error) {
      console.error('Error adding device:', error);
      handleFirestoreError(error, 'add device');
    } finally {
      setIsAddingDevice(false);
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      try {
        await deleteDoc(doc(db, "devices", deviceId));
        console.log('Device deleted successfully');
      } catch (error) {
        console.error('Error deleting device:', error);
        handleFirestoreError(error, 'delete device');
      }
    }
  };

  // Generate sample devices if no real devices exist
  const sampleDevices = [
    { id: 'sample1', name: 'Admin Desktop', usage: 2.5, type: 'desktop', status: 'active' },
    { id: 'sample2', name: 'Marketing Laptop', usage: 1.8, type: 'laptop', status: 'active' },
    { id: 'sample3', name: 'Sales Mobile', usage: 0.5, type: 'mobile', status: 'active' },
    { id: 'sample4', name: 'Conference TV', usage: 0.8, type: 'tv', status: 'active' },
    { id: 'sample5', name: 'Gaming PC', usage: 3.2, type: 'gaming', status: 'active' }
  ];

  // Filter devices to only show those assigned to users with 'user' role
  const userEmails = userStats.map((stat: any) => stat.userEmail).filter(Boolean);
  const displayDevices = devices.filter(device => userEmails.includes(device.user));

  // Calculate total bandwidth safely
  const totalBandwidth = displayDevices.reduce(
    (sum, device) => sum + (typeof device.usage === 'number' ? device.usage : 0),
    0
  );


  // Calculate total usage for all active devices
  const totalActiveUsage = devices.filter(device => device.status === 'active').reduce((sum, device) => sum + (typeof device.usage === 'number' ? device.usage : 0), 0);

  // Calculate network load percentage (assuming max capacity of 10 GB/h)
  const maxNetworkCapacity = 10; // GB/h
  const networkLoadPercentage = Math.min(100, Math.max(0, (totalActiveUsage / maxNetworkCapacity) * 100));

  // Real-time bandwidth chart data from network monitoring
  const [bandwidthChartData, setBandwidthChartData] = useState([]);
  const intervalRef = useRef<NodeJS.Timeout | undefined>();
  const dataCollectionRef = useRef<NodeJS.Timeout | undefined>();

  // Start real-time data collection for admin dashboard using real network data
  const startAdminDataCollection = async () => {
    if (dataCollectionRef.current) return;
    
    dataCollectionRef.current = setInterval(async () => {
      try {
        // Use real network data instead of simulated data
        if (hasRealData && currentBandwidth) {
          const timestamp = new Date();
          const totalUsage = bandwidthGBh.total; // Use real bandwidth in GB/h
          
          // Add to global bandwidth collection with real data
          await addDoc(collection(db, "bandwidth"), {
            totalUsage: totalUsage,
            timestamp: serverTimestamp(),
            createdAt: timestamp,
            deviceCount: realUsers.length,
            userCount: realUsers.length,
            maxNetworkCapacity: 100, // GB/h
            totalBandwidthUsage: totalUsage,
            source: 'realNetworkData',
            download: bandwidthGBh.download,
            upload: bandwidthGBh.upload
          });
        }
      } catch (error) {
        console.error('Error collecting admin real-time data:', error);
      }
    }, 5000); // Collect data every 5 seconds
  };

  // Stop admin data collection
  const stopAdminDataCollection = () => {
    if (dataCollectionRef.current) {
      clearInterval(dataCollectionRef.current);
      dataCollectionRef.current = undefined;
    }
  };

  // Update bandwidth chart data with real network data
  useEffect(() => {
    // Clear previous interval if any
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    if (hasRealData && bandwidthHistory.length > 0) {
      // Use real bandwidth history data
      const realChartData = bandwidthHistory.map(entry => ({
        timestamp: entry.timestamp,
        totalUsage: (entry.total * 0.45), // Convert to GB/h
        download: (entry.download * 0.45),
        upload: (entry.upload * 0.45)
      }));
      setBandwidthChartData(realChartData);
      
      // Update chart data every 5 seconds with new real data
      intervalRef.current = setInterval(() => {
        if (hasRealData && currentBandwidth) {
          setBandwidthChartData(prev => [
            ...prev.slice(-59), // keep last 59 points for a 1-minute window
            {
              timestamp: Date.now(),
              totalUsage: bandwidthGBh.total,
              download: bandwidthGBh.download,
              upload: bandwidthGBh.upload
            }
          ]);
        }
      }, 5000);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasRealData, bandwidthHistory, currentBandwidth, bandwidthGBh]);

  // Start admin data collection when real network data is available
  useEffect(() => {
    if (hasRealData) {
      startAdminDataCollection();
    }
    
    return () => {
      stopAdminDataCollection();
    };
  }, [hasRealData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAdminDataCollection();
    };
  }, []);

  const [manageUserDialogOpen, setManageUserDialogOpen] = useState(false);
  const [userToManage, setUserToManage] = useState(null);

  // Dismiss user from Firestore
  const handleDismissUser = async () => {
    if (!userToManage) return;
    try {
      await deleteDoc(doc(db, "users", userToManage.id));
      setManageUserDialogOpen(false);
      setUserToManage(null);
    } catch (error) {
      handleFirestoreError(error, 'dismiss user');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {readOnly && (
        <div className="bg-yellow-600 text-white text-center py-2 font-semibold">
          Read-only access: You do not have permission to modify data.
        </div>
      )}
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-red-400" />
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* New User Notification */}
        {newUserNotification && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-400" />
              <span className="text-green-400 font-medium">{newUserNotification}</span>
            </div>
          </div>
        )}
        
        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border-slate-700">
            <TabsTrigger value="overview" className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="visitors" className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white">
              Visitors Net
            </TabsTrigger>
            <TabsTrigger value="devices" className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white">
              Devices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Real-Time Network Data Status */}
            <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${hasRealData ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-white">
                    Real-time network monitoring: {hasRealData ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-sm text-slate-400">
                  {hasRealData ? (
                    <>
                      Monitoring {activeInterfaces.length} network interfaces
                      {currentBandwidth && (
                        <span className="ml-2">
                          • Current: {(currentBandwidth.total * 0.45).toFixed(2)} GB/h
                        </span>
                      )}
                    </>
                  ) : (
                    'Network monitor server not running'
                  )}
                </div>
              </div>
            </div>

            {/* User Summary */}
            <Card className="bg-slate-800/50 border-slate-700 mb-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  Real-Time User Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                    <div className="text-2xl font-bold text-white">{realUsers.length}</div>
                    <div className="text-sm text-slate-400">Total Users</div>
                  </div>
                  <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">
                      {realUsers.filter(u => u.role === 'user').length}
                    </div>
                    <div className="text-sm text-slate-400">Regular Users</div>
                  </div>
                  <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                    <div className="text-2xl font-bold text-red-400">
                      {realUsers.filter(u => u.role === 'admin').length}
                    </div>
                    <div className="text-sm text-slate-400">Administrators</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Users</p>
                  <p className="text-2xl font-bold text-white">{userCount}</p>
                  <p className="text-xs text-slate-500">Total users excluding admins</p>
                </div>
                <Users className="h-8 w-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>



          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Real User Bandwidth</p>
                  <p className="text-2xl font-bold text-white">{(totalBandwidthUsage * 0.45).toFixed(2)} GB/h</p>
                  <p className="text-xs text-slate-500">From {realUsers.length} real users (converted to GB/h)</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">System Bandwidth</p>
                  <p className="text-2xl font-bold text-white">{hasRealData ? (currentBandwidth.total * 0.45).toFixed(2) : '0.00'} GB/h</p>
                  <p className="text-xs text-slate-500">Current system total (converted to GB/h)</p>
                </div>
                <Shield className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Network Interfaces</p>
                  <p className="text-2xl font-bold text-white">{activeInterfaces.length}</p>
                  <p className="text-xs text-slate-500">Active interfaces</p>
                </div>
                <Activity className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Users Real-Time Monitoring */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-400" />
                All Users Real-Time Monitoring
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchRealUserBandwidth(realUsers.map(u => ({ data: () => u })))}
                disabled={networkLoading}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Manage All Users
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {realUsers.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Users className="h-12 w-12 mx-auto mb-4 text-slate-600" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {realUsers.map((user) => {
                  const userData = realUserBandwidth[user.email];
                  return (
                    <div key={user.id} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-white">{user.email}</h3>
                              <Badge 
                                variant="outline" 
                                className={user.role === 'admin' ? 'border-red-500 text-red-400' : 'border-blue-500 text-blue-400'}
                              >
                                {user.role === 'admin' ? 'Admin' : 'User'}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-400">User ID: {user.id}</p>
                          </div>
                          
                          {userData && (
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <div className="text-lg font-bold text-green-400">
                                  {userData.bandwidth.current.total.toFixed(2)} Mbps
                                </div>
                                <div className="text-xs text-slate-400">Current Total</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-blue-400">
                                  {userData.bandwidth.current.download.toFixed(2)} Mbps
                                </div>
                                <div className="text-xs text-slate-400">Download</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-purple-400">
                                  {userData.bandwidth.current.upload.toFixed(2)} Mbps
                                </div>
                                <div className="text-xs text-slate-400">Upload</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-yellow-400">
                                  {userData.bandwidth.total.usageGB.toFixed(2)} GB
                                </div>
                                <div className="text-xs text-slate-400">Total Usage</div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {userData ? (
                            <Badge variant="outline" className="border-green-500 text-green-400">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-gray-500 text-gray-400">
                              No Data
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setUserToManage(user); setManageUserDialogOpen(true); }}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                          >
                            Manage
                          </Button>
                        </div>
                      </div>
                      
                      {userData && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3 bg-slate-700/20 rounded-lg">
                            <h4 className="font-medium text-white mb-2">Machine Info</h4>
                            <div className="text-sm text-slate-300 space-y-1">
                              <div>Hostname: {userData.user.machine.hostname}</div>
                              <div>Platform: {userData.user.machine.platform}</div>
                              <div>Architecture: {userData.user.machine.arch}</div>
                            </div>
                          </div>
                          <div className="p-3 bg-slate-700/20 rounded-lg">
                            <h4 className="font-medium text-white mb-2">System Resources</h4>
                            <div className="text-sm text-slate-300 space-y-1">
                              <div>CPU: {userData.system.cpu.model}</div>
                              <div>CPU Load: {(userData.system.cpu.load * 100).toFixed(1)}%</div>
                              <div>Memory: {((userData.system.memory.used / userData.system.memory.total) * 100).toFixed(1)}% used</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Dismiss User Dialog */}
                <Dialog open={manageUserDialogOpen} onOpenChange={setManageUserDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Manage User</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <p>Are you sure you want to dismiss this user?</p>
                      <p className="mt-2 font-bold text-red-500">{userToManage?.email}</p>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setManageUserDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleDismissUser}>
                        Dismiss User
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Real-Time Bandwidth Usage (GB/h)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={bandwidthChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#9CA3AF"
                    tickFormatter={ts => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  />
                  <YAxis stroke="#9CA3AF" unit=" GB/h" />
                  <Tooltip
                    labelFormatter={ts => new Date(ts).toLocaleString()}
                    formatter={(value, name) => [`${value} GB/h`, name === 'download' ? 'Download' : name === 'upload' ? 'Upload' : 'Total']}
                  />
                  <Line
                    type="monotone"
                    dataKey="download"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                    name="Download"
                  />
                  <Line
                    type="monotone"
                    dataKey="upload"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={false}
                    name="Upload"
                  />
                  <Line
                    type="monotone"
                    dataKey="totalUsage"
                    stroke="#06B6D4"
                    strokeWidth={2}
                    dot={false}
                    name="Total"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Network Interface Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={activeInterfaces}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="iface" stroke="#9CA3AF" angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                    formatter={(value, name) => [value, name === 'speed' ? 'Speed (Mbps)' : name]}
                  />
                  <Bar dataKey="speed" fill="#3B82F6" isAnimationActive={true} animationDuration={1200} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>



        {/* Real Network Interfaces */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Real Network Interfaces</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hasRealData && activeInterfaces.length > 0 ? (
                activeInterfaces.map((iface, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        <span className="text-white font-medium">{iface.iface}</span>
                      </div>
                      <Badge variant="outline" className="border-slate-600 text-slate-300">
                        {iface.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-slate-400 text-sm">IP Address</p>
                        <p className="text-white font-mono">{iface.ip4}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-sm">Status</p>
                        <p className="text-white">{iface.operstate}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-sm">Speed</p>
                        <p className="text-white">{iface.speed ? `${iface.speed} Mbps` : 'Unknown'}</p>
                      </div>
                      <div className="w-32">
                        <Progress
                          value={iface.operstate === 'up' ? 100 : 0}
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  {hasRealData ? 'No network interfaces found' : 'Network monitor server not running'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Active Users (Total Users Excluding Admins)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userCount > 0 ? (
                <div className="text-center py-4">
                  <p className="text-white text-lg font-semibold">{userCount} Users</p>
                  <p className="text-slate-400 text-sm">Total registered users excluding administrators</p>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  No users registered yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </TabsContent>

          <TabsContent value="visitors" className="space-y-6">
            <VisitorsNetworkManager />
          </TabsContent>

          <TabsContent value="devices" className="space-y-6">
            {/* Devices Management */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Router className="h-5 w-5 text-blue-400" />
                    Device Management
                  </div>
                  {!readOnly && (
                    <Dialog open={showAddDevice} onOpenChange={setShowAddDevice}>
                      <DialogTrigger asChild>
                        <Button className="bg-green-600 hover:bg-green-700">
                          Add Device
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Device</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="deviceName">Device Name</Label>
                            <Input
                              id="deviceName"
                              value={newDevice.name}
                              onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
                              placeholder="Enter device name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="deviceType">Device Type</Label>
                            <Select value={newDevice.type} onValueChange={(value) => setNewDevice({...newDevice, type: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="desktop">Desktop</SelectItem>
                                <SelectItem value="laptop">Laptop</SelectItem>
                                <SelectItem value="mobile">Mobile</SelectItem>
                                <SelectItem value="tablet">Tablet</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="deviceUser">User Email</Label>
                            <Input
                              id="deviceUser"
                              value={newDevice.user}
                              onChange={(e) => setNewDevice({...newDevice, user: e.target.value})}
                              placeholder="Enter user email"
                            />
                          </div>
                          <div>
                            <Label htmlFor="deviceIP">IP Address</Label>
                            <Input
                              id="deviceIP"
                              value={newDevice.ip}
                              onChange={(e) => setNewDevice({...newDevice, ip: e.target.value})}
                              placeholder="Enter IP address"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowAddDevice(false)} className="border-slate-600 text-slate-300">
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleAddDevice} 
                            disabled={isAddingDevice}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {isAddingDevice ? 'Adding...' : 'Add Device'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {devices.map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(device.type)}
                          <span className="text-white font-medium">{device.name}</span>
                        </div>
                        <Badge
                          variant={device.status === 'active' ? 'default' : 'secondary'}
                          className={device.status === 'active' ? 'bg-green-600' : 'bg-gray-600'}
                        >
                          {device.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-slate-400 text-sm">User</p>
                          <p className="text-white">{device.user}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400 text-sm">IP Address</p>
                          <p className="text-white">{device.ip}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400 text-sm">Usage</p>
                          <p className="text-white">{device.usage} GB/h</p>
                        </div>
                        <div className="w-32">
                          <Progress
                            value={(device.usage / 5) * 100}
                            className="h-2"
                          />
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
                              Manage
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage Device</DialogTitle>
                            </DialogHeader>
                            <p>Do you want to disconnect this device?</p>
                            <DialogFooter>
                              <Button variant="destructive" onClick={async () => {
                                await updateDoc(doc(db, "devices", device.id), { status: "inactive" });
                              }}>
                                Disconnect
                              </Button>
                              {device.status === 'inactive' && (
                                <Button variant="default" onClick={async () => {
                                  await updateDoc(doc(db, "devices", device.id), { status: "active" });
                                }}>
                                  Activate
                                </Button>
                              )}
                              {!readOnly && (
                                <Button 
                                  variant="destructive" 
                                  onClick={() => handleDeleteDevice(device.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </Button>
                              )}
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
