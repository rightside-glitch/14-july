import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Monitor, 
  Activity, 
  Download, 
  Upload, 
  Wifi,
  Home,
  Calendar,
  Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { db } from "@/lib/firebase";
import { collection, doc, onSnapshot, query, orderBy, limit } from "firebase/firestore";

const UserDashboard = () => {
  const navigate = useNavigate();
  const [currentUsage, setCurrentUsage] = useState(0);
  const [dailyData, setDailyData] = useState([]);
  const [deviceData, setDeviceData] = useState([]);
  const [monthlyUsage, setMonthlyUsage] = useState([]);
  const [usedData, setUsedData] = useState(0);
  const [deviceStatus, setDeviceStatus] = useState('active');
  const dataAllowance = 100; // GB
  const remainingData = dataAllowance - usedData;
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const readOnly = user.role !== 'admin';
  const [userBandwidthData, setUserBandwidthData] = useState([]);

  useEffect(() => {
    if (!user.uid) return;
    
    // Only allow regular users to access their own data
    if (user.role === 'admin') {
      console.log('Admin user detected, redirecting to admin dashboard');
      navigate('/admin');
      return;
    }
    
    console.log('Setting up user dashboard listeners for regular user');

    // Fallback sample data
    const sampleStats = {
      currentUsage: 12.5,
      dailyData: generateDailyData(),
      deviceData: [
        { name: 'Laptop', value: 60, color: '#06B6D4' },
        { name: 'Phone', value: 40, color: '#10B981' }
      ],
      monthlyUsage: generateWeeklyData(),
      usedData: 23.4
    };
    
    // Listen to userStats/{uid} document for all stats
    const unsubStats = onSnapshot(
      doc(db, 'userStats', user.uid), 
      (docSnap) => {
        const data = docSnap.data();
        if (!data) {
          console.log('No userStats data found, using sample data');
          setCurrentUsage(sampleStats.currentUsage);
          setDailyData(sampleStats.dailyData);
          setDeviceData(sampleStats.deviceData);
          setMonthlyUsage(sampleStats.monthlyUsage);
          setUsedData(sampleStats.usedData);
        } else {
          setCurrentUsage(data.currentUsage || 0);
          setDailyData(data.dailyData || generateDailyData());
          setDeviceData(data.deviceData || []);
          setMonthlyUsage(data.monthlyUsage || generateWeeklyData());
          setUsedData(data.usedData || 0);
        }
      },
      (error) => {
        console.error('UserStats listener error:', error);
        if (error.code === 'permission-denied') {
          console.error('Permission denied: User cannot access userStats');
        }
      }
    );
    
    // Listen to devices/{uid} for device status
    const unsubDevice = onSnapshot(
      doc(db, 'devices', user.uid), 
      (docSnap) => {
        const data = docSnap.data();
        if (data && data.status) setDeviceStatus(data.status);
      },
      (error) => {
        console.error('Device listener error:', error);
        if (error.code === 'permission-denied') {
          console.error('Permission denied: User cannot access device data');
        }
      }
    );
    
    // Listen to per-user real-time bandwidth data
    const q = query(
      collection(db, 'userBandwidth', user.uid, 'data'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    const unsubBandwidth = onSnapshot(q, (snapshot) => {
      // Reverse to get oldest first for chart
      setUserBandwidthData(snapshot.docs.map(doc => doc.data()).reverse());
    });
    
    return () => {
      unsubStats();
      unsubDevice();
      unsubBandwidth();
    };
  }, [user.uid, user.role, navigate]);

  // Regenerate dynamic data when usage changes
  useEffect(() => {
    if (currentUsage > 0 || usedData > 0) {
      setDailyData(generateDailyData());
      setMonthlyUsage(generateWeeklyData());
    }
  }, [currentUsage, usedData]);

  // Generate dynamic daily usage data based on current time
  function generateDailyData() {
    const data = [];
    const now = new Date();
    const currentHour = now.getHours();
    
    for (let i = 0; i < 24; i++) {
      const hour = (currentHour - 23 + i + 24) % 24;
      const time = `${hour.toString().padStart(2, '0')}:00`;
      const baseUsage = currentUsage || 1.5;
      const variation = Math.sin(i * 0.3) * 0.8 + Math.random() * 0.5;
      data.push({
        time,
        download: Math.max(0, baseUsage + variation),
        upload: Math.max(0, (baseUsage * 0.3) + variation * 0.2)
      });
    }
    return data;
  }

  // Generate dynamic weekly usage data
  function generateWeeklyData() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = [];
    const baseUsage = usedData / 7 || 3.5;
    
    days.forEach((day, index) => {
      const variation = Math.sin(index * 0.5) * 2 + Math.random() * 1.5;
      data.push({
        day,
        usage: Math.max(0, baseUsage + variation)
      });
    });
    return data;
  }

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
              <Monitor className="h-8 w-8 text-cyan-400" />
              <h1 className="text-2xl font-bold text-white">My Usage Dashboard</h1>
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
        {/* Real-Time Bandwidth Graph */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Real-Time Bandwidth Usage (GB/h)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userBandwidthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="timestamp"
                  stroke="#9CA3AF"
                  tickFormatter={ts => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                />
                <YAxis stroke="#9CA3AF" unit=" GB/h" />
                <Tooltip
                  labelFormatter={ts => new Date(ts).toLocaleString()}
                  formatter={value => [`${value} GB/h`, 'Usage']}
                />
                <Line
                  type="monotone"
                  dataKey="usage"
                  stroke="#06B6D4"
                  strokeWidth={2}
                  dot={false}
                  name="Usage"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Show message if no data is available */}
        {dailyData.length === 0 && deviceData.length === 0 && monthlyUsage.length === 0 && (
          <div className="bg-yellow-700 text-white text-center py-2 mb-4 rounded">
            No usage data available. Showing sample data.
          </div>
        )}
        {/* Current Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Current Speed</p>
                  <p className="text-2xl font-bold text-white">{currentUsage.toFixed(1)} Mbps</p>
                </div>
                <Activity className="h-8 w-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Data Used</p>
                  <p className="text-2xl font-bold text-white">{usedData} GB</p>
                </div>
                <Download className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Remaining</p>
                  <p className="text-2xl font-bold text-white">{remainingData.toFixed(1)} GB</p>
                </div>
                <Upload className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Connection</p>
                  <p className="text-2xl font-bold text-white">
                    {deviceStatus === 'active' ? (
                      <Badge className="bg-green-600">Online</Badge>
                    ) : (
                      <Badge className="bg-gray-600">Offline</Badge>
                    )}
                  </p>
                </div>
                <Wifi className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Usage Overview */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Monthly Data Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Data Allowance: {dataAllowance} GB</span>
                <span className="text-white">{((usedData / dataAllowance) * 100).toFixed(1)}% used</span>
              </div>
              <Progress 
                value={(usedData / dataAllowance) * 100} 
                className="h-3"
              />
              <div className="flex justify-between text-sm">
                <span className="text-green-400">{usedData} GB used</span>
                <span className="text-slate-400">{remainingData.toFixed(1)} GB remaining</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Usage Pattern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
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
                    dataKey="download" 
                    stroke="#06B6D4" 
                    strokeWidth={2}
                    name="Download"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="upload" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Upload"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Usage by Device</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Usage Trend */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Weekly Usage Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9CA3AF" />
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
                  dataKey="usage" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;
