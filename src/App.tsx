import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Auth from "@/pages/Auth";
import AdminDashboard from "@/pages/AdminDashboard";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import UserDashboard from "./pages/UserDashboard";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";

const queryClient = new QueryClient();

function App() {
  // Check if user is authenticated by verifying sessionStorage
  const isAuthenticated = !!sessionStorage.getItem('user');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route
              path="/auth"
              element={isAuthenticated ? <Navigate to="/dashboard" /> : <Auth />}
            />
            <Route
              path="/dashboard"
              element={
                isAuthenticated ? (
                  sessionStorage.getItem('dashboardType') === 'admin'
                    ? <AdminDashboard />
                    : sessionStorage.getItem('dashboardType') === 'user'
                      ? <UserDashboard />
                      : <Navigate to="/" />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
