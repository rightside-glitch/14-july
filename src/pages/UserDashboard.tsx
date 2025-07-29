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
  Home,
  Smartphone,
  Laptop,
  Settings,
  TrendingUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { db, handleFirestoreError } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit, doc, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";

const UserDashboard = () => {
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState({});
  const [userBandwidthData, setUserBandwidthData] = useState([]);
  const [hourlyUsageData, setHourlyUsageData] = useState([]);
  const [dailyUsageData, setDailyUsageData] = useState([]);
  const [deviceData, setDeviceData] = useState([]);
  const [assignedDevices, setAssignedDevices] = useState([]);
  const [userProfile, setUserProfile] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showSampleData, setShowSampleData] = useState(false);
  
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const readOnly = user.role === 'admin';

  // Real-time data collection interval
  const [dataCollectionInterval, setDataCollectionInterval] = useState(null);

  // Start real-time data collection
  const startDataCollection = async () => {
    if (dataCollectionInterval) return;
    
    const interval = setInterval(async () => {
      try {
        // Calculate current usage from assigned devices
        let deviceUsage = 0;
        if (assignedDevices.length > 0) {
          deviceUsage = assignedDevices.reduce((sum: number, device: any) => {
            return sum + (device.usage || 0);
          }, 0);
        }

        // Use actual user data from Firestore, fallback to device usage, then to random
        const currentUsage = (userStats as any).currentUsage || deviceUsage || Math.random() * 3 + 0.5;
        const timestamp = new Date();

        // Update userStats with current usage
        if (user.uid) {
          try {
            await updateDoc(doc(db, "userStats", user.uid), {
              currentUsage: currentUsage,
              lastUpdated: serverTimestamp()
            });
          } catch (error) {
            console.error('Error updating userStats:', error);
          }
        }

        // Add to real-time bandwidth collection
        await addDoc(collection(db, `userBandwidth/${user.uid}/data`), {
          usage: currentUsage,
          timestamp: serverTimestamp(),
          createdAt: timestamp,
          userEmail: user.email,
          userId: user.uid,
          source: 'deviceUsage',
          deviceCount: assignedDevices.length
        });

        // Add to hourly usage collection
        const hourKey = timestamp.toISOString().slice(0, 13) + ':00:00.000Z';
        await addDoc(collection(db, `userHourlyUsage/${user.uid}/data`), {
          hour: hourKey,
          usage: currentUsage,
          timestamp: serverTimestamp(),
          createdAt: timestamp,
          userEmail: user.email,
          source: 'deviceUsage'
        });

        // Add to daily usage collection
        const dayKey = timestamp.toISOString().slice(0, 10);
        await addDoc(collection(db, `userDailyUsage/${user.uid}/data`), {
          day: dayKey,
          usage: currentUsage,
          timestamp: serverTimestamp(),
          createdAt: timestamp,
          userEmail: user.email,
          source: 'deviceUsage'
        });

        // Update device usage if devices are assigned
        for (const device of assignedDevices) {
          if (device.status === 'active') {
            try {
              await updateDoc(doc(db, "devices", device.id), {
                usage: currentUsage / assignedDevices.length, // Distribute usage across devices
                lastSeen: serverTimestamp()
              });
            } catch (error) {
              console.error('Error updating device usage:', error);
            }
          }
        }

      } catch (error) {
        console.error('Error collecting real-time data:', error);
      }
    }, 5000); // Collect data every 5 seconds

    setDataCollectionInterval(interval);
  };

  // Stop data collection
  const stopDataCollection = () => {
    if (dataCollectionInterval) {
      clearInterval(dataCollectionInterval);
      setDataCollectionInterval(null);
    }
  };

  useEffect(() => {
    if (!user.uid) {
      navigate('/auth');
      return;
    }

    console.log('Setting up UserDashboard listeners for user:', user.uid);

    // Start data collection immediately
    startDataCollection();

    // Listen to user profile from users collection
    const unsubProfile = onSnapshot(
      doc(db, "users", user.uid),
      (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data());
        }
      },
      (error) => {
        console.error('User profile listener error:', error);
        handleFirestoreError(error, 'user profile listener');
      }
    );

    // Listen to user stats
    const unsubStats = onSnapshot(
      doc(db, "userStats", user.uid),
      (doc) => {
        if (doc.exists()) {
          const stats = doc.data();
          setUserStats(stats);
          setShowSampleData(false);
          
          // Start data collection with actual user data
          if (!dataCollectionInterval) {
            startDataCollection();
          }
        } else {
          setShowSampleData(true);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('User stats listener error:', error);
        handleFirestoreError(error, 'user stats listener');
        setShowSampleData(true);
        setIsLoading(false);
      }
    );

    // Listen to devices assigned to this user
    const unsubAssignedDevices = onSnapshot(
      query(
        collection(db, "devices"),
        orderBy("usage", "desc")
      ),
      (snapshot) => {
        const userDevices = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((device: any) => device.user === user.email);
        setAssignedDevices(userDevices);
        
        // Update current usage based on device usage
        if (userDevices.length > 0) {
          const totalDeviceUsage = userDevices.reduce((sum: number, device: any) => {
            return sum + (device.usage || 0);
          }, 0);
          
          // Update userStats with device usage
          if (user.uid && totalDeviceUsage > 0) {
            updateDoc(doc(db, "userStats", user.uid), {
              currentUsage: totalDeviceUsage,
              lastUpdated: serverTimestamp()
            }).catch(error => {
              console.error('Error updating userStats from devices:', error);
            });
          }
        }
      },
      (error) => {
        console.error('Assigned devices listener error:', error);
        handleFirestoreError(error, 'assigned devices listener');
      }
    );

    // Listen to real-time bandwidth data
    const unsubBandwidth = onSnapshot(
      query(
        collection(db, `userBandwidth/${user.uid}/data`),
        orderBy("timestamp", "desc"),
        limit(20)
      ),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.() || new Date()
        })).reverse();
        setUserBandwidthData(data);
      },
      (error) => {
        console.error('Bandwidth listener error:', error);
        handleFirestoreError(error, 'bandwidth listener');
      }
    );

    // Listen to hourly usage data
    const unsubHourly = onSnapshot(
      query(
        collection(db, `userHourlyUsage/${user.uid}/data`),
        orderBy("timestamp", "desc"),
        limit(24)
      ),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.() || new Date()
        })).reverse();
        
        // Group by hour and aggregate
        const hourlyData = data.reduce((acc: any, item: any) => {
          const hour = new Date(item.hour).getHours();
          const time = `${hour.toString().padStart(2, '0')}:00`;
          
          if (!acc[time]) {
            acc[time] = { time, download: 0, upload: 0, count: 0 };
          }
          acc[time].download += item.usage || 0;
          acc[time].upload += (item.usage || 0) * 0.3;
          acc[time].count += 1;
          return acc;
        }, {});

        // Convert to array and average the values
        const hourlyArray = Object.values(hourlyData).map((item: any) => ({
          ...item,
          download: item.download / item.count,
          upload: item.upload / item.count
        }));

        setHourlyUsageData(hourlyArray);
      },
      (error) => {
        console.error('Hourly usage listener error:', error);
        handleFirestoreError(error, 'hourly usage listener');
      }
    );

    // Listen to daily usage data
    const unsubDaily = onSnapshot(
      query(
        collection(db, `userDailyUsage/${user.uid}/data`),
        orderBy("timestamp", "desc"),
        limit(7)
      ),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.() || new Date()
        })).reverse();
        
        // Group by day and aggregate
        const dailyData = data.reduce((acc: any, item: any) => {
          const day = new Date(item.day).toLocaleDateString('en-US', { weekday: 'short' });
          
          if (!acc[day]) {
            acc[day] = { day, usage: 0, count: 0 };
          }
          acc[day].usage += item.usage || 0;
          acc[day].count += 1;
          return acc;
        }, {});

        // Convert to array and average the values
        const dailyArray = Object.values(dailyData).map((item: any) => ({
          ...item,
          usage: item.usage / item.count
        }));

        setDailyUsageData(dailyArray);
      },
      (error) => {
        console.error('Daily usage listener error:', error);
        handleFirestoreError(error, 'daily usage listener');
      }
    );

    return () => {
      stopDataCollection();
      unsubProfile();
      unsubStats();
      unsubAssignedDevices();
      unsubBandwidth();
      unsubHourly();
      unsubDaily();
    };
  }, [user.uid, user.role, navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDataCollection();
    };
  }, []);

  const { currentUsage = 0, usedData = 0, dataLimit = 100 } = userStats as any;
  const { name = user.email, role = 'user', department = 'General' } = userProfile as any;
  
  // Calculate current usage from assigned devices as fallback
  const deviceUsage = assignedDevices.reduce((sum: number, device: any) => {
    return sum + (device.usage || 0);
  }, 0);
  
  // Use device usage if userStats currentUsage is not available
  const displayCurrentUsage = currentUsage > 0 ? currentUsage : deviceUsage;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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
        {/* User Profile & Assigned Data */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">My Profile & Assigned Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 text-sm">Name</p>
                  <p className="text-white font-medium">{name}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Email</p>
                  <p className="text-white font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Role</p>
                  <Badge variant="outline" className="border-slate-600 text-slate-300">
                    {role}
                  </Badge>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Department</p>
                  <p className="text-white font-medium">{department}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 text-sm">Assigned Devices</p>
                  <p className="text-2xl font-bold text-white">{assignedDevices.length}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Data Limit</p>
                  <p className="text-2xl font-bold text-white">{dataLimit} GB</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Current Usage</p>
                  <p className="text-2xl font-bold text-white">{displayCurrentUsage.toFixed(1)} GB/h</p>
                  <p className="text-xs text-slate-500">
                    {currentUsage > 0 ? 'From userStats' : deviceUsage > 0 ? 'From devices' : 'Simulated'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 text-sm">Used This Month</p>
                  <p className="text-2xl font-bold text-white">{usedData.toFixed(1)} GB</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Remaining Data</p>
                  <p className="text-2xl font-bold text-white">{(dataLimit - usedData).toFixed(1)} GB</p>
                </div>
                <div className="w-full">
                  <Progress
                    value={(usedData / dataLimit) * 100}
                    className="h-3"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {((usedData / dataLimit) * 100).toFixed(1)}% used
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real-Time Data Collection Status */}
        <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${dataCollectionInterval ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-white">
                Real-time data collection: {dataCollectionInterval ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-400">
                Syncing with {assignedDevices.length} assigned devices
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={dataCollectionInterval ? stopDataCollection : startDataCollection}
                className="border-slate-600 text-slate-300"
              >
                {dataCollectionInterval ? 'Stop Collection' : 'Start Collection'}
              </Button>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Current usage syncs with: {assignedDevices.length > 0 ? 'Device usage from Firestore' : 'Simulated data'}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Debug: userStats={JSON.stringify({ currentUsage, usedData, dataLimit })} | 
            deviceUsage={deviceUsage.toFixed(2)} | 
            displayUsage={displayCurrentUsage.toFixed(2)} | 
            devices={assignedDevices.length}
          </div>
        </div>

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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Current Usage</p>
                  <p className="text-2xl font-bold text-white">{displayCurrentUsage.toFixed(1)} GB/h</p>
                  <p className="text-xs text-slate-500">
                    {currentUsage > 0 ? 'From userStats' : deviceUsage > 0 ? 'From devices' : 'Simulated'}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Used This Month</p>
                  <p className="text-2xl font-bold text-white">{usedData.toFixed(1)} GB</p>
                </div>
                <Download className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Data Limit</p>
                  <p className="text-2xl font-bold text-white">{dataLimit} GB</p>
                </div>
                <TrendingUp className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Data Usage</span>
                <span className="text-white">{((usedData / dataLimit) * 100).toFixed(1)}%</span>
              </div>
              <Progress value={(usedData / dataLimit) * 100} className="h-3" />
              <div className="flex justify-between text-xs text-slate-500">
                <span>{usedData.toFixed(1)} GB used</span>
                <span>{(dataLimit - usedData).toFixed(1)} GB remaining</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Today's Usage Pattern (Live Data)</CardTitle>
            </CardHeader>
            <CardContent>
              {hourlyUsageData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={hourlyUsageData}>
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
                    <Line type="monotone" dataKey="download" stroke="#3B82F6" strokeWidth={2} name="Download" />
                    <Line type="monotone" dataKey="upload" stroke="#10B981" strokeWidth={2} name="Upload" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-400">
                  Collecting live hourly data...
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Weekly Usage Trend (Live Data)</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyUsageData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyUsageData}>
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
                    <Bar dataKey="usage" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-400">
                  Collecting live daily data...
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Assigned Devices */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">My Assigned Devices</CardTitle>
          </CardHeader>
          <CardContent>
            {assignedDevices.length > 0 ? (
              <div className="space-y-4">
                {assignedDevices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {device.type === 'mobile' && <Smartphone className="h-4 w-4" />}
                        {device.type === 'laptop' && <Laptop className="h-4 w-4" />}
                        {device.type === 'desktop' && <Settings className="h-4 w-4" />}
                        <span className="text-white font-medium">{device.name}</span>
                      </div>
                      <Badge
                        variant={device.status === 'active' ? 'default' : 'secondary'}
                        className={device.status === 'active' ? 'bg-green-600' : 'bg-gray-600'}
                      >
                        {device.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-sm">Usage</p>
                      <p className="text-white">{device.usage} GB/h</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                No devices assigned to this user.
              </div>
            )}
          </CardContent>
        </Card>

        {showSampleData && (
          <div className="mt-6 p-4 bg-yellow-600/20 border border-yellow-600/50 rounded-lg">
            <p className="text-yellow-400 text-center">
              No usage data available. Starting real-time data collection...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
