import React, { useState, useEffect } from 'react';
import useScanStore from '../stores/useScanStore';
import { Radar, Search, Activity, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const { scanUrl, currentScan, isLoading, fetchHistory, scanHistory } = useScanStore();
    const [url, setUrl] = useState('');
    const [model, setModel] = useState('lightgbm');
    const [expandedAccordion, setExpandedAccordion] = useState(null);

    useEffect(() => {
        fetchHistory(1, 5);
    }, [fetchHistory]);

    const handleScan = async (e) => {
        e.preventDefault();
        setExpandedAccordion(null);
        try {
            await scanUrl(url, model);
            fetchHistory(1, 5); // refresh history
            toast.success('Scan complete');
        } catch (error) {
            toast.error('Scan failed');
        }
    };

    const getScoreColor = (score) => {
        if (score < 30) return '#00E676'; // safe
        if (score < 70) return '#FFB800'; // warning
        return '#FF4D6D'; // danger
    };

    const renderGauge = (score) => {
        const data = [{ name: 'Score', value: score, fill: getScoreColor(score) }];
        return (
            <div className="relative w-48 h-48 mx-auto">
                <RadialBarChart 
                    width={192} 
                    height={192} 
                    innerRadius="70%" 
                    outerRadius="100%" 
                    data={data} 
                    startAngle={180} 
                    endAngle={-180}
                    barSize={15}
                >
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar minAngle={15} background={{ fill: 'rgba(255,255,255,0.05)' }} clockWise={true} dataKey="value" cornerRadius={10} />
                </RadialBarChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold font-mono">{Math.round(score)}</span>
                    <span className="text-xs text-gray-400 capitalize px-2 rounded-full border" style={{ borderColor: getScoreColor(score), color: getScoreColor(score) }}>
                        {score < 30 ? 'SAFE' : score < 70 ? 'SUSPICIOUS' : 'PHISHING'}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full mb-20">
            {/* Scan Input Section */}
            <section className="glass-card p-6 md:p-10 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Search className="text-cyan-400" /> New Scan
                </h2>
                
                <form onSubmit={handleScan} className="space-y-6 relative z-10">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-grow">
                            <input 
                                type="url" 
                                placeholder="https://example.com" 
                                required
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full bg-navy-900/50 border border-cyan-400/20 text-white rounded-lg px-4 py-4 focus:ring-2 focus:ring-cyan-400 focus:outline-none transition-all font-mono"
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-navy-900/50 border border-cyan-400/20 rounded-lg px-4 py-2">
                            <label className="text-sm text-gray-400 whitespace-nowrap">Model:</label>
                            <select 
                                value={model} 
                                onChange={(e) => setModel(e.target.value)}
                                className="bg-transparent text-white outline-none font-mono text-sm cursor-pointer"
                            >
                                <option className="bg-navy-800" value="lightgbm">LightGBM (Fast)</option>
                                <option className="bg-navy-800" value="attention">Attention Fusion (Deep)</option>
                                <option className="bg-navy-800" value="both">Ensemble (Both)</option>
                            </select>
                        </div>
                        <button type="submit" disabled={isLoading} className="btn-primary whitespace-nowrap hidden md:block">
                            Scan Now
                        </button>
                    </div>
                    <button type="submit" disabled={isLoading} className="btn-primary w-full md:hidden">
                        Scan Now
                    </button>
                </form>
            </section>

            {/* Loading State */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="glass-card p-12 flex flex-col items-center justify-center mb-8 border-cyan-400/50 relative overflow-hidden"
                    >
                        <div className="relative flex items-center justify-center w-24 h-24 mb-6">
                            <div className="absolute inset-0 border-4 border-cyan-400/20 rounded-full" />
                            <div className="absolute inset-0 border-4 border-cyan-400 rounded-full border-t-transparent animate-spin" />
                            <Radar className="w-8 h-8 text-cyan-400 animate-pulse" />
                        </div>
                        <h3 className="text-xl font-bold animate-pulse text-cyan-50">Analyzing features & running inference...</h3>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results Panel */}
            <AnimatePresence>
                {currentScan && !isLoading && (
                    <motion.section 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-6 md:p-8 mb-8"
                    >
                        <h2 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4">Scan Results</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            
                            {/* Score Gauge */}
                            <div className="col-span-1 flex flex-col items-center justify-center bg-white/5 rounded-xl p-6 border border-white/5 shadow-inner">
                                <h3 className="text-gray-400 font-mono mb-4">Final Threat Score</h3>
                                {renderGauge(currentScan.result.final_score)}
                                <div className="mt-4 text-center">
                                    <p className="text-sm text-gray-500 font-mono">Confidence: {currentScan.result.confidence}%</p>
                                    <p className="text-sm text-gray-500 font-mono">Inference: {currentScan.result.inference_time_ms}ms</p>
                                </div>
                            </div>

                            {/* Details Accordion */}
                            <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
                                <div className="p-4 bg-navy-900/50 rounded-xl border border-cyan-400/20 shadow-sm flex items-start gap-4">
                                    {currentScan.verdict === 'safe' ? <ShieldCheck className="w-8 h-8 text-green-400 mt-1" /> : 
                                     currentScan.verdict === 'suspicious' ? <AlertTriangle className="w-8 h-8 text-yellow-400 mt-1" /> : 
                                     <Activity className="w-8 h-8 text-coral-500 mt-1 animate-pulse" />}
                                    <div>
                                        <p className="text-sm text-gray-400 break-all">{currentScan.url}</p>
                                        <h4 className="text-lg font-bold mt-1">
                                            Verdict: <span style={{ color: getScoreColor(currentScan.result.final_score) }} className="uppercase">{currentScan.verdict}</span>
                                        </h4>
                                    </div>
                                </div>

                                {/* Models Breakdown */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <p className="text-xs text-gray-400 font-mono">LightGBM Model</p>
                                        <p className="text-2xl font-bold font-sora mt-1 text-cyan-400">{currentScan.result.lightgbm_score}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <p className="text-xs text-gray-400 font-mono">Attention Fusion</p>
                                        <p className="text-2xl font-bold font-sora mt-1 text-indigo-400">{currentScan.result.attention_score}</p>
                                    </div>
                                </div>

                                {/* Extracted Features Accordion */}
                                <button 
                                    onClick={() => setExpandedAccordion(expandedAccordion === 'features' ? null : 'features')}
                                    className="flex justify-between items-center w-full p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors mt-2"
                                >
                                    <span className="font-bold flex items-center gap-2"><Search className="w-4 h-4"/> View Extracted Features</span>
                                    {expandedAccordion === 'features' ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                                </button>
                                
                                <AnimatePresence>
                                    {expandedAccordion === 'features' && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden bg-navy-900/50 rounded-xl border border-cyan-400/20 p-4"
                                        >
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                {Object.entries({...currentScan.features.urlFeatures, ...currentScan.features.htmlFeatures}).slice(0, 20).map(([key, val]) => (
                                                    <div key={key} className="flex justify-between items-center bg-white/5 p-2 rounded text-xs font-mono">
                                                        <span className="text-gray-400 truncate pr-2 max-w-[150px]">{key}</span>
                                                        <span className="text-cyan-400">{val}</span>
                                                    </div>
                                                ))}
                                                <div className="col-span-full text-center text-xs text-gray-500 pt-2 border-t border-white/10">Showing top 20 of 45 features extracted.</div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                            </div>
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            {/* Scan History Table */}
            <section className="glass-card overflow-hidden">
                <div className="p-6 border-b border-cyan-400/20 bg-white/5">
                    <h2 className="text-xl font-bold flex items-center gap-2">Scan History (Recent)</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left bg-transparent border-collapse">
                        <thead>
                            <tr className="bg-navy-900/50 border-b border-cyan-400/20">
                                <th className="p-4 font-semibold text-gray-300">Date</th>
                                <th className="p-4 font-semibold text-gray-300">URL</th>
                                <th className="p-4 font-semibold text-gray-300">Model</th>
                                <th className="p-4 font-semibold text-gray-300">Score</th>
                                <th className="p-4 font-semibold text-gray-300">Verdict</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scanHistory.map((log) => (
                                <tr key={log._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-sm font-mono text-gray-400 whitespace-nowrap">
                                        {new Date(log.scannedAt).toLocaleString()}
                                    </td>
                                    <td className="p-4 text-sm font-mono truncate max-w-[200px] md:max-w-xs lg:max-w-md xl:max-w-lg" title={log.url}>
                                        {log.url}
                                    </td>
                                    <td className="p-4 text-sm text-gray-300 capitalize">{log.modelUsed}</td>
                                    <td className="p-4 text-sm font-mono text-cyan-400">{log.finalScore.toFixed(1)}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 text-xs rounded border capitalize font-bold" style={{ borderColor: getScoreColor(log.finalScore), color: getScoreColor(log.finalScore) }}>
                                            {log.verdict}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {scanHistory.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500 italic">No scan history available.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
