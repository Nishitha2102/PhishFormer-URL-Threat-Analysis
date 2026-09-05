import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';
import { ShieldAlert, LogOut, LayoutDashboard, BarChart3, Menu, X } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="fixed w-full z-50 glass-card bg-navy-900/60 rounded-none border-t-0 border-r-0 border-l-0 border-b border-cyan-400/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center gap-2 group">
                            <ShieldAlert className="w-8 h-8 text-cyan-400 group-hover:text-coral-500 transition-colors duration-300" />
                            <span className="font-bold text-xl tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                                PhishFormer
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        {user ? (
                            <>
                                <Link to="/dashboard" className="text-gray-300 hover:text-cyan-400 flex items-center gap-2 transition-colors">
                                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                                </Link>
                                <Link to="/analytics" className="text-gray-300 hover:text-cyan-400 flex items-center gap-2 transition-colors">
                                    <BarChart3 className="w-4 h-4" /> Analytics
                                </Link>
                                <div className="flex items-center gap-4 pl-4 border-l border-cyan-400/20">
                                    <span className="text-sm font-mono text-cyan-400/70">{user.email}</span>
                                    <button 
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 text-coral-500 hover:text-red-400 transition-colors"
                                    >
                                        <LogOut className="w-5 h-5" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-300 hover:text-cyan-400 transition-colors font-semibold">
                                    Log In
                                </Link>
                                <Link to="/register" className="btn-primary py-2 px-4 shadow-none">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-300 hover:text-cyan-400">
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="md:hidden bg-navy-800/95 backdrop-blur-lg border-b border-cyan-400/20">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {user ? (
                            <>
                                <Link to="/dashboard" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-cyan-400">Dashboard</Link>
                                <Link to="/analytics" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-cyan-400">Analytics</Link>
                                <button onClick={() => { handleLogout(); setIsOpen(false); }} className="w-full text-left block px-3 py-2 text-base font-medium text-coral-500 hover:text-red-400">Log Out</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-cyan-400">Log In</Link>
                                <Link to="/register" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-cyan-400">Register</Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
