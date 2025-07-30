# Real Network Monitoring Setup Guide

This guide will help you set up real network monitoring for your Bandwidth Beacon Watch application. The system can now read actual network data from your computer and display it in real-time.

## 🚀 Quick Start

### 1. Install Dependencies

First, install the new dependencies for real network monitoring:

```bash
npm install
```

### 2. Start the Network Monitor Server

In a new terminal window, start the backend server that reads real network data:

```bash
npm run server
```

You should see output like:
```
🚀 Network Monitor Server running on port 3001
📊 API endpoints:
   - GET /api/network/status - Full network status
   - GET /api/network/interfaces - Network interfaces
   - GET /api/network/bandwidth - Current bandwidth usage
   - GET /api/system/info - System information
   - GET /api/health - Health check
```

### 3. Start the Frontend Application

In another terminal window, start the React application:

```bash
npm run dev
```

### 4. Run Both Together (Recommended)

You can run both the server and frontend together using:

```bash
npm run dev:full
```

## 🔧 How It Works

### Backend Server (`server/network-monitor.js`)

The backend server uses the `systeminformation` library to:

- **Read Network Interfaces**: Gets all active network interfaces (WiFi, Ethernet, etc.)
- **Monitor Bandwidth**: Tracks bytes sent/received in real-time
- **Calculate Usage**: Converts raw data to Mbps and GB/h
- **Provide API**: Exposes data via REST endpoints

### Frontend Integration (`src/hooks/use-real-network.ts`)

The custom React hook:

- **Connects to Backend**: Fetches data from the local server
- **Real-time Updates**: Polls for new data every 5 seconds
- **Fallback Support**: Gracefully falls back to simulated data if server is offline
- **Data Conversion**: Converts network data to match existing app format

### User Dashboard Updates

The UserDashboard now shows:

- **Real Network Status**: Green indicator when real data is available
- **Network Interfaces**: Shows actual network cards on your computer
- **Live Bandwidth**: Real download/upload speeds in Mbps
- **System Information**: CPU, memory, and OS details

## 📊 API Endpoints

The backend server provides these endpoints:

### `GET /api/network/status`
Returns complete network status including interfaces and current bandwidth.

### `GET /api/network/interfaces`
Returns all active network interfaces with IP addresses, MAC addresses, and speeds.

### `GET /api/network/bandwidth`
Returns current bandwidth usage in Mbps.

### `GET /api/system/info`
Returns system information (CPU, memory, OS).

### `GET /api/health`
Health check endpoint to verify server is running.

## 🖥️ Supported Operating Systems

The network monitoring works on:

- ✅ **Windows 10/11** (Primary support)
- ✅ **macOS** (Intel and Apple Silicon)
- ✅ **Linux** (Most distributions)

## 🔍 Troubleshooting

### Server Won't Start

1. **Check Port**: Make sure port 3001 is not in use
2. **Permissions**: On Windows, run as Administrator if needed
3. **Dependencies**: Ensure all packages are installed with `npm install`

### No Network Data

1. **Check Server**: Verify the server is running on port 3001
2. **Network Interfaces**: Ensure you have active network connections
3. **Firewall**: Check if Windows Firewall is blocking the application

### Frontend Shows "Network Monitor Offline"

1. **Server Status**: Check if the backend server is running
2. **CORS Issues**: The server includes CORS headers, but check browser console
3. **Port Mismatch**: Ensure frontend is trying to connect to `localhost:3001`

### Performance Issues

1. **Update Frequency**: Data is collected every 5 seconds by default
2. **Memory Usage**: The server keeps 5 minutes of history (60 data points)
3. **CPU Usage**: Network monitoring is lightweight, but monitor system resources

## 🛠️ Customization

### Change Update Frequency

Edit `server/network-monitor.js`:

```javascript
// Update stats every 5 seconds (change this value)
setInterval(updateNetworkStats, 5000);
```

### Modify Data Retention

Edit the history limit in `server/network-monitor.js`:

```javascript
// Keep last 60 entries for 5 minutes of data (change this value)
if (networkStats.history.length > 60) {
  networkStats.history.shift();
}
```

### Add More System Information

Extend the system info endpoint in `server/network-monitor.js`:

```javascript
app.get('/api/system/info', async (req, res) => {
  try {
    const [cpu, mem, os, disk] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.osInfo(),
      si.diskLayout() // Add disk information
    ]);
    // ... rest of the code
  } catch (error) {
    // ... error handling
  }
});
```

## 🔒 Security Considerations

- **Local Only**: The server only runs on localhost (127.0.0.1)
- **No Authentication**: Designed for local development/demo use
- **System Access**: Requires access to system network interfaces
- **Firewall**: May need to allow the application through Windows Firewall

## 📈 Data Flow

1. **System Level**: `systeminformation` library reads network statistics
2. **Backend**: Server calculates bandwidth and stores history
3. **API**: REST endpoints provide data to frontend
4. **Frontend**: React hook fetches and processes data
5. **UI**: UserDashboard displays real network information
6. **Firestore**: Real data is stored alongside existing simulated data

## 🎯 Benefits

- **Real Data**: See actual network usage from your computer
- **Multiple Interfaces**: Monitor WiFi, Ethernet, and other connections
- **System Info**: Get CPU, memory, and OS details
- **Fallback Support**: Gracefully handles server offline scenarios
- **Real-time Updates**: Live bandwidth monitoring every 5 seconds
- **Compatible**: Works with existing virtual network system

## 🚀 Next Steps

Once you have real network monitoring working:

1. **Test Different Networks**: Try connecting to different WiFi networks
2. **Monitor Usage Patterns**: Watch how bandwidth changes during different activities
3. **Compare with Simulated**: See the difference between real and simulated data
4. **Extend Features**: Add more system monitoring capabilities

## 📞 Support

If you encounter issues:

1. Check the browser console for errors
2. Verify the server is running and accessible
3. Test the API endpoints directly (e.g., `http://localhost:3001/api/health`)
4. Check Windows Event Viewer for system-level errors

The real network monitoring feature transforms your bandwidth tracker from a simulation into a genuine network monitoring tool! 