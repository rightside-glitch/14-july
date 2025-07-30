import express from 'express';
import cors from 'cors';
import si from 'systeminformation';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Store network statistics
let networkStats = {
  current: {
    bytesReceived: 0,
    bytesSent: 0,
    packetsReceived: 0,
    packetsSent: 0,
    timestamp: Date.now()
  },
  previous: {
    bytesReceived: 0,
    bytesSent: 0,
    packetsReceived: 0,
    packetsSent: 0,
    timestamp: Date.now()
  },
  history: []
};

// Get current network interfaces with enhanced WiFi and Ethernet info
async function getNetworkInterfaces() {
  try {
    const networkInterfaces = await si.networkInterfaces();
    const enhancedInterfaces = [];
    
    for (const iface of networkInterfaces) {
      if (iface.operstate === 'up' && iface.type !== 'loopback' && iface.ip4) {
        let enhancedIface = { ...iface };
        
        // Add WiFi SSID if it's a wireless interface
        if (iface.type === 'wireless' || iface.iface.toLowerCase().includes('wifi') || iface.iface.toLowerCase().includes('wireless')) {
          try {
            const wifiInfo = await getCurrentWiFiSSID(iface.iface);
            enhancedIface.ssid = wifiInfo.ssid;
            enhancedIface.signalStrength = wifiInfo.signalStrength;
            enhancedIface.security = wifiInfo.security;
          } catch (error) {
            console.log(`Could not get WiFi info for ${iface.iface}:`, error.message);
            enhancedIface.ssid = null;
          }
        }
        
        // Add Ethernet info if it's a wired interface
        if (iface.type === 'wired' || iface.iface.toLowerCase().includes('ethernet')) {
          enhancedIface.connectionType = 'Ethernet';
          enhancedIface.maxBandwidth = getEthernetMaxBandwidth(iface.speed);
        }
        
        enhancedInterfaces.push(enhancedIface);
      }
    }
    
    return enhancedInterfaces;
  } catch (error) {
    console.error('Error getting network interfaces:', error);
    return [];
  }
}

// Get current WiFi SSID and signal strength
async function getCurrentWiFiSSID(interfaceName) {
  try {
    // Use systeminformation to get WiFi info
    const wifiConnections = await si.wifiConnections();
    const currentConnection = wifiConnections.find(conn => 
      conn.iface === interfaceName || conn.iface.toLowerCase().includes(interfaceName.toLowerCase())
    );
    
    if (currentConnection) {
      return {
        ssid: currentConnection.ssid,
        signalStrength: currentConnection.signal,
        security: currentConnection.security,
        frequency: currentConnection.frequency
      };
    }
    
    // Fallback: try to get from networkInterfaces
    const interfaces = await si.networkInterfaces();
    const wifiInterface = interfaces.find(iface => 
      iface.iface === interfaceName && 
      (iface.type === 'wireless' || iface.iface.toLowerCase().includes('wifi'))
    );
    
    if (wifiInterface) {
      return {
        ssid: wifiInterface.ssid || 'Unknown',
        signalStrength: wifiInterface.signal || 0,
        security: wifiInterface.security || 'Unknown',
        frequency: wifiInterface.frequency || 0
      };
    }
    
    return { ssid: 'Unknown', signalStrength: 0, security: 'Unknown', frequency: 0 };
  } catch (error) {
    console.error('Error getting WiFi SSID:', error);
    return { ssid: 'Error', signalStrength: 0, security: 'Unknown', frequency: 0 };
  }
}

// Get available WiFi networks
async function getAvailableWiFiNetworks() {
  try {
    const wifiNetworks = await si.wifiNetworks();
    return wifiNetworks.map(network => ({
      ssid: network.ssid,
      signalStrength: network.signal,
      security: network.security,
      frequency: network.frequency,
      channel: network.channel,
      quality: network.quality
    }));
  } catch (error) {
    console.error('Error getting available WiFi networks:', error);
    return [];
  }
}

// Get Ethernet max bandwidth based on speed
function getEthernetMaxBandwidth(speed) {
  if (!speed) return 'Unknown';
  
  const speedNum = parseInt(speed);
  if (speedNum >= 10000) return '10 Gbps';
  if (speedNum >= 1000) return '1 Gbps';
  if (speedNum >= 100) return '100 Mbps';
  if (speedNum >= 10) return '10 Mbps';
  
  return `${speed} Mbps`;
}

// Get network statistics
async function getNetworkStats() {
  try {
    const stats = await si.networkStats();
    return stats;
  } catch (error) {
    console.error('Error getting network stats:', error);
    return [];
  }
}

