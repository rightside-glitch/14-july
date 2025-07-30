import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Wifi, WifiOff, Cable, Signal, Shield, Zap } from 'lucide-react';

interface NetworkOverviewProps {
  currentWiFi: Array<{
    iface: string;
    ssid?: string;
    signalStrength?: number;
    security?: string;
    frequency?: number;
    ip4: string;
    mac: string;
    speed: number;
  }>;
  availableWiFi: Array<{
    ssid: string;
    signalStrength: number;
    security: string;
    frequency: number;
    channel: number;
    quality: number;
  }>;
  ethernetNetworks: Array<{
    interface: string;
    connectionType: string;
    maxBandwidth: string;
    currentSpeed: number;
    ip4: string;
    mac: string;
    duplex: string;
    operstate: string;
  }>;
}

const NetworkOverview: React.FC<NetworkOverviewProps> = ({
  currentWiFi,
  availableWiFi,
  ethernetNetworks
}) => {
  const getSignalIcon = (signalStrength: number) => {
    if (signalStrength >= 80) return <Signal className="h-4 w-4 text-green-400" />;
    if (signalStrength >= 60) return <Signal className="h-4 w-4 text-yellow-400" />;
    if (signalStrength >= 40) return <Signal className="h-4 w-4 text-orange-400" />;
    return <Signal className="h-4 w-4 text-red-400" />;
  };

  const getSecurityIcon = (security: string) => {
    if (security.toLowerCase().includes('wpa') || security.toLowerCase().includes('wep')) {
      return <Shield className="h-4 w-4 text-green-400" />;
    }
    return <Shield className="h-4 w-4 text-red-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Current WiFi Connection */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Wifi className="h-5 w-5 text-blue-400" />
            Current WiFi Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentWiFi.length > 0 ? (
            <div className="space-y-4">
              {currentWiFi.map((wifi, index) => (
                <div key={index} className="bg-slate-700/30 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                                         <div className="flex items-center gap-2">
                       {getSignalIcon(wifi.signalStrength || 0)}
                       <span className="font-semibold text-white">{wifi.ssid || 'Unknown'}</span>
                       {getSecurityIcon(wifi.security || 'Unknown')}
                     </div>
                                         <Badge variant="secondary" className="bg-blue-600 text-white">
                       {wifi.signalStrength || 0}%
                     </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                         <div>
                       <span className="text-slate-400">Interface:</span>
                       <div className="text-white">{wifi.iface}</div>
                     </div>
                                         <div>
                       <span className="text-slate-400">Security:</span>
                       <div className="text-white">{wifi.security || 'Unknown'}</div>
                     </div>
                     <div>
                       <span className="text-slate-400">IP Address:</span>
                       <div className="text-white">{wifi.ip4}</div>
                     </div>
                     <div>
                       <span className="text-slate-400">Frequency:</span>
                       <div className="text-white">{wifi.frequency ? `${wifi.frequency} GHz` : 'Unknown'}</div>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <WifiOff className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No WiFi connection detected</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available WiFi Networks */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Wifi className="h-5 w-5 text-green-400" />
            Available WiFi Networks ({availableWiFi.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableWiFi.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {availableWiFi.map((network, index) => (
                <div key={index} className="bg-slate-700/30 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getSignalIcon(network.signalStrength)}
                      <span className="font-medium text-white">{network.ssid}</span>
                      {getSecurityIcon(network.security)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {network.signalStrength}%
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Ch {network.channel}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-slate-400">
                    {network.security} • {network.frequency} GHz • Quality: {network.quality}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <WifiOff className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No available WiFi networks detected</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ethernet Networks */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Cable className="h-5 w-5 text-purple-400" />
            Ethernet Networks ({ethernetNetworks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ethernetNetworks.length > 0 ? (
            <div className="space-y-4">
              {ethernetNetworks.map((ethernet, index) => (
                <div key={index} className="bg-slate-700/30 p-4 rounded-lg">
                                     <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-2">
                       <Cable className="h-4 w-4 text-purple-400" />
                       <span className="font-semibold text-white">{ethernet.interface}</span>
                     </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-purple-600 text-white">
                        {ethernet.operstate}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {ethernet.maxBandwidth}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">IP Address:</span>
                      <div className="text-white">{ethernet.ip4}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Current Speed:</span>
                      <div className="text-white">{ethernet.currentSpeed} Mbps</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Duplex:</span>
                      <div className="text-white">{ethernet.duplex}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">MAC Address:</span>
                      <div className="text-white font-mono text-xs">{ethernet.mac}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Cable className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No Ethernet networks detected</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NetworkOverview; 