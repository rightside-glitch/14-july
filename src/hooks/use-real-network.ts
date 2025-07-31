import { useState, useEffect, useCallback } from 'react';

interface NetworkInterface {
  iface: string;
  type: string;
  ip4: string;
  mac: string;
  operstate: string;
  speed: number;
  ssid?: string;
  signalStrength?: number;
  security?: string;
  frequency?: number;
  connectionType?: string;
  maxBandwidth?: string;
}

interface WiFiNetwork {
  ssid: string;
  signalStrength: number;
  security: string;
  frequency: number;
  channel: number;
  quality: number;
}

interface EthernetNetwork {
  interface: string;
  connectionType: string;
  maxBandwidth: string;
  currentSpeed: number;
  ip4: string;
  mac: string;
  duplex: string;
  operstate: string;
}

interface NetworkOverview {
  currentConnections: {
    wifi: NetworkInterface[];
    ethernet: NetworkInterface[];
  };
  availableNetworks: {
    wifi: WiFiNetwork[];
  };
  bandwidth: BandwidthData;
  timestamp: number;
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

interface MachineInfo {
  manufacturer: string;
  model: string;
  version: string;
  serial: string;
  uuid: string;
  sku: string;
  virtual: boolean;
}

interface SystemInfo {
  machine: MachineInfo;
  cpu: {
    manufacturer: string;
    brand: string;
    cores: number;
    physicalCores: number;
    speed: number;
    cache: any;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    active: number;
    available: number;
  };
  os: {
    platform: string;
    distro: string;
    release: string;
    arch: string;
    hostname: string;
    codename: string;
    kernel: string;
    build: string;
  };
  storage: {
    disks: Array<{
      device: string;
      type: string;
      name: string;
      size: number;
      serial: string;
    }>;
  };
  graphics: {
    controllers: Array<{
      model: string;
      vendor: string;
      vram: number;
      driverVersion: string;
    }>;
  };
}

interface EmailValidationResult {
  email: string;
  isValid: boolean;
  type: 'real' | 'fake';
  confidence: 'high' | 'low';
  reasons: {
    isFake: boolean;
    isDisposable: boolean;
    realScore: number;
    indicators: {
      hasValidFormat: boolean;
      hasValidDomain: boolean;
      hasReasonableLength: boolean;
      notTestEmail: boolean;
      notDisposable: boolean;
    };
  };
}

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

interface NetworkStatus {
  interfaces: NetworkInterface[];
  stats: NetworkStats;
  timestamp: number;
}

const API_BASE_URL = 'http://localhost:3001/api';

export const useRealNetwork = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [userBandwidth, setUserBandwidth] = useState<UserBandwidthData | null>(null);
  const [currentWiFi, setCurrentWiFi] = useState<NetworkInterface[]>([]);
  const [availableWiFi, setAvailableWiFi] = useState<WiFiNetwork[]>([]);
  const [ethernetNetworks, setEthernetNetworks] = useState<EthernetNetwork[]>([]);
  const [networkOverview, setNetworkOverview] = useState<NetworkOverview | null>(null);
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

  // Validate email
  const validateEmail = useCallback(async (email: string): Promise<EmailValidationResult | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/validate/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to validate email');
      }
    } catch (err) {
      console.error('Error validating email:', err);
      return null;
    }
  }, []);

  // Get user's current machine bandwidth
  const getUserBandwidth = useCallback(async (userEmail: string): Promise<UserBandwidthData | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/bandwidth?userEmail=${encodeURIComponent(userEmail)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setUserBandwidth(data.data);
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to get user bandwidth');
      }
    } catch (err) {
      console.error('Error getting user bandwidth:', err);
      return null;
    }
  }, []);

  // Fetch current WiFi connection info
  const fetchCurrentWiFi = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/network/wifi/current`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.success) {
        setCurrentWiFi(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch current WiFi info');
      }
    } catch (err) {
      console.error('Error fetching current WiFi:', err);
    }
  }, []);

  // Fetch available WiFi networks
  const fetchAvailableWiFi = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/network/wifi/available`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.success) {
        setAvailableWiFi(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch available WiFi networks');
      }
    } catch (err) {
      console.error('Error fetching available WiFi networks:', err);
    }
  }, []);

  // Fetch Ethernet networks
  const fetchEthernetNetworks = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/network/ethernet`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.success) {
        setEthernetNetworks(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch Ethernet networks');
      }
    } catch (err) {
      console.error('Error fetching Ethernet networks:', err);
    }
  }, []);

  // Fetch comprehensive network overview
  const fetchNetworkOverview = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/network/overview`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.success) {
        setNetworkOverview(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch network overview');
      }
    } catch (err) {
      console.error('Error fetching network overview:', err);
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
          fetchSystemInfo(),
          fetchCurrentWiFi(),
          fetchAvailableWiFi(),
          fetchEthernetNetworks(),
          fetchNetworkOverview()
        ]);

        // Start real-time monitoring
        intervalId = setInterval(async () => {
          await Promise.all([
            fetchNetworkStatus(),
            fetchCurrentWiFi(),
            fetchAvailableWiFi(),
            fetchEthernetNetworks(),
            fetchNetworkOverview()
          ]);
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
      (typeof iface.type === 'string' && iface.type === 'wireless') || (typeof iface.iface === 'string' && iface.iface.toLowerCase().includes('wifi'))
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
    userBandwidth,
    currentWiFi,
    availableWiFi,
    ethernetNetworks,
    networkOverview,
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
    fetchCurrentWiFi,
    fetchAvailableWiFi,
    fetchEthernetNetworks,
    fetchNetworkOverview,
    validateEmail,
    getUserBandwidth,
    checkServerHealth,
    
    // Utilities
    hasRealData: isConnected && !error && networkStatus !== null
  };
}; 