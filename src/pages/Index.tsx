import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Shield, Users, Activity, Wifi, Globe, Server, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRealNetwork } from "@/hooks/use-real-network";

const Index = () => {
  const navigate = useNavigate();
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  
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

  // Get real network interfaces instead of virtual networks
  const realNetworks = activeInterfaces.map((iface, index) => ({
    id: iface.iface,
    name: iface.iface,
    description: `${iface.type} - ${iface.ip4}`,
    status: iface.operstate === 'up' ? 'active' : 'inactive',
    type: iface.type,
    ip4: iface.ip4,
    mac: iface.mac,
    speed: iface.speed
  }));

  const loading = networkLoading;
  const networks = realNetworks;
  const useFallback = !hasRealData;

  const handleDashboardAccess = (type: 'admin' | 'user') => {
    if (type === 'user' && !selectedNetwork) {
      alert('Please select a network interface first');
      return;
    }
    sessionStorage.clear();
    sessionStorage.setItem('dashboardType', type);
    if (type === 'user') {
      sessionStorage.setItem('selectedNetwork', selectedNetwork);
    }
    navigate('/auth');
  };

  const currentNetworks = networks;

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

        {/* Virtual Network Selection - Only for Regular Users */}
        <div className="max-w-2xl mx-auto mb-12">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-500/20 rounded-full">
                  <Wifi className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              <CardTitle className="text-2xl text-white">Select Network Interface</CardTitle>
              <p className="text-slate-300 text-sm">
                Choose the network interface you want to monitor
              </p>
              {hasRealData && networks.length > 0 && (
                <div className="mt-2 p-2 bg-green-500/20 rounded-lg">
                  <p className="text-xs text-green-300">
                    ✅ Real-time data active
                  </p>
                </div>
              )}
              {!hasRealData && (
                <div className="mt-2 p-2 bg-yellow-500/20 rounded-lg">
                  <p className="text-xs text-yellow-300">
                    ⚠️ Network monitor server not running
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Available Network Interfaces</label>
                {loading ? (
                  <div className="p-4 text-center text-slate-400">Loading network interfaces...</div>
                ) : currentNetworks.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">
                    {hasRealData ? 'No network interfaces found' : 'Network monitor server not running'}
                  </div>
                ) : (
                  <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select a network interface..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {currentNetworks.map((network) => (
                        <SelectItem 
                          key={network.id} 
                          value={network.id}
                          className="text-white hover:bg-slate-700"
                        >
                          <div className="flex items-center gap-2">
                            <Wifi className="h-4 w-4" />
                            <div className="flex flex-col">
                              <span className="font-medium">{network.name}</span>
                              <span className="text-xs text-slate-400">{network.description}</span>
                              {network.speed && (
                                <span className="text-xs text-blue-400">{network.speed} Mbps</span>
                              )}
                            </div>
                            <div className={`ml-auto w-2 h-2 rounded-full ${
                              network.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'
                            }`}></div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              {selectedNetwork && (
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Wifi className="h-4 w-4" />
                    <span>Selected: </span>
                    <span className="font-medium text-white">
                      {currentNetworks.find(n => n.id === selectedNetwork)?.name}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    IP: {currentNetworks.find(n => n.id === selectedNetwork)?.ip4}
                  </div>
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

          {/* User Dashboard - Requires Network Selection */}
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
                disabled={!selectedNetwork || loading}
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
