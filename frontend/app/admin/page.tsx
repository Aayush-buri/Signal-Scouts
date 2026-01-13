'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Activity, Database, DollarSign, Users, TrendingUp, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
    const [metrics, setMetrics] = useState({
        totalReadings: 0,
        totalCells: 0,
        activeUsers: 0,
        avgConfidence: 0
    });
    const [loading, setLoading] = useState(false);

    // Mock data - in production, fetch from API
    const networkDistribution = [
        { name: '5G', value: 45, color: '#10b981' },
        { name: '4G', value: 30, color: '#84cc16' },
        { name: 'LTE', value: 20, color: '#f59e0b' },
        { name: 'WiFi', value: 5, color: '#0ea5e9' }
    ];

    const hourlyIngestion = [
        { hour: '00:00', count: 120 },
        { hour: '04:00', count: 80 },
        { hour: '08:00', count: 350 },
        { hour: '12:00', count: 580 },
        { hour: '16:00', count: 720 },
        { hour: '20:00', count: 450 }
    ];

    useEffect(() => {
        // Simulate loading metrics
        setLoading(true);
        setTimeout(() => {
            setMetrics({
                totalReadings: 1234567,
                totalCells: 45821,
                activeUsers: 3892,
                avgConfidence: 0.78
            });
            setLoading(false);
        }, 1000);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Header */}
            <header className="glass-dark border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                            <p className="text-sm text-gray-400 mt-1">System Overview & Analytics</p>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition flex items-center gap-2"
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Readings */}
                    <div className="card-hover bg-gradient-to-br from-primary-500 to-primary-700 text-white p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-sm opacity-90 mb-1">Total Readings</div>
                                <div className="text-3xl font-bold">
                                    {loading ? '—' : metrics.totalReadings.toLocaleString()}
                                </div>
                                <div className="text-xs opacity-75 mt-2 flex items-center gap-1">
                                    <TrendingUp size={14} />
                                    +12% from last week
                                </div>
                            </div>
                            <Database size={32} className="opacity-80" />
                        </div>
                    </div>

                    {/* Active Cells */}
                    <div className="card-hover bg-gradient-to-br from-signal-good to-signal-excellent text-white p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-sm opacity-90 mb-1">Active H3 Cells</div>
                                <div className="text-3xl font-bold">
                                    {loading ? '—' : metrics.totalCells.toLocaleString()}
                                </div>
                                <div className="text-xs opacity-75 mt-2 flex items-center gap-1">
                                    <TrendingUp size={14} />
                                    Coverage expanding
                                </div>
                            </div>
                            <BarChart3 size={32} className="opacity-80" />
                        </div>
                    </div>

                    {/* Active Users */}
                    <div className="card-hover bg-gradient-to-br from-purple-500 to-purple-700 text-white p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-sm opacity-90 mb-1">Active Users</div>
                                <div className="text-3xl font-bold">
                                    {loading ? '—' : metrics.activeUsers.toLocaleString()}
                                </div>
                                <div className="text-xs opacity-75 mt-2">Last 24 hours</div>
                            </div>
                            <Users size={32} className="opacity-80" />
                        </div>
                    </div>

                    {/* Avg Confidence */}
                    <div className="card-hover bg-gradient-to-br from-amber-500 to-amber-700 text-white p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-sm opacity-90 mb-1">Avg Confidence</div>
                                <div className="text-3xl font-bold">
                                    {loading ? '—' : `${Math.round(metrics.avgConfidence * 100)}%`}
                                </div>
                                <div className="text-xs opacity-75 mt-2">Data quality metric</div>
                            </div>
                            <Activity size={32} className="opacity-80" />
                        </div>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                    {/* Hourly Ingestion */}
                    <div className="card-hover bg-gray-800/50 backdrop-blur-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-6">24-Hour Ingestion Rate</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={hourlyIngestion}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="hour" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                    labelStyle={{ color: '#f3f4f6' }}
                                />
                                <Bar dataKey="count" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Network Type Distribution */}
                    <div className="card-hover bg-gray-800/50 backdrop-blur-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-6">Network Type Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={networkDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {networkDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* System Health */}
                <div className="card-hover bg-gray-800/50 backdrop-blur-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">System Health</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* API Health */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-signal-excellent/20 rounded-full flex items-center justify-center">
                                <Activity className="text-signal-excellent" size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-400">API Status</div>
                                <div className="text-lg font-semibold text-white">Operational</div>
                            </div>
                        </div>

                        {/* Database Health */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-signal-excellent/20 rounded-full flex items-center justify-center">
                                <Database className="text-signal-excellent" size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-400">Database</div>
                                <div className="text-lg font-semibold text-white">Healthy</div>
                            </div>
                        </div>

                        {/* Cache Health */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-signal-excellent/20 rounded-full flex items-center justify-center">
                                <BarChart3 className="text-signal-excellent" size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-400">Redis Cache</div>
                                <div className="text-lg font-semibold text-white">Active</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cost Monitoring */}
                <div className="mt-8 card-hover bg-gray-800/50 backdrop-blur-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <DollarSign className="text-primary-500" />
                        Monthly Cost Estimate
                    </h3>
                    <div className="grid md:grid-cols-4 gap-6">
                        <div>
                            <div className="text-sm text-gray-400 mb-1">Database</div>
                            <div className="text-2xl font-bold text-white">$50</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-400 mb-1">API Hosting</div>
                            <div className="text-2xl font-bold text-white">$25</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-400 mb-1">Redis Cache</div>
                            <div className="text-2xl font-bold text-white">$15</div>
                        </div>
                        <div className="border-l-2 border-primary-500 pl-6">
                            <div className="text-sm text-gray-400 mb-1">Total</div>
                            <div className="text-3xl font-bold text-primary-500">$90</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
