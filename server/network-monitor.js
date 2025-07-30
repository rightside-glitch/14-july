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

// Get current network interfaces
async function getNetworkInterfaces() {
  try {
    const networkInterfaces = await si.networkInterfaces();
    return networkInterfaces.filter(iface => 
      iface.operstate === 'up' && 
      iface.type !== 'loopback' &&
      iface.ip4
    );
  } catch (error) {
    console.error('Error getting network interfaces:', error);
    return [];
  }
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

// Get system information
app.get('/api/system/info', async (req, res) => {
  try {
    const [cpu, mem, os] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.osInfo()
    ]);

    res.json({
      success: true,
      data: {
        cpu: {
          manufacturer: cpu.manufacturer,
          brand: cpu.brand,
          cores: cpu.cores,
          physicalCores: cpu.physicalCores
        },
        memory: {
          total: mem.total,
          used: mem.used,
          free: mem.free,
          active: mem.active
        },
        os: {
          platform: os.platform,
          distro: os.distro,
          release: os.release,
          arch: os.arch
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