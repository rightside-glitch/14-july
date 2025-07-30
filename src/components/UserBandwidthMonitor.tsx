import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Download,
  Upload,
  Monitor,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  RefreshCw,
  User,
  Clock,
  TrendingUp
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface UserBandwidthData {
  user: {
    email: string;
    machine: {
      hostname: string;
      platform: string;
      release: string;
      arch: string;
    };
  };
  bandwidth: {
    current: {
      download: number;
      upload: number;
      total: number;
    };
    total: {
      received: number;
      sent: number;
      usageGB: number;
    };
  };
  network: {
    interfaces: Array<{
      name: string;
      type: string;
      ip4: string;
      mac: string;
      speed: number;
      duplex: string;
      operstate: string;
    }>;
  };
  system: {
    cpu: {
      model: string;
      cores: number;
      speed: number;
      load: number;
    };
    memory: {
      total: number;
      used: number;
      free: number;
      available: number;
    };
  };
  timestamp: number;
}

interface UserBandwidthMonitorProps {
  userEmail: string;
  getUserBandwidth: (email: string) => Promise<UserBandwidthData | null>;
}

export const UserBandwidthMonitor = ({ userEmail, getUserBandwidth }: UserBandwidthMonitorProps) => {
  const [userData, setUserData] = useState<UserBandwidthData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bandwidthHistory, setBandwidthHistory] = useState<Array<{
    timestamp: number;
    download: number;
    upload: number;
    total: number;
    time: string;
  }>>([]);

  const fetchUserBandwidth = async () => {
    if (!userEmail) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getUserBandwidth(userEmail);
      if (data) {
        setUserData(data);
        
        // Add to history for chart
        const newEntry = {
          timestamp: data.timestamp,
          download: data.bandwidth.current.download,
          upload: data.bandwidth.current.upload,
          total: data.bandwidth.current.total,
          time: new Date(data.timestamp).toLocaleTimeString()
        };
        
        setBandwidthHistory(prev => {
          const updated = [...prev, newEntry];
          // Keep only last 20 entries
          return updated.slice(-20);
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user bandwidth');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBandwidth();
    
    // Set up interval to fetch data every 5 seconds
    const interval = setInterval(fetchUserBandwidth, 5000);
    
    return () => clearInterval(interval);
  }, [userEmail]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatMbps = (mbps: number) => {
    return `${mbps.toFixed(2)} Mbps`;
  };

  const formatGB = (gb: number) => {
    return `${gb.toFixed(2)} GB`;
  };

  if (!userEmail) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center text-slate-400">
            <User className="h-12 w-12 mx-auto mb-4 text-slate-600" />
            <p>Please log in to view your bandwidth usage</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Machine Overview */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-400" />
              Your Machine: {userData?.user.machine.hostname || 'Loading...'}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchUserBandwidth}
              disabled={isLoading}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-400 text-center py-4">
              <p>Error: {error}</p>
            </div>
          ) : !userData ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
              <p className="text-slate-400 mt-2">Loading your machine data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Current Bandwidth */}
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">
                  {formatMbps(userData.bandwidth.current.total)}
                </div>
                <div className="text-sm text-slate-400">Current Total</div>
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>↓ {formatMbps(userData.bandwidth.current.download)}</span>
                  <span>↑ {formatMbps(userData.bandwidth.current.upload)}</span>
                </div>
              </div>
              
              {/* Total Usage */}
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">
                  {formatGB(userData.bandwidth.total.usageGB)}
                </div>
                <div className="text-sm text-slate-400">Total Usage</div>
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>↓ {formatBytes(userData.bandwidth.total.received)}</span>
                  <span>↑ {formatBytes(userData.bandwidth.total.sent)}</span>
                </div>
              </div>
              
              {/* System Load */}
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">
                  {(userData.system.cpu.load * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-slate-400">CPU Load</div>
                <div className="text-xs text-slate-500 mt-2">
                  {userData.system.cpu.cores} cores @ {userData.system.cpu.speed}MHz
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Information */}
      {userData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CPU & Memory */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Cpu className="h-5 w-5 text-green-400" />
                System Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* CPU */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">CPU Usage</span>
                  <span className="text-white">{(userData.system.cpu.load * 100).toFixed(1)}%</span>
                </div>
                <Progress value={userData.system.cpu.load * 100} className="h-2" />
                <div className="text-xs text-slate-500 mt-1">
                  {userData.system.cpu.model}
                </div>
              </div>
              
              {/* Memory */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Memory Usage</span>
                  <span className="text-white">
                    {((userData.system.memory.used / userData.system.memory.total) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={(userData.system.memory.used / userData.system.memory.total) * 100} 
                  className="h-2" 
                />
                <div className="text-xs text-slate-500 mt-1">
                  {formatBytes(userData.system.memory.used)} / {formatBytes(userData.system.memory.total)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Network Interfaces */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wifi className="h-5 w-5 text-blue-400" />
                Network Interfaces
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userData.network.interfaces.map((iface, index) => (
                  <div key={index} className="p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">{iface.name}</div>
                        <div className="text-sm text-slate-400">{iface.ip4}</div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant="outline" 
                          className={
                            iface.operstate === 'up' 
                              ? 'border-green-500 text-green-400' 
                              : 'border-red-500 text-red-400'
                          }
                        >
                          {iface.operstate}
                        </Badge>
                        <div className="text-xs text-slate-500 mt-1">
                          {iface.speed} Mbps
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bandwidth History Chart */}
      {bandwidthHistory.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              Your Bandwidth History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={bandwidthHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="time"
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis stroke="#9CA3AF" unit=" Mbps" />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(2)} Mbps`, 'Bandwidth']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="download"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                  name="Download"
                />
                <Line
                  type="monotone"
                  dataKey="upload"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                  name="Upload"
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={false}
                  name="Total"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 