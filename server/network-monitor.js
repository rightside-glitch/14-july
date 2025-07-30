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