// Calculate bandwidth usage
function calculateBandwidth(current, previous, timeDiff) {
  if (timeDiff === 0) return { download: 0, upload: 0 };
  
  const downloadBytes = current.bytesReceived - previous.bytesReceived;
  const uploadBytes = current.bytesSent - previous.bytesSent;
  
  // Convert to Mbps (bytes to bits, then to Mbps)
  const downloadMbps = (downloadBytes * 8) / (timeDiff / 1000) / 1000000;
  const uploadMbps = (uploadBytes * 8) / (timeDiff / 1000) / 1000000;
  
  return {
    download: Math.max(0, downloadMbps),
    upload: Math.max(0, uploadMbps),
    total: Math.max(0, downloadMbps + uploadMbps)
  };
}

// Update network statistics
async function updateNetworkStats() {
  try {
    const stats = await getNetworkStats();
    if (stats.length === 0) return;

    // Sum up all active interfaces
    const totalStats = stats.reduce((acc, stat) => ({
      bytesReceived: acc.bytesReceived + (stat.rx_bytes || 0),
      bytesSent: acc.bytesSent + (stat.tx_bytes || 0),
      packetsReceived: acc.packetsReceived + (stat.rx_packets || 0),
      packetsSent: acc.packetsSent + (stat.tx_packets || 0)
    }), { bytesReceived: 0, bytesSent: 0, packetsReceived: 0, packetsSent: 0 });

    const now = Date.now();
    const timeDiff = now - networkStats.current.timestamp;

    // Update previous stats
    networkStats.previous = { ...networkStats.current };

    // Update current stats
    networkStats.current = {
      ...totalStats,
      timestamp: now
    };

    // Calculate bandwidth
    const bandwidth = calculateBandwidth(networkStats.current, networkStats.previous, timeDiff);

    // Add to history (keep last 60 entries for 5 minutes of data)
    const historyEntry = {
      timestamp: now,
      download: bandwidth.download,
      upload: bandwidth.upload,
      total: bandwidth.total,
      bytesReceived: totalStats.bytesReceived,
      bytesSent: totalStats.bytesSent
    };

    networkStats.history.push(historyEntry);
    if (networkStats.history.length > 60) {
      networkStats.history.shift();
    }

    return {
      current: networkStats.current,
      bandwidth,
      history: networkStats.history
    };

  } catch (error) {
    console.error('Error updating network stats:', error);
    return null;
  }
}

// API Routes

// Get current network status
app.get('/api/network/status', async (req, res) => {
  try {
    const interfaces = await getNetworkInterfaces();
    const stats = await updateNetworkStats();
    
    res.json({
      success: true,
      data: {
        interfaces,
        stats,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Error in /api/network/status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get network status'
    });
  }
});

// Get network interfaces
app.get('/api/network/interfaces', async (req, res) => {
  try {
    const interfaces = await getNetworkInterfaces();
    res.json({
      success: true,
      data: interfaces
    });
  } catch (error) {
    console.error('Error in /api/network/interfaces:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get network interfaces'
    });
  }
});

// Get current bandwidth usage
app.get('/api/network/bandwidth', async (req, res) => {
  try {
    const stats = await updateNetworkStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in /api/network/bandwidth:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get bandwidth data'
    });
  }
});

// Get current WiFi SSID and connection info
app.get('/api/network/wifi/current', async (req, res) => {
  try {
    const interfaces = await getNetworkInterfaces();
    const wifiInterfaces = interfaces.filter(iface => 
      iface.type === 'wireless' || 
      iface.iface.toLowerCase().includes('wifi') || 
      iface.iface.toLowerCase().includes('wireless')
    );
    
    const wifiInfo = wifiInterfaces.map(iface => ({
      interface: iface.iface,
      ssid: iface.ssid,
      signalStrength: iface.signalStrength,
      security: iface.security,
      frequency: iface.frequency,
      ip4: iface.ip4,
      mac: iface.mac,
      speed: iface.speed
    }));
    
    res.json({
      success: true,
      data: wifiInfo
    });
  } catch (error) {
    console.error('Error in /api/network/wifi/current:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get current WiFi info'
    });
  }
});

// Get available WiFi networks
app.get('/api/network/wifi/available', async (req, res) => {
  try {
    const availableNetworks = await getAvailableWiFiNetworks();
    res.json({
      success: true,
      data: availableNetworks
    });
  } catch (error) {
    console.error('Error in /api/network/wifi/available:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available WiFi networks'
    });
  }
});

