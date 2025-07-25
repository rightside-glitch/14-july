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
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit, getDocs, updateDoc, doc } from "firebase/firestore";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useRef } from "react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [realTimeData, setRealTimeData] = useState([]);
  const [devices, setDevices] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const readOnly = user.role !== 'admin';

  // Listen to Firestore devices collection
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "devices"), (snapshot) => {
      setDevices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // Listen to Firestore users collection for user count
  useEffect(() => {
    // Initial fetch in case onSnapshot doesn't fire if collection is empty
    getDocs(collection(db, "users")).then(snapshot => {
      setUserCount(snapshot.size);
    });
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      setUserCount(snapshot.size);
    });
    return () => unsub();
  }, []);

  // Listen to Firestore bandwidth collection (last 20 points, ordered by timestamp)
  useEffect(() => {
    const q = query(collection(db, "bandwidth"), orderBy("timestamp", "desc"), limit(20));
    const unsub = onSnapshot(q, (snapshot) => {
      // Reverse to get oldest first for chart
      setRealTimeData(snapshot.docs.map(doc => doc.data()).reverse());
    });
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

  // Calculate total bandwidth safely
  const totalBandwidth = devices.reduce(
    (sum, device) => sum + (typeof device.usage === 'number' ? device.usage : 0),
    0
  );
  const activeDevices = devices.filter(device => device.status === 'active').length;

  // Calculate total usage for all active devices
  const totalActiveUsage = devices.filter(device => device.status === 'active').reduce((sum, device) => sum + (typeof device.usage === 'number' ? device.usage : 0), 0);

  // For the real-time bandwidth usage graph, use the sum of 'usage' from all devices
  const [bandwidthChartData, setBandwidthChartData] = useState([
    {
      timestamp: Date.now(),
      totalUsage: devices.reduce((sum, device) => sum + (typeof device.usage === 'number' ? device.usage : 0), 0)
    }
  ]);
  const intervalRef = useRef<NodeJS.Timeout | undefined>();

  useEffect(() => {
    // Clear previous interval if any
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setBandwidthChartData(prev => [
        ...prev.slice(-59), // keep last 59 points for a 1-minute window
        {
          timestamp: Date.now(),
          totalUsage: devices.reduce((sum, device) => sum + (typeof device.usage === 'number' ? device.usage : 0), 0)
        }
      ]);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [devices]);

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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-white">{userCount}</p>
                </div>
                <Users className="h-8 w-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Devices</p>
                  <p className="text-2xl font-bold text-white">{activeDevices}</p>
                </div>
                <Router className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Usage</p>
                  <p className="text-2xl font-bold text-white">{(Number(totalActiveUsage) || 0).toFixed(1)} GB/h</p>
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
                    formatter={value => [`${value} GB/h`, 'Total Usage']}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalUsage"
                    stroke="#06B6D4"
                    strokeWidth={2}
                    dot={false}
                    name="Total Usage"
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
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
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
