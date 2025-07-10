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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [realTimeData, setRealTimeData] = useState([]);
  const [devices, setDevices] = useState([
    { id: 1, name: "Office Desktop", type: "desktop", ip: "192.168.1.100", usage: 2.5, status: "active", user: "John Doe" },
    { id: 2, name: "iPhone 12", type: "mobile", ip: "192.168.1.101", usage: 0.8, status: "active", user: "Jane Smith" },
    { id: 3, name: "MacBook Pro", type: "laptop", ip: "192.168.1.102", usage: 1.2, status: "active", user: "Mike Johnson" },
    { id: 4, name: "Smart TV", type: "tv", ip: "192.168.1.103", usage: 4.2, status: "active", user: "Living Room" },
    { id: 5, name: "Gaming Console", type: "gaming", ip: "192.168.1.104", usage: 3.1, status: "idle", user: "Alex Wilson" },
  ]);

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newDataPoint = {
        time: new Date().toLocaleTimeString(),
        bandwidth: Math.floor(Math.random() * 100) + 50,
        devices: devices.length,
      };
      
      setRealTimeData(prev => {
        const updated = [...prev, newDataPoint];
        return updated.slice(-20); // Keep last 20 data points
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [devices.length]);

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

  const totalBandwidth = devices.reduce((sum, device) => sum + device.usage, 0);
  const activeDevices = devices.filter(device => device.status === 'active').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Devices</p>
                  <p className="text-2xl font-bold text-white">{activeDevices}</p>
                </div>
                <Users className="h-8 w-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Usage</p>
                  <p className="text-2xl font-bold text-white">{totalBandwidth.toFixed(1)} GB/h</p>
                </div>
                <Activity className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Network Load</p>
                  <p className="text-2xl font-bold text-white">67%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Alerts</p>
                  <p className="text-2xl font-bold text-white">2</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Real-Time Bandwidth Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={realTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bandwidth" 
                    stroke="#06B6D4" 
                    strokeWidth={2}
                    dot={{ fill: '#06B6D4', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Device Usage Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={devices}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="usage" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Device Management */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Device Management</CardTitle>
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
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
