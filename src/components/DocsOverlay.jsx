import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Book,
    Wifi,
    Mic,
    Star,
    Zap,
    Smartphone,
    Github,
    Bell
} from 'lucide-react';

const DocsOverlay = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[120] flex items-end md:items-center justify-end md:justify-center pointer-events-none"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="w-full md:w-[480px] h-full bg-white shadow-2xl pointer-events-auto overflow-y-auto relative"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Documentation</h2>
                                <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-1">EchoList Manual v1.0</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-12">
                            {/* Section 1: Introduction */}
                            <section>
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                                    <Book size={20} className="text-indigo-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Getting Started</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    EchoList is a minimal, high-speed task manager designed for seamless synchronization across all your devices.
                                    Built for <b>iOS, Android, and Web</b>, it keeps your flow uninterrupted.
                                </p>
                            </section>

                            {/* Section 2: How to Connect */}
                            <section>
                                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
                                    <Wifi size={20} className="text-orange-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-4">Sonic Sync (Broadcast)</h3>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                                        <p className="text-sm text-slate-600">
                                            Open EchoList on two devices (e.g., Laptop and Phone).
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                                        <p className="text-sm text-slate-600">
                                            Click the <b>Connect</b> button on both.
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                                        <p className="text-sm text-slate-600">
                                            Tap <b>Broadcast</b> on one device and <b>Listen</b> on the other.
                                        </p>
                                    </div>
                                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Mic size={14} className="text-orange-600" />
                                            <span className="text-xs font-bold uppercase text-orange-600 tracking-wider">Loud & Clear</span>
                                        </div>
                                        <p className="text-xs text-orange-800 leading-relaxed">
                                            Ensure your volume is up! The devices communicate via ultrasonic audio. Keep them close for a "magical" handshake.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Section 3: Features */}
                            <section>
                                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                                    <Zap size={20} className="text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-4">Power Features</h3>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <Bell size={16} className="text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">Intelligent Reminders</p>
                                            <p className="text-xs text-slate-500 mt-1">Just type "Call Mom in 20 mins" or "Meeting at 5pm". The app automatically schedules a notification.</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Smartphone size={16} className="text-slate-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">Native Mobile Support</p>
                                            <p className="text-xs text-slate-500 mt-1">Install as a native app on iOS and Android for hybrid local notifications.</p>
                                        </div>
                                    </li>
                                </ul>
                            </section>

                            {/* Section 4: GitHub */}
                            <section className="pt-8 border-t border-slate-100">
                                <a
                                    href="https://github.com/Arsh-pixel-cmd/EchoList-"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block group"
                                >
                                    <div className="p-6 bg-slate-900 rounded-2xl text-white group-hover:scale-[1.02] transition-transform">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Github size={20} />
                                            <span className="text-sm font-bold">Open Source</span>
                                        </div>
                                        <h3 className="text-lg font-bold mb-1">Star us on GitHub</h3>
                                        <p className="text-xs text-slate-400">Support the development of EchoList.</p>
                                    </div>
                                </a>
                            </section>

                            {/* Footer */}
                            <div className="text-center">
                                <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">
                                    Designed by Arsh
                                </p>
                            </div>

                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DocsOverlay;
