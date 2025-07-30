import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Shield, Users, Activity, Wifi, Globe, Server, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRealNetwork } from "@/hooks/use-real-network";

const Index = () => {
  const navigate = useNavigate();
  // Remove selectedNetwork state
  // const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  // Real network data hook
  const {
    networkStatus,
    systemInfo,
    isLoading: networkLoading,
    error: networkError,
    isConnected,
    activeInterfaces,
    hasRealData,
    checkServerHealth
  } = useRealNetwork();

  // Real-time available networks state
  const [availableNetworks, setAvailableNetworks] = useState<any[]>([]);
  const [loadingNetworks, setLoadingNetworks] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchNetworks = async () => {
      setLoadingNetworks(true);
      try {
        const res = await fetch('http://localhost:3001/api/network/interfaces');
        const data = await res.json();
        if (data.success) {
          setAvailableNetworks(data.data);
        } else {
          setAvailableNetworks([]);
        }
      } catch (err) {
        setAvailableNetworks([]);
      }
      setLoadingNetworks(false);
    };
    fetchNetworks();
    interval = setInterval(fetchNetworks, 5000);
    return () => clearInterval(interval);
  }, []);

  // Remove realNetworks, networks, currentNetworks, and useFallback logic
  const loading = networkLoading;

  // Update dashboard access logic
  const handleDashboardAccess = (type: 'admin' | 'user') => {
    sessionStorage.clear();
    sessionStorage.setItem('dashboardType', type);
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-cyan-500/20 rounded-full">
              <Activity className="h-12 w-12 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Real-Time Bandwidth Tracker
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Monitor and manage network bandwidth usage across all devices with real-time analytics and comprehensive reporting
          </p>
        </div>
        {/* Real-Time Available Networks Section */}
        <div className="max-w-3xl mx-auto mb-12">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-500/20 rounded-full">
                  <Wifi className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              <CardTitle className="text-2xl text-white">Available Network Interfaces</CardTitle>
              <p className="text-slate-300 text-sm">
                All currently detected network interfaces (auto-refreshes every 5 seconds)
              </p>
            </CardHeader>
            <CardContent>
              {loadingNetworks ? (
                <div className="p-4 text-center text-slate-400">Loading network interfaces...</div>
              ) : availableNetworks.length === 0 ? (
                <div className="p-4 text-center text-slate-400">No network interfaces found</div>
              ) : (
                <div className="space-y-3">
                  {availableNetworks.map((iface, idx) => (
                    <div key={iface.iface + idx} className="p-3 bg-slate-700/40 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-slate-600">
                      <div className="flex items-center gap-3">
                        <Wifi className="h-5 w-5 text-blue-400" />
                        <span className="font-medium text-white">{iface.iface}</span>
                        <span className="text-xs text-slate-400">{iface.type}</span>
                        {iface.ssid && <span className="text-xs text-cyan-400">SSID: {iface.ssid}</span>}
                        {iface.signalStrength && <span className="text-xs text-green-400">Signal: {iface.signalStrength}</span>}
                        <span className="text-xs text-slate-400">IP: {iface.ip4}</span>
                        <span className={`ml-2 w-2 h-2 rounded-full ${iface.operstate === 'up' ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                      </div>
                      <div className="flex gap-2 text-xs text-slate-400">
                        {iface.connectionType && <span>{iface.connectionType}</span>}
                        {iface.maxBandwidth && <span>Max: {iface.maxBandwidth}</span>}
                        <span>MAC: {iface.mac}</span>
                        <span>Speed: {iface.speed} Mbps</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Interface Selection */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Admin Dashboard - Direct Access */}
          <Card className="bg-slate-800/50 border-slate-700 hover:border-red-500/50 transition-all duration-300 cursor-pointer group">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-red-500/20 rounded-full group-hover:bg-red-500/30 transition-colors">
                  <Shield className="h-8 w-8 text-red-400" />
                </div>
              </div>
              <CardTitle className="text-2xl text-white">Admin Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-slate-300 mb-6">
                Full network control with device management, bandwidth allocation, and system configuration
              </p>
              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Device Management</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Bandwidth Allocation</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>System Analytics</span>
                </div>
              </div>
              <Button 
                className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white"
                onClick={() => handleDashboardAccess('admin')}
              >
                Access Admin Panel
              </Button>
            </CardContent>
          </Card>
          {/* User Dashboard - No network selection required */}
          <Card className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer group">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-cyan-500/20 rounded-full group-hover:bg-cyan-500/30 transition-colors">
                  <Monitor className="h-8 w-8 text-cyan-400" />
                </div>
              </div>
              <CardTitle className="text-2xl text-white">User Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-slate-300 mb-6">
                Monitor your real network interfaces, view bandwidth statistics, and track data consumption
              </p>
              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Real-time Usage</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Device Statistics</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Usage History</span>
                </div>
              </div>
              <Button 
                className="mt-6 w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                onClick={() => handleDashboardAccess('user')}
                disabled={loading}
              >
                View My Usage
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
