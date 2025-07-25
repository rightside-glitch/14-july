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
import { collection, doc, onSnapshot } from "firebase/firestore";

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

  useEffect(() => {
    if (!user.uid) return;
    // Listen to userStats/{uid} document for all stats
    const unsubStats = onSnapshot(doc(db, 'userStats', user.uid), (docSnap) => {
      const data = docSnap.data();
      if (!data) return;
      setCurrentUsage(data.currentUsage || 0);
      setDailyData(data.dailyData || []);
      setDeviceData(data.deviceData || []);
      setMonthlyUsage(data.monthlyUsage || []);
      setUsedData(data.usedData || 0);
    });
    // Listen to devices/{uid} for device status
    const unsubDevice = onSnapshot(doc(db, 'devices', user.uid), (docSnap) => {
      const data = docSnap.data();
      if (data && data.status) setDeviceStatus(data.status);
    });
    return () => {
      unsubStats();
      unsubDevice();
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
