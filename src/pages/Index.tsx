
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Shield, Users, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-cyan-500/20 rounded-full">
              <Activity className="h-12 w-12 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Real-Time Bandwidth Tracker
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Monitor and manage network bandwidth usage across all devices with real-time analytics and comprehensive reporting
          </p>
        </div>

        {/* Interface Selection */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer group"
                onClick={() => navigate('/admin')}>
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-red-500/20 rounded-full group-hover:bg-red-500/30 transition-colors">
                  <Shield className="h-8 w-8 text-red-400" />
                </div>
              </div>
              <CardTitle className="text-2xl text-white">Admin Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-slate-300 mb-6">
                Full network control with device management, bandwidth allocation, and system configuration
              </p>
              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Device Management</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Bandwidth Allocation</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>System Analytics</span>
                </div>
              </div>
              <Button className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white">
                Access Admin Panel
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer group"
                onClick={() => navigate('/user')}>
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-cyan-500/20 rounded-full group-hover:bg-cyan-500/30 transition-colors">
                  <Monitor className="h-8 w-8 text-cyan-400" />
                </div>
              </div>
              <CardTitle className="text-2xl text-white">User Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-slate-300 mb-6">
                Monitor your device usage, view bandwidth statistics, and track data consumption
              </p>
              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Real-time Usage</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Device Statistics</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Usage History</span>
                </div>
              </div>
              <Button className="mt-6 w-full bg-cyan-600 hover:bg-cyan-700 text-white">
                View My Usage
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="text-center py-6">
              <Users className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">24</div>
              <div className="text-slate-400">Active Devices</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="text-center py-6">
              <Activity className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">156.7 GB</div>
              <div className="text-slate-400">Total Usage Today</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="text-center py-6">
              <Monitor className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">98.5%</div>
              <div className="text-slate-400">Network Uptime</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