// Get Ethernet networks and their bandwidth
app.get('/api/network/ethernet', async (req, res) => {
  try {
    const interfaces = await getNetworkInterfaces();
    const ethernetInterfaces = interfaces.filter(iface => 
      iface.type === 'wired' || 
      iface.iface.toLowerCase().includes('ethernet')
    );
    
    const ethernetInfo = ethernetInterfaces.map(iface => ({
      interface: iface.iface,
      connectionType: iface.connectionType,
      maxBandwidth: iface.maxBandwidth,
      currentSpeed: iface.speed,
      ip4: iface.ip4,
      mac: iface.mac,
      duplex: iface.duplex,
      operstate: iface.operstate
    }));
    
    res.json({
      success: true,
      data: ethernetInfo
    });
  } catch (error) {
    console.error('Error in /api/network/ethernet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Ethernet networks'
    });
  }
});

// Get comprehensive network overview
app.get('/api/network/overview', async (req, res) => {
  try {
    const [interfaces, availableWifi, stats] = await Promise.all([
      getNetworkInterfaces(),
      getAvailableWiFiNetworks(),
      updateNetworkStats()
    ]);
    
    const wifiInterfaces = interfaces.filter(iface => 
      iface.type === 'wireless' || 
      iface.iface.toLowerCase().includes('wifi') || 
      iface.iface.toLowerCase().includes('wireless')
    );
    
    const ethernetInterfaces = interfaces.filter(iface => 
      iface.type === 'wired' || 
      iface.iface.toLowerCase().includes('ethernet')
    );
    
    res.json({
      success: true,
      data: {
        currentConnections: {
          wifi: wifiInterfaces,
          ethernet: ethernetInterfaces
        },
        availableNetworks: {
          wifi: availableWifi
        },
        bandwidth: stats?.bandwidth || { download: 0, upload: 0, total: 0 },
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Error in /api/network/overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get network overview'
    });
  }
});

// Get detailed system information including machine type
app.get('/api/system/info', async (req, res) => {
  try {
    const [cpu, mem, os, system, disk, graphics] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.osInfo(),
      si.system(),
      si.diskLayout(),
      si.graphics()
    ]);

    res.json({
      success: true,
      data: {
        machine: {
          manufacturer: system.manufacturer,
          model: system.model,
          version: system.version,
          serial: system.serial,
          uuid: system.uuid,
          sku: system.sku,
          virtual: system.virtual
        },
        cpu: {
          manufacturer: cpu.manufacturer,
          brand: cpu.brand,
          cores: cpu.cores,
          physicalCores: cpu.physicalCores,
          speed: cpu.speed,
          cache: cpu.cache
        },
        memory: {
          total: mem.total,
          used: mem.used,
          free: mem.free,
          active: mem.active,
          available: mem.available
        },
        os: {
          platform: os.platform,
          distro: os.distro,
          release: os.release,
          arch: os.arch,
          hostname: os.hostname,
          codename: os.codename,
          kernel: os.kernel,
          build: os.build
        },
        storage: {
          disks: disk.map(d => ({
            device: d.device,
            type: d.type,
            name: d.name,
            size: d.size,
            serial: d.serial
          }))
        },
        graphics: {
          controllers: graphics.controllers.map(g => ({
            model: g.model,
            vendor: g.vendor,
            vram: g.vram,
            driverVersion: g.driverVersion
          }))
        }
      }
    });
  } catch (error) {
    console.error('Error in /api/system/info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system information'
    });
  }
});

