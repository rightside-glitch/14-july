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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [realTimeData, setRealTimeData] = useState([]);
  const [devices, setDevices] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [networkLoad, setNetworkLoad] = useState(0);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDevice, setNewDevice] = useState({
    name: '',
    type: 'desktop',
    user: '',
    ip: '',
    usage: 0
  });
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const readOnly = user.role !== 'admin';

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

  // Listen to Firestore users collection for user count (excluding admins)
  useEffect(() => {
    console.log('Setting up users listener...');
    // Initial fetch in case onSnapshot doesn't fire if collection is empty
    getDocs(collection(db, "users"))
      .then(snapshot => {
        const regularUsers = snapshot.docs.filter(doc => doc.data().role !== 'admin');
        setUserCount(regularUsers.length);
      })
      .catch(error => {
        handleFirestoreError(error, 'initial users fetch');
      });
    
    const unsub = onSnapshot(
      collection(db, "users"), 
      (snapshot) => {
        const regularUsers = snapshot.docs.filter(doc => doc.data().role !== 'admin');
        setUserCount(regularUsers.length);
      },
      (error) => {
        handleFirestoreError(error, 'users listener');
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

  // Use real devices if available, otherwise use sample data
  const displayDevices = devices.length > 0 ? devices : sampleDevices;

  // Calculate total bandwidth safely
  const totalBandwidth = displayDevices.reduce(
    (sum, device) => sum + (typeof device.usage === 'number' ? device.usage : 0),
    0
  );
  const activeDevices = displayDevices.filter(device => device.status === 'active').length;

  // Calculate total usage for all active devices
  const totalActiveUsage = devices.filter(device => device.status === 'active').reduce((sum, device) => sum + (typeof device.usage === 'number' ? device.usage : 0), 0);

  // Calculate network load percentage (assuming max capacity of 10 GB/h)
  const maxNetworkCapacity = 10; // GB/h
  const networkLoadPercentage = Math.min(100, Math.max(0, (totalActiveUsage / maxNetworkCapacity) * 100));

  // For the real-time bandwidth usage graph, use the sum of 'usage' from all devices
  const [bandwidthChartData, setBandwidthChartData] = useState([
    {
      timestamp: Date.now(),
      totalUsage: devices.reduce((sum, device) => sum + (typeof device.usage === 'number' ? device.usage : 0), 0)
    }
  ]);
  const intervalRef = useRef<NodeJS.Timeout | undefined>();
  const dataCollectionRef = useRef<NodeJS.Timeout | undefined>();

  // Generate sample data if no real data exists
  const generateSampleBandwidthData = () => {
    const now = Date.now();
    const sampleData = [];
    for (let i = 59; i >= 0; i--) {
      const timestamp = now - (i * 1000);
      const baseUsage = 2.5; // Base usage in GB/h
      const variation = Math.sin(i * 0.1) * 1.5; // Add some variation
      sampleData.push({
        timestamp,
        totalUsage: Math.max(0, baseUsage + variation)
      });
    }
    return sampleData;
  };

  // Start real-time data collection for admin dashboard
  const startAdminDataCollection = async () => {
    if (dataCollectionRef.current) return;
    
    dataCollectionRef.current = setInterval(async () => {
      try {
        const totalUsage = devices.reduce((sum, device) => sum + (typeof device.usage === 'number' ? device.usage : 0), 0);
        const timestamp = new Date();
        
        // Add to global bandwidth collection
        await addDoc(collection(db, "bandwidth"), {
          totalUsage,
          timestamp: serverTimestamp(),
          createdAt: timestamp,
          deviceCount: devices.length,
          activeDeviceCount: devices.filter(d => d.status === 'active').length
        });

        // Add device-specific usage data
        for (const device of devices) {
          if (device.status === 'active' && device.usage > 0) {
            await addDoc(collection(db, `deviceUsage/${device.id}/data`), {
              usage: device.usage,
              timestamp: serverTimestamp(),
              createdAt: timestamp,
              deviceName: device.name,
              deviceType: device.type,
              user: device.user
            });
          }
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

  useEffect(() => {
    // Clear previous interval if any
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    // If no devices, generate sample data
    if (devices.length === 0) {
      console.log('No devices found, generating sample bandwidth data');
      setBandwidthChartData(generateSampleBandwidthData());
    } else {
      intervalRef.current = setInterval(() => {
        setBandwidthChartData(prev => [
          ...prev.slice(-59), // keep last 59 points for a 1-minute window
          {
            timestamp: Date.now(),
            totalUsage: devices.reduce((sum, device) => sum + (typeof device.usage === 'number' ? device.usage : 0), 0)
          }
        ]);
      }, 5000);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [devices]);

  // Start admin data collection when devices are loaded
  useEffect(() => {
    if (devices.length > 0) {
      startAdminDataCollection();
    }
    
    return () => {
      stopAdminDataCollection();
    };
  }, [devices]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAdminDataCollection();
    };
  }, []);

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
        {/* Real-Time Data Collection Status */}
        <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${dataCollectionRef.current ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-white">
                Real-time data collection: {dataCollectionRef.current ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="text-sm text-slate-400">
              Collecting data every 5 seconds from {devices.length} devices
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Users (excluding Admins)</p>
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
                  <p className="text-2xl font-bold text-white">{networkLoadPercentage.toFixed(1)}%</p>
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
                  <Bar dataKey="usage" fill="#10B981" isAnimationActive={true} animationDuration={1200} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Device Management */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Device Management</CardTitle>
              {!readOnly && (
                <Dialog open={showAddDevice} onOpenChange={setShowAddDevice}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Activity className="h-4 w-4 mr-2" />
                      Add Device
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Add New Device</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="deviceName" className="text-slate-300">Device Name</Label>
                        <Input
                          id="deviceName"
                          value={newDevice.name}
                          onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
                          placeholder="e.g., John's Laptop"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="deviceType" className="text-slate-300">Device Type</Label>
                        <Select value={newDevice.type} onValueChange={(value) => setNewDevice({...newDevice, type: value})}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            <SelectItem value="desktop">Desktop</SelectItem>
                            <SelectItem value="laptop">Laptop</SelectItem>
                            <SelectItem value="mobile">Mobile</SelectItem>
                            <SelectItem value="tv">TV</SelectItem>
                            <SelectItem value="gaming">Gaming</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="deviceUser" className="text-slate-300">User Email</Label>
                        <Input
                          id="deviceUser"
                          type="email"
                          value={newDevice.user}
                          onChange={(e) => setNewDevice({...newDevice, user: e.target.value})}
                          placeholder="user@example.com"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="deviceIP" className="text-slate-300">IP Address</Label>
                        <Input
                          id="deviceIP"
                          value={newDevice.ip}
                          onChange={(e) => setNewDevice({...newDevice, ip: e.target.value})}
                          placeholder="192.168.1.100"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="deviceUsage" className="text-slate-300">Initial Usage (GB/h)</Label>
                        <Input
                          id="deviceUsage"
                          type="number"
                          step="0.1"
                          value={newDevice.usage}
                          onChange={(e) => setNewDevice({...newDevice, usage: parseFloat(e.target.value) || 0})}
                          placeholder="0.0"
                          className="bg-slate-700 border-slate-600 text-white"
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
            </div>
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
      </div>
    </div>
  );
};

export default AdminDashboard;
