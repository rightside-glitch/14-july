
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

const UserDashboard = () => {
  const navigate = useNavigate();
  const [currentUsage, setCurrentUsage] = useState(0);
  const [dailyData, setDailyData] = useState([
    { time: '00:00', download: 12, upload: 3 },
    { time: '04:00', download: 8, upload: 2 },
    { time: '08:00', download: 25, upload: 8 },
    { time: '12:00', download: 45, upload: 15 },
    { time: '16:00', download: 38, upload: 12 },
    { time: '20:00', download: 52, upload: 18 },
  ]);

  const deviceData = [
    { name: 'Laptop', value: 45, color: '#06B6D4' },
    { name: 'Phone', value: 25, color: '#10B981' },
    { name: 'Tablet', value: 20, color: '#8B5CF6' },
    { name: 'Other', value: 10, color: '#F59E0B' },
  ];

  const monthlyUsage = [
    { day: 'Week 1', usage: 45.2 },
    { day: 'Week 2', usage: 52.1 },
    { day: 'Week 3', usage: 38.7 },
    { day: 'Week 4', usage: 61.3 },
  ];

  // Simulate real-time usage updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentUsage(prev => {
        const newUsage = Math.random() * 10 + 15; // Random between 15-25
        return newUsage;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const dataAllowance = 100; // GB
  const usedData = 67.3; // GB
  const remainingData = dataAllowance - usedData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
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
                    <Badge className="bg-green-600">Online</Badge>
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
