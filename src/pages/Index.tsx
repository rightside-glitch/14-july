import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Shield, Users, Activity, Wifi, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db, handleFirestoreError } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

const Index = () => {
  const navigate = useNavigate();
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [networks, setNetworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  // Fallback networks (same as what's in Firestore)
  const fallbackNetworks = [
    { id: "corp-vpn", name: "Corporate VPN", description: "Secure corporate network access", status: "active" },
    { id: "guest-wifi", name: "Guest WiFi", description: "Public guest network", status: "active" },
    { id: "iot-network", name: "IoT Network", description: "Internet of Things devices", status: "active" },
    { id: "dmz", name: "DMZ Network", description: "Demilitarized zone for servers", status: "active" },
    { id: "backup-vpn", name: "Backup VPN", description: "Secondary VPN connection", status: "maintenance" }
  ];

  useEffect(() => {
    setLoading(true);
    
    const unsub = onSnapshot(
      collection(db, "virtualNetworks"),
      (snapshot) => {
        const networkData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNetworks(networkData);
        setLoading(false);
        setUseFallback(false);
      },
      (error) => {
        handleFirestoreError(error, 'fetching virtual networks');
        
        // If Firestore access fails, use fallback networks
        setNetworks(fallbackNetworks);
        setUseFallback(true);
        setLoading(false);
      }
    );
    
    return () => {
      unsub();
    };
  }, []);

  const handleDashboardAccess = (type: 'admin' | 'user') => {
    if (!selectedNetwork) {
      alert('Please select a virtual network first');
      return;
    }
    sessionStorage.clear();
    sessionStorage.setItem('dashboardType', type);
    sessionStorage.setItem('selectedNetwork', selectedNetwork);
    navigate('/auth');
  };

  const currentNetworks = useFallback ? fallbackNetworks : networks;

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

        {/* Virtual Network Selection */}
        <div className="max-w-2xl mx-auto mb-12">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-500/20 rounded-full">
                  <Wifi className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              <CardTitle className="text-2xl text-white">Select Virtual Network</CardTitle>
              <p className="text-slate-300 text-sm">
                Choose the virtual network you want to connect to and monitor
              </p>
              {!useFallback && networks.length > 0 && (
                <div className="mt-2 p-2 bg-green-500/20 rounded-lg">
                  <p className="text-xs text-green-300">
                    ✅ Real-time data active
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Available Networks</label>
                {loading ? (
                  <div className="p-4 text-center text-slate-400">Loading virtual networks...</div>
                ) : currentNetworks.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">
                    Loading networks...
                  </div>
                ) : (
                  <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select a virtual network..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {currentNetworks.map((network) => (
                        <SelectItem 
                          key={network.id} 
                          value={network.id}
                          className="text-white hover:bg-slate-700"
                        >
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <div className="flex flex-col">
                              <span className="font-medium">{network.name}</span>
                              <span className="text-xs text-slate-400">{network.description}</span>
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
                    <Globe className="h-4 w-4" />
                    <span>Selected: </span>
                    <span className="font-medium text-white">
                      {currentNetworks.find(n => n.id === selectedNetwork)?.name}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Interface Selection */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer group">
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
                disabled={!selectedNetwork || loading}
              >
                Access Admin Panel
              </Button>
            </CardContent>
          </Card>

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
                Monitor your device usage, view bandwidth statistics, and track data consumption
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
