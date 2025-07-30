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
  Server,
  AlertCircle,
  Wifi,
  Cpu,
  MemoryStick,
  HardDrive,
  TrendingUp,
  User,
  RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useRealNetwork } from "@/hooks/use-real-network";
import { MachineInfo } from "@/components/MachineInfo";
import NetworkOverview from "@/components/NetworkOverview";

const UserDashboard = () => {
  const navigate = useNavigate();
  
  // Real network data hook
  const {
    networkStatus,
    systemInfo,
    userBandwidth,
    currentWiFi,
    availableWiFi,
    ethernetNetworks,
    isLoading: networkLoading,
    error: networkError,
    isConnected,
    currentBandwidth,
    bandwidthHistory,
    activeInterfaces,
    bandwidthGBh,
    hasRealData,
    validateEmail,
    getUserBandwidth
  } = useRealNetwork();

  const user = JSON.parse(sessionStorage.getItem('user') || '{}');

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMachineType = () => {
    if (!systemInfo?.machine) return 'Unknown';
    
    const { manufacturer, model, virtual } = systemInfo.machine;
    
    if (virtual) return 'Virtual Machine';
    if (manufacturer?.toLowerCase().includes('dell')) return 'Dell Computer';
    if (manufacturer?.toLowerCase().includes('hp')) return 'HP Computer';
    if (manufacturer?.toLowerCase().includes('lenovo')) return 'Lenovo Computer';
    if (manufacturer?.toLowerCase().includes('asus')) return 'ASUS Computer';
    if (manufacturer?.toLowerCase().includes('acer')) return 'Acer Computer';
    if (manufacturer?.toLowerCase().includes('apple')) return 'Apple Mac';
    if (manufacturer?.toLowerCase().includes('microsoft')) return 'Microsoft Surface';
    
    return `${manufacturer} ${model}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="h-8 w-8 text-cyan-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">Real-Time System Monitor</h1>
                <div className="flex items-center gap-4 mt-1">
                  {/* Real Network Data Status */}
                  <div className="flex items-center gap-2">
                    {hasRealData ? (
                      <>
                        <Server className="h-4 w-4 text-green-400" />
                        <span className="text-sm text-green-400 font-medium">Live Data Active</span>
                      </>
                    ) : networkError ? (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <span className="text-sm text-red-400">Monitor Offline</span>
                      </>
                    ) : networkLoading ? (
                      <>
                        <Activity className="h-4 w-4 text-yellow-400 animate-spin" />
                        <span className="text-sm text-yellow-400">Connecting...</span>
                      </>
                    ) : (
                      <>
                        <Server className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-400">No Live Data</span>
                      </>
                    )}
                  </div>
                  
                  {/* Current Bandwidth Display */}
                  {hasRealData && currentBandwidth && (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Download className="h-3 w-3 text-blue-400" />
                        <span className="text-xs text-blue-400">
                          {(currentBandwidth.download * 0.45).toFixed(2)} GB/h
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Upload className="h-3 w-3 text-green-400" />
                        <span className="text-xs text-green-400">
                          {(currentBandwidth.upload * 0.45).toFixed(2)} GB/h
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
        {/* Real-Time Network Interfaces */}
        {hasRealData && activeInterfaces && (
          <div className="mb-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-full">
                    <Wifi className="h-8 w-8 text-blue-400" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-white">Connected Network Interfaces</CardTitle>
                <p className="text-slate-300 text-sm">
                  All currently active network interfaces on this machine
                </p>
              </CardHeader>
              <CardContent>
                {activeInterfaces.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">No active network interfaces found</div>
                ) : (
                  <div className="space-y-3">
                    {activeInterfaces.map((iface, idx) => (
                      <div key={iface.iface + idx} className="p-3 bg-slate-700/40 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-slate-600">
                        <div className="flex items-center gap-3">
                          <Wifi className="h-5 w-5 text-blue-400" />
                          <span className="font-medium text-white">{iface.iface}</span>
                          <span className="text-xs text-slate-400">{iface.type}</span>
                          {iface.ssid && <span className="text-xs text-cyan-400">SSID: {iface.ssid}</span>}
                          {iface.signalStrength && <span className="text-xs text-green-400">Signal: {iface.signalStrength}</span>}
                          <span className="text-xs text-slate-400">IP: {iface.ip4}</span>
                          <span className={`ml-2 w-2 h-2 rounded-full ${iface.operstate === 'up' ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                        </div>
                        <div className="flex gap-2 text-xs text-slate-400">
                          {iface.connectionType && <span>{iface.connectionType}</span>}
                          {iface.maxBandwidth && <span>Max: {iface.maxBandwidth}</span>}
                          <span>MAC: {iface.mac}</span>
                          <span>Speed: {iface.speed} Mbps</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Real-Time System Overview */}
        {hasRealData && systemInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Current Bandwidth */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Current Bandwidth</p>
                    <p className="text-2xl font-bold text-white">
                      {currentBandwidth ? (currentBandwidth.total * 0.45).toFixed(2) : '0.00'} GB/h
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Real-time network usage</p>
                  </div>
                  <Activity className="h-8 w-8 text-cyan-400" />
                </div>
              </CardContent>
            </Card>

            {/* CPU Usage */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">CPU</p>
                    <p className="text-lg font-bold text-white">{systemInfo.cpu.brand}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {systemInfo.cpu.cores} cores @ {systemInfo.cpu.speed} GHz
                    </p>
                  </div>
                  <Cpu className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            {/* Memory Usage */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Memory</p>
                    <p className="text-2xl font-bold text-white">
                      {((systemInfo.memory.used / systemInfo.memory.total) * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {Math.round(systemInfo.memory.used / 1024 / 1024 / 1024)}GB / {Math.round(systemInfo.memory.total / 1024 / 1024 / 1024)}GB
                    </p>
                  </div>
                  <MemoryStick className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            {/* Machine Type */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Machine</p>
                    <p className="text-lg font-bold text-white">{systemInfo.machine.model}</p>
                    <p className="text-xs text-slate-500 mt-1">{systemInfo.machine.manufacturer}</p>
                  </div>
                  <Server className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Real Network Interfaces */}
        {hasRealData && activeInterfaces.length > 0 && (
          <Card className="mb-8 bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wifi className="h-5 w-5 text-green-400" />
                Active Network Interfaces
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeInterfaces.map((iface, index) => (
                  <div key={index} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-white">{iface.iface}</span>
                      <Badge variant="outline" className="border-green-500 text-green-400 text-xs">
                        {iface.type}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">IP Address:</span>
                        <span className="text-white font-mono">{iface.ip4}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">MAC:</span>
                        <span className="text-white font-mono">{iface.mac}</span>
                      </div>
                      {iface.speed && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Speed:</span>
                          <span className="text-white">{iface.speed} Mbps</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Real-Time Bandwidth Chart */}
        {hasRealData && bandwidthHistory.length > 0 && (
          <Card className="mb-8 bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Real-Time Bandwidth Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={bandwidthHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#9CA3AF"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    tick={{ fontSize: 12 }}
                    label={{ value: 'GB/h', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any) => [(value * 0.45).toFixed(2) + ' GB/h', '']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="download" 
                    stroke="#3B82F6" 
                    strokeWidth={2} 
                    name="Download"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="upload" 
                    stroke="#10B981" 
                    strokeWidth={2} 
                    name="Upload"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Machine Information and Email Validation */}
        {hasRealData && systemInfo && (
          <div className="mb-8">
            {/* User's Current Machine Bandwidth */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-400" />
                  Your Current Machine Bandwidth
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                        <div className="text-2xl font-bold text-green-400">
                          {userBandwidth ? `${userBandwidth.bandwidth.current.total.toFixed(2)} Mbps` : '0.00 Mbps'}
                        </div>
                        <div className="text-sm text-slate-400">Current Total</div>
                      </div>
                      <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                        <div className="text-2xl font-bold text-blue-400">
                          {userBandwidth ? `${userBandwidth.bandwidth.current.download.toFixed(2)} Mbps` : '0.00 Mbps'}
                        </div>
                        <div className="text-sm text-slate-400">Download</div>
                      </div>
                      <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                        <div className="text-2xl font-bold text-purple-400">
                          {userBandwidth ? `${userBandwidth.bandwidth.current.upload.toFixed(2)} Mbps` : '0.00 Mbps'}
                        </div>
                        <div className="text-sm text-slate-400">Upload</div>
                      </div>
                    </div>
                    
                    {userBandwidth && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-700/30 rounded-lg">
                          <h4 className="font-medium text-white mb-2">Machine Info</h4>
                          <div className="text-sm text-slate-300 space-y-1">
                            <div>Hostname: {userBandwidth.user.machine.hostname}</div>
                            <div>Platform: {userBandwidth.user.machine.platform}</div>
                            <div>Architecture: {userBandwidth.user.machine.arch}</div>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-700/30 rounded-lg">
                          <h4 className="font-medium text-white mb-2">Total Usage</h4>
                          <div className="text-sm text-slate-300 space-y-1">
                            <div>Total: {userBandwidth.bandwidth.total.usageGB.toFixed(2)} GB</div>
                            <div>Received: {formatBytes(userBandwidth.bandwidth.total.received)}</div>
                            <div>Sent: {formatBytes(userBandwidth.bandwidth.total.sent)}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-center">
                      <Button
                        onClick={() => getUserBandwidth(user.email || '')}
                        disabled={networkLoading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${networkLoading ? 'animate-spin' : ''}`} />
                        Refresh My Bandwidth
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <User className="h-12 w-12 mx-auto mb-4 text-slate-600" />
                    <p>Please log in to view your bandwidth usage</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <MachineInfo systemInfo={systemInfo} validateEmail={validateEmail} />
            
            {/* Network Overview - WiFi and Ethernet */}
            <NetworkOverview 
              currentWiFi={currentWiFi}
              availableWiFi={availableWiFi}
              ethernetNetworks={ethernetNetworks}
            />
          </div>
        )}

        {/* No Real Data Message */}
        {!hasRealData && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-12 text-center">
              <Server className="h-16 w-16 mx-auto mb-4 text-slate-600" />
              <h3 className="text-xl font-semibold text-white mb-2">No Real-Time Data Available</h3>
              <p className="text-slate-400 mb-4">
                Start the network monitor server to see live system information and network usage.
              </p>
              <div className="space-y-2 text-sm text-slate-500">
                <p>Run: <code className="bg-slate-700 px-2 py-1 rounded">npm run server</code></p>
                <p>Then refresh this page to see real-time data.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Info (Minimal) */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Logged in as</p>
                <p className="text-white font-medium">{user.email || 'Guest'}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm">Status</p>
                <Badge variant="outline" className="border-green-500 text-green-400">
                  {hasRealData ? 'Live Monitoring' : 'Offline'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;
