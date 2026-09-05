import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Zap, Search, Lock, ArrowRight, ShieldCheck, Activity } from 'lucide-react';
import useAuthStore from '../stores/useAuthStore';

const LandingPage = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const handleCTA = () => {
        if (user) navigate('/dashboard');
        else navigate('/register');
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col items-center">
            {/* Background Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] -z-10" />
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -z-10" />
            <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-coral-500/10 rounded-full blur-[100px] -z-10" />

            {/* Hero Section */}
            <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 backdrop-blur-sm mb-8">
                        <Zap className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-mono text-cyan-50">Powered by LightGBM + Attention Models</span>
                    </div>
                </motion.div>

                <motion.h1 
                    className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    Detect Phishing <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600">
                        Before It Detects You
                    </span>
                </motion.h1>

                <motion.p 
                    className="mt-4 text-xl text-gray-400 max-w-2xl mx-auto mb-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    Enterprise-grade URL and HTML analysis using machine learning. Protect yourself from zero-day phishing attacks instantly.
                </motion.p>

                <motion.div 
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    <button onClick={handleCTA} className="btn-primary flex items-center justify-center gap-2 text-lg px-8 py-4">
                        Start Scanning Free <ArrowRight className="w-5 h-5" />
                    </button>
                    <a href="#features" className="btn-ghost flex items-center justify-center text-lg px-8 py-4">
                        How it works
                    </a>
                </motion.div>
            </section>

            {/* Live Stats Row */}
            <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
                <div className="glass-card rounded-2xl p-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-cyan-400/20">
                    <div className="py-4 md:py-0">
                        <p className="text-sm font-mono text-cyan-400/80 mb-2">URLs Scanned Today</p>
                        <h3 className="text-4xl font-bold font-sora text-white flex items-center justify-center gap-2">
                            <Activity className="w-6 h-6 text-cyan-400" />
                            14,209
                        </h3>
                    </div>
                    <div className="py-4 md:py-0">
                        <p className="text-sm font-mono text-cyan-400/80 mb-2">Threats Blocked</p>
                        <h3 className="text-4xl font-bold font-sora text-white flex items-center justify-center gap-2">
                            <Shield className="w-6 h-6 text-coral-500" />
                            3,492
                        </h3>
                    </div>
                    <div className="py-4 md:py-0">
                        <p className="text-sm font-mono text-cyan-400/80 mb-2">Model Accuracy</p>
                        <h3 className="text-4xl font-bold font-sora text-white flex items-center justify-center gap-2">
                            <ShieldCheck className="w-6 h-6 text-green-400" />
                            99.2%
                        </h3>
                    </div>
                </div>
            </section>

            {/* Feature Cards */}
            <section id="features" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold">Unparalleled Detection Engine</h2>
                    <p className="text-gray-400 mt-4 max-w-2xl mx-auto">We extract 45 distinct features from both the URL semantics and the underlying HTML content to determine malicious intent.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { icon: <Search className="w-8 h-8 text-cyan-400" />, title: 'URL Semantics', desc: 'Analyzes string entropy, TLD credibility, and path anomalies.' },
                        { icon: <Lock className="w-8 h-8 text-blue-400" />, title: 'HTML Inspection', desc: 'Checks for hidden iframes, external login forms, and obfuscation.' },
                        { icon: <Zap className="w-8 h-8 text-indigo-400" />, title: 'Dual-Model Engine', desc: 'LightGBM and Attention-Based Deep Fusion run in parallel.' },
                        { icon: <Activity className="w-8 h-8 text-coral-400" />, title: 'Real-Time Results', desc: 'Inference latency under 150ms ensures instant protection.' }
                    ].map((feat, idx) => (
                        <motion.div 
                            key={idx}
                            whileHover={{ y: -5 }}
                            className="glass-card p-6 flex flex-col items-start bg-gradient-to-b from-white/5 to-transparent"
                        >
                            <div className="p-3 bg-white/5 rounded-lg mb-4 border border-white/10">
                                {feat.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-2">{feat.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
