import { useState, useEffect, useCallback } from 'react';

interface NetworkInterface {
  iface: string;
  type: string;
  ip4: string;
  mac: string;
  operstate: string;
  speed: number;
}

interface BandwidthData {
  download: number;
  upload: number;
  total: number;
}

interface NetworkStats {
  current: {
    bytesReceived: number;
    bytesSent: number;
    packetsReceived: number;
    packetsSent: number;
    timestamp: number;
  };
  bandwidth: BandwidthData;
  history: Array<{
    timestamp: number;
    download: number;
    upload: number;
    total: number;
    bytesReceived: number;
    bytesSent: number;
  }>;
}

interface SystemInfo {
  cpu: {
    manufacturer: string;
    brand: string;
    cores: number;
    physicalCores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    active: number;
  };
  os: {
    platform: string;
    distro: string;
    release: string;
    arch: string;
  };
}

interface NetworkStatus {
  interfaces: NetworkInterface[];
  stats: NetworkStats;
  timestamp: number;
}

const API_BASE_URL = 'http://localhost:3001/api';

export const useRealNetwork = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Check if backend server is running
  const checkServerHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      setIsConnected(data.success);
      return data.success;
    } catch (err) {
      setIsConnected(false);
      return false;
    }
  }, []);

  // Fetch network status
  const fetchNetworkStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/network/status`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.success) {
        setNetworkStatus(data.data);
        setError(null);
      } else {
        throw new Error(data.error || 'Failed to fetch network status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch network status');
      console.error('Error fetching network status:', err);
    }
  }, []);

  // Fetch system information
  const fetchSystemInfo = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/system/info`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.success) {
        setSystemInfo(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch system info');
      }
    } catch (err) {
      console.error('Error fetching system info:', err);
    }
  }, []);

  // Fetch bandwidth data
  const fetchBandwidth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/network/bandwidth`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to fetch bandwidth data');
      }
    } catch (err) {
      console.error('Error fetching bandwidth data:', err);
      return null;
    }
  }, []);

  // Initialize and start monitoring
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const initializeMonitoring = async () => {
      setIsLoading(true);
      
      // Check if server is running
      const serverRunning = await checkServerHealth();
      
      if (serverRunning) {
        // Fetch initial data
        await Promise.all([
          fetchNetworkStatus(),
          fetchSystemInfo()
        ]);

        // Start real-time monitoring
        intervalId = setInterval(async () => {
          await fetchNetworkStatus();
        }, 5000); // Update every 5 seconds
      } else {
        setError('Network monitor server is not running. Please start the server with: npm run server');
      }
      
      setIsLoading(false);
    };

    initializeMonitoring();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [checkServerHealth, fetchNetworkStatus, fetchSystemInfo]);

  // Get current bandwidth in a format compatible with the existing app
  const getCurrentBandwidth = useCallback(() => {
    if (!networkStatus?.stats?.bandwidth) {
      return {
        download: 0,
        upload: 0,
        total: 0
      };
    }

    return networkStatus.stats.bandwidth;
  }, [networkStatus]);

  // Get bandwidth history for charts
  const getBandwidthHistory = useCallback(() => {
    if (!networkStatus?.stats?.history) {
      return [];
    }

    return networkStatus.stats.history.map(entry => ({
      timestamp: entry.timestamp,
      download: entry.download,
      upload: entry.upload,
      total: entry.total,
      time: new Date(entry.timestamp).toLocaleTimeString()
    }));
  }, [networkStatus]);

  // Get active network interfaces
  const getActiveInterfaces = useCallback(() => {
    if (!networkStatus?.interfaces) {
      return [];
    }

    return networkStatus.interfaces.filter(iface => 
      iface.operstate === 'up' && 
      iface.ip4 && 
      iface.type !== 'loopback'
    );
  }, [networkStatus]);

  // Convert bandwidth to GB/h for compatibility with existing app
  const getBandwidthInGBh = useCallback(() => {
    const bandwidth = getCurrentBandwidth();
    // Convert Mbps to GB/h
    // 1 Mbps = 0.125 MB/s = 0.000125 GB/s = 0.45 GB/h
    const downloadGBh = (bandwidth.download * 0.45);
    const uploadGBh = (bandwidth.upload * 0.45);
    const totalGBh = downloadGBh + uploadGBh;
    
    return {
      download: downloadGBh,
      upload: uploadGBh,
      total: totalGBh
    };
  }, [getCurrentBandwidth]);

  return {
    // Data
    networkStatus,
    systemInfo,
    isLoading,
    error,
    isConnected,
    
    // Computed values
    currentBandwidth: getCurrentBandwidth(),
    bandwidthHistory: getBandwidthHistory(),
    activeInterfaces: getActiveInterfaces(),
    bandwidthGBh: getBandwidthInGBh(),
    
    // Actions
    fetchNetworkStatus,
    fetchSystemInfo,
    fetchBandwidth,
    checkServerHealth,
    
    // Utilities
    hasRealData: isConnected && !error && networkStatus !== null
  };
}; 