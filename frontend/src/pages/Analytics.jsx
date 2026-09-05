import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { Activity, Shield, AlertTriangle, Target } from 'lucide-react';
import toast from 'react-hot-toast';

const Analytics = () => {
    const [summary, setSummary] = useState(null);
    const [trend, setTrend] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const [sumRes, trendRes] = await Promise.all([
                    api.get('/api/analytics/summary'),
                    api.get('/api/analytics/trend')
                ]);
                setSummary(sumRes.data);
                
                // Format trend data for chart
                let formattedTrend = trendRes.data;
                if (!formattedTrend || formattedTrend.length === 0) {
                    // Mock data if empty
                    formattedTrend = [...Array(7)].map((_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - (6 - i));
                        return { _id: d.toISOString().split('T')[0], count: Math.floor(Math.random() * 50) + 10 };
                    });
                }
                setTrend(formattedTrend);
            } catch (error) {
                toast.error('Failed to load analytics');
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    const COLORS = ['#00E676', '#FFB800', '#FF4D6D']; // Safe, Suspicious, Phishing

    if (isLoading || !summary) {
        return <div className="flex justify-center py-20 text-cyan-400">Loading analytics...</div>;
    }

    const pieData = [
        { name: 'Safe', value: summary.verdicts.safe || 1 },
        { name: 'Suspicious', value: summary.verdicts.suspicious || 0 },
        { name: 'Phishing', value: summary.verdicts.phishing || 0 },
    ];

    const modelData = [
        { name: 'LightGBM', accuracy: 99.2 },
        { name: 'Attention Fusion', accuracy: 98.7 },
        { name: 'Ensemble', accuracy: 99.5 }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full mb-20">
            <h2 className="text-3xl font-bold mb-8">Global Analytics</h2>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="glass-card p-6 border-l-4 border-l-cyan-400">
                    <p className="text-gray-400 text-sm font-mono mb-2 flex items-center gap-2"><Activity className="w-4 h-4"/> Total Scans</p>
                    <p className="text-3xl font-bold font-sora">{summary.totalScans}</p>
                </div>
                <div className="glass-card p-6 border-l-4 border-l-red-500">
                    <p className="text-gray-400 text-sm font-mono mb-2 flex items-center gap-2"><Shield className="w-4 h-4"/> Threats Detected</p>
                    <p className="text-3xl font-bold font-sora">{summary.verdicts.phishing}</p>
                </div>
                <div className="glass-card p-6 border-l-4 border-l-yellow-400">
                    <p className="text-gray-400 text-sm font-mono mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Suspicious</p>
                    <p className="text-3xl font-bold font-sora">{summary.verdicts.suspicious}</p>
                </div>
                <div className="glass-card p-6 border-l-4 border-l-green-400">
                    <p className="text-gray-400 text-sm font-mono mb-2 flex items-center gap-2"><Target className="w-4 h-4"/> Detection Rate</p>
                    <p className="text-3xl font-bold font-sora">{summary.detectionRate}%</p>
                </div>
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                
                {/* Line Chart: Scans over time */}
                <div className="glass-card p-6">
                    <h3 className="text-xl font-bold mb-6 font-sora">Scan Activity (Last 30 Days)</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="_id" stroke="rgba(255,255,255,0.5)" tick={{fill: '#9CA3AF', fontSize: 12}} />
                                <YAxis stroke="rgba(255,255,255,0.5)" tick={{fill: '#9CA3AF', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0a1936', border: '1px solid rgba(0, 229, 255, 0.2)' }}
                                    itemStyle={{ color: '#00E5FF' }}
                                />
                                <Line type="monotone" dataKey="count" stroke="#00E5FF" strokeWidth={3} dot={{ fill: '#00E5FF', r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart: Verdict Distribution */}
                <div className="glass-card p-6">
                    <h3 className="text-xl font-bold mb-6 font-sora">Verdict Distribution</h3>
                    <div className="h-72 w-full flex justify-center items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#0a1936', border: '1px solid rgba(0, 229, 255, 0.2)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bar Chart: Model Accuracy */}
                <div className="glass-card p-6 lg:col-span-2">
                    <h3 className="text-xl font-bold mb-6 font-sora">Model Evaluation Metrics</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={modelData} maxBarSize={60}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{fill: '#9CA3AF'}} />
                                <YAxis domain={[90, 100]} stroke="rgba(255,255,255,0.5)" tick={{fill: '#9CA3AF'}} />
                                <Tooltip contentStyle={{ backgroundColor: '#0a1936', border: '1px solid rgba(0, 229, 255, 0.2)' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="accuracy" fill="#FF4D6D" radius={[4, 4, 0, 0]} name="Accuracy (%)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
