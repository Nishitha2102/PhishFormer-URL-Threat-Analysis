import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';
import toast from 'react-hot-toast';
import { Mail, Lock, User, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { register, isLoading, user } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(name, email, password);
            toast.success('Registration successful!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.message || 'Registration failed');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md p-8 glass-card rounded-2xl relative overflow-hidden"
            >
                <div className="absolute -top-16 -right-16 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-coral-500/20 rounded-full blur-3xl"></div>

                <div className="text-center mb-8 relative z-10">
                    <ShieldAlert className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold font-sora">Create Account</h2>
                    <p className="text-gray-400 mt-2 font-mono text-sm">Join PhishFormer today</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-cyan-400/50" />
                        </div>
                        <input
                            type="text"
                            className="bg-navy-800/50 border border-cyan-400/20 text-white rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent block w-full pl-10 p-3 outline-none transition-all placeholder-gray-500"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-cyan-400/50" />
                        </div>
                        <input
                            type="email"
                            className="bg-navy-800/50 border border-cyan-400/20 text-white rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent block w-full pl-10 p-3 outline-none transition-all placeholder-gray-500"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-cyan-400/50" />
                        </div>
                        <input
                            type="password"
                            className="bg-navy-800/50 border border-cyan-400/20 text-white rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent block w-full pl-10 p-3 outline-none transition-all placeholder-gray-500"
                            placeholder="Password (min 6 chars)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full btn-primary"
                    >
                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                    
                    <p className="text-center text-sm text-gray-400 mt-4">
                        Already have an account? <Link to="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">Log in</Link>
                    </p>
                </form>
            </motion.div>
        </div>
    );
};

export default Register;
