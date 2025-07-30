import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Activity,
  Wifi,
  Shield,
  Clock,
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { db, handleFirestoreError } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Visitor {
  id: string;
  name: string;
  email: string;
  phone: string;
  deviceId: string;
  ipAddress: string;
  macAddress: string;
  connectedAt: any;
  lastSeen: any;
  status: 'active' | 'inactive' | 'blocked';
  bandwidthUsed: number;
  timeLimit: number;
  networkId: string;
}

interface VisitorDevice {
  id: string;
  name: string;
  type: string;
  user: string;
  ip: string;
  usage: number;
  status: string;
  networkId: string;
  lastSeen: any;
}

export const VisitorsNetworkManager = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [visitorDevices, setVisitorDevices] = useState<VisitorDevice[]>([]);
  const [networkStats, setNetworkStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);

  // Listen to visitors collection
  useEffect(() => {
    const unsubVisitors = onSnapshot(
      collection(db, 'visitors'),
      (snapshot) => {
        const visitorsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Visitor[];
        setVisitors(visitorsData);
      },
      (error) => {
        console.error('Error fetching visitors:', error);
        handleFirestoreError(error, 'fetching visitors');
      }
    );

    return () => unsubVisitors();
  }, []);

  // Listen to visitor devices
  useEffect(() => {
    const unsubDevices = onSnapshot(
      query(collection(db, 'devices'), where('networkId', '==', 'visitors-net')),
      (snapshot) => {
        const devicesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as VisitorDevice[];
        setVisitorDevices(devicesData);
      },
      (error) => {
        console.error('Error fetching visitor devices:', error);
        handleFirestoreError(error, 'fetching visitor devices');
      }
    );

    return () => unsubDevices();
  }, []);

  // Listen to visitor bandwidth stats
  useEffect(() => {
    const unsubStats = onSnapshot(
      doc(db, 'visitorBandwidth', 'visitors-net'),
      (doc) => {
        if (doc.exists()) {
          setNetworkStats(doc.data());
        }
      },
      (error) => {
        console.error('Error fetching visitor stats:', error);
        handleFirestoreError(error, 'fetching visitor stats');
      }
    );

    return () => unsubStats();
  }, []);

  const handleBlockVisitor = async (visitorId: string) => {
    try {
      await updateDoc(doc(db, 'visitors', visitorId), {
        status: 'blocked',
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error blocking visitor:', error);
      handleFirestoreError(error, 'blocking visitor');
    }
  };

  const handleUnblockVisitor = async (visitorId: string) => {
    try {
      await updateDoc(doc(db, 'visitors', visitorId), {
        status: 'active',
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error unblocking visitor:', error);
      handleFirestoreError(error, 'unblocking visitor');
    }
  };

  const handleDisconnectVisitor = async (visitorId: string) => {
    try {
      await updateDoc(doc(db, 'visitors', visitorId), {
        status: 'inactive',
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error disconnecting visitor:', error);
      handleFirestoreError(error, 'disconnecting visitor');
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'laptop': return <Laptop className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      case 'desktop': return <Monitor className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'inactive': return <XCircle className="h-4 w-4 text-gray-400" />;
      case 'blocked': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      default: return <Activity className="h-4 w-4 text-yellow-400" />;
    }
  };

  const activeVisitors = visitors.filter(v => v.status === 'active');
  const totalBandwidthUsed = visitors.reduce((sum, v) => sum + v.bandwidthUsed, 0);
  const networkCapacity = 10; // GB/h limit

  return (
    <div className="space-y-6">
      {/* Network Overview */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Wifi className="h-5 w-5 text-blue-400" />
            Visitors Net Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{visitors.length}</div>
              <div className="text-sm text-slate-400">Total Visitors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{activeVisitors.length}</div>
              <div className="text-sm text-slate-400">Active Visitors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{totalBandwidthUsed.toFixed(1)}</div>
              <div className="text-sm text-slate-400">GB/h Used</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">50</div>
              <div className="text-sm text-slate-400">Max Capacity</div>
            </div>
          </div>
          
          {/* Bandwidth Usage Progress */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Bandwidth Usage</span>
              <span className="text-white">{((totalBandwidthUsed / networkCapacity) * 100).toFixed(1)}%</span>
            </div>
            <Progress value={(totalBandwidthUsed / networkCapacity) * 100} className="h-3" />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>{totalBandwidthUsed.toFixed(1)} GB/h used</span>
              <span>{(networkCapacity - totalBandwidthUsed).toFixed(1)} GB/h remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Visitors */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-green-400" />
            Connected Visitors ({activeVisitors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeVisitors.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Users className="h-12 w-12 mx-auto mb-4 text-slate-600" />
              <p>No active visitors</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeVisitors.map((visitor) => {
                const device = visitorDevices.find(d => d.id === visitor.deviceId);
                return (
                  <div key={visitor.id} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(visitor.status)}
                          <div>
                            <h3 className="font-medium text-white">{visitor.name}</h3>
                            <p className="text-sm text-slate-400">{visitor.email}</p>
                          </div>
                        </div>
                        
                        {device && (
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(device.type)}
                            <span className="text-sm text-slate-300">{device.name}</span>
                          </div>
                        )}
                        
                        <div className="text-sm">
                          <span className="text-slate-400">IP: </span>
                          <span className="text-white font-mono">{visitor.ipAddress}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-white">
                            {visitor.bandwidthUsed.toFixed(1)} GB/h
                          </div>
                          <div className="text-xs text-slate-400">
                            {visitor.timeLimit}h limit
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDisconnectVisitor(visitor.id)}
                            className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
                          >
                            Disconnect
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBlockVisitor(visitor.id)}
                            className="border-red-500 text-red-400 hover:bg-red-500/10"
                          >
                            Block
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Visitors Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-400" />
            All Visitors Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left p-2 text-slate-400">Name</th>
                  <th className="text-left p-2 text-slate-400">Email</th>
                  <th className="text-left p-2 text-slate-400">Status</th>
                  <th className="text-left p-2 text-slate-400">IP Address</th>
                  <th className="text-left p-2 text-slate-400">Bandwidth</th>
                  <th className="text-left p-2 text-slate-400">Connected</th>
                  <th className="text-left p-2 text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((visitor) => (
                  <tr key={visitor.id} className="border-b border-slate-700/50">
                    <td className="p-2 text-white">{visitor.name}</td>
                    <td className="p-2 text-slate-300">{visitor.email}</td>
                    <td className="p-2">
                      <Badge 
                        variant="outline" 
                        className={
                          visitor.status === 'active' ? 'border-green-500 text-green-400' :
                          visitor.status === 'blocked' ? 'border-red-500 text-red-400' :
                          'border-gray-500 text-gray-400'
                        }
                      >
                        {visitor.status}
                      </Badge>
                    </td>
                    <td className="p-2 text-slate-300 font-mono">{visitor.ipAddress}</td>
                    <td className="p-2 text-white">{visitor.bandwidthUsed.toFixed(1)} GB/h</td>
                    <td className="p-2 text-slate-300">
                      {visitor.connectedAt?.toDate?.()?.toLocaleTimeString() || 'N/A'}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        {visitor.status === 'active' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDisconnectVisitor(visitor.id)}
                              className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
                            >
                              Disconnect
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBlockVisitor(visitor.id)}
                              className="border-red-500 text-red-400 hover:bg-red-500/10"
                            >
                              Block
                            </Button>
                          </>
                        )}
                        {visitor.status === 'blocked' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnblockVisitor(visitor.id)}
                            className="border-green-500 text-green-400 hover:bg-green-500/10"
                          >
                            Unblock
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 