// Email validation endpoint
app.post('/api/validate/email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.json({
        success: true,
        data: {
          email,
          isValid: false,
          reason: 'Invalid email format',
          type: 'fake'
        }
      });
    }

    // Check for common fake email patterns
    const fakePatterns = [
      /^test@/i,
      /^admin@/i,
      /^user@/i,
      /^demo@/i,
      /^example@/i,
      /^fake@/i,
      /^dummy@/i,
      /@test\./i,
      /@example\./i,
      /@fake\./i,
      /@dummy\./i,
      /@localhost/i,
      /@127\.0\.0\.1/i,
      /@192\.168\./i,
      /@10\./i,
      /@172\.(1[6-9]|2[0-9]|3[0-1])\./i,
      /^[a-z]{1,3}@[a-z]{1,3}\.[a-z]{1,3}$/i, // Too short
      /^[a-z]+@[a-z]+\.[a-z]+$/i, // Generic pattern
    ];

    const isFake = fakePatterns.some(pattern => pattern.test(email));
    
    // Check for disposable email domains
    const disposableDomains = [
      'tempmail.org', '10minutemail.com', 'guerrillamail.com',
      'mailinator.com', 'yopmail.com', 'throwaway.email',
      'temp-mail.org', 'sharklasers.com', 'getairmail.com',
      'mailnesia.com', 'maildrop.cc', 'mailcatch.com',
      'mailmetrash.com', 'trashmail.com', 'spam4.me',
      'bccto.me', 'chacuo.net', 'dispostable.com',
      'fakeinbox.com', 'mailnull.com', 'spamspot.com'
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    const isDisposable = disposableDomains.includes(domain);

    // Check for real email characteristics
    const realEmailIndicators = [
      email.includes('.') && email.split('@')[1]?.includes('.'),
      email.length > 10,
      !email.includes('test'),
      !email.includes('admin'),
      !email.includes('user'),
      !email.includes('demo'),
      !email.includes('example'),
      !email.includes('fake'),
      !email.includes('dummy'),
      !isDisposable
    ];

    const realScore = realEmailIndicators.filter(Boolean).length;
    const isLikelyReal = realScore >= 7 && !isFake && !isDisposable;

    res.json({
      success: true,
      data: {
        email,
        isValid: true,
        type: isLikelyReal ? 'real' : 'fake',
        confidence: isLikelyReal ? 'high' : 'low',
        reasons: {
          isFake,
          isDisposable,
          realScore,
          indicators: {
            hasValidFormat: emailRegex.test(email),
            hasValidDomain: email.includes('.') && email.split('@')[1]?.includes('.'),
            hasReasonableLength: email.length > 10,
            notTestEmail: !email.includes('test'),
            notDisposable: !isDisposable
          }
        }
      }
    });

  } catch (error) {
    console.error('Error in email validation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate email'
    });
  }
});

// Get current user's machine bandwidth usage
app.get('/api/user/bandwidth', async (req, res) => {
  try {
    const { userEmail } = req.query;
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        error: 'User email is required'
      });
    }

    // Get current network stats
    const stats = await getNetworkStats();
    if (stats.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Unable to get network statistics'
      });
    }

    // Calculate current bandwidth
    const now = Date.now();
    const timeDiff = now - networkStats.current.timestamp;
    
    // Sum up all active interfaces for current user
    const totalStats = stats.reduce((acc, stat) => ({
      bytesReceived: acc.bytesReceived + (stat.rx_bytes || 0),
      bytesSent: acc.bytesSent + (stat.tx_bytes || 0),
      packetsReceived: acc.packetsReceived + (stat.rx_packets || 0),
      packetsSent: acc.packetsSent + (stat.tx_packets || 0)
    }), { bytesReceived: 0, bytesSent: 0, packetsReceived: 0, packetsSent: 0 });

    const bandwidth = calculateBandwidth(totalStats, networkStats.previous, timeDiff);
    
    // Get network interfaces for this user's machine
    const interfaces = await getNetworkInterfaces();
    
    // Calculate total usage in GB
    const totalBytesReceived = totalStats.bytesReceived;
    const totalBytesSent = totalStats.bytesSent;
    const totalUsageGB = (totalBytesReceived + totalBytesSent) / (1024 * 1024 * 1024);

    // Get system info for this machine
    const [cpu, mem, os] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.osInfo()
    ]);

    res.json({
      success: true,
      data: {
        user: {
          email: userEmail,
          machine: {
            hostname: os.hostname,
            platform: os.platform,
            release: os.release,
            arch: os.arch
          }
        },
        bandwidth: {
          current: {
            download: bandwidth.download,
            upload: bandwidth.upload,
            total: bandwidth.total
          },
          total: {
            received: totalBytesReceived,
            sent: totalBytesSent,
            usageGB: totalUsageGB
          }
        },
        network: {
          interfaces: interfaces.map(iface => ({
            name: iface.iface,
            type: iface.type,
            ip4: iface.ip4,
            mac: iface.mac,
            speed: iface.speed,
            duplex: iface.duplex,
            operstate: iface.operstate
          }))
        },
        system: {
          cpu: {
            model: cpu.model,
            cores: cpu.cores,
            speed: cpu.speed,
            load: cpu.load
          },
          memory: {
            total: mem.total,
            used: mem.used,
            free: mem.free,
            available: mem.available
          }
        },
        timestamp: now
      }
    });
  } catch (error) {
    console.error('User bandwidth error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user bandwidth data'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Network monitor server is running',
    timestamp: Date.now()
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Network Monitor Server running on port ${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   - GET /api/network/status - Full network status`);
  console.log(`   - GET /api/network/interfaces - Network interfaces`);
  console.log(`   - GET /api/network/bandwidth - Current bandwidth usage`);
  console.log(`   - GET /api/system/info - System information`);
  console.log(`   - GET /api/health - Health check`);
});

// Update stats every 5 seconds
setInterval(updateNetworkStats, 5000);

export default app; 