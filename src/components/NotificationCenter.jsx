import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Bell, BellOff } from 'lucide-react';
import NotificationService from '../services/NotificationService';

const NotificationCenter = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState([]);

    // Load history whenever panel opens
    useEffect(() => {
        if (isOpen) {
            const history = NotificationService.getHistory();
            // Use rAF to avoid synchronous setState in effect body
            requestAnimationFrame(() => {
                setNotifications(history);
            });
        }
    }, [isOpen]);

    const handleClearAll = () => {
        NotificationService.clearHistory();
        setNotifications([]);
    };

    const handleRemoveOne = (id) => {
        const updated = notifications.filter(n => n.id !== id);
        setNotifications(updated);
        // Persist
        localStorage.setItem('echo_notification_history', JSON.stringify(updated));
    };

    const formatTime = (iso) => {
        try {
            const d = new Date(iso);
            const now = new Date();
            const diff = now - d;
            if (diff < 0) {
                // Future — show scheduled time
                return `Scheduled · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            }
            if (diff < 60000) return 'Just now';
            if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
            if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
            return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        } catch {
            return '';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[120] flex items-end md:items-center justify-end pointer-events-none"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="w-full md:w-[420px] h-full bg-white shadow-2xl pointer-events-auto overflow-y-auto relative"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-8 py-6 border-b border-slate-100">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Notifications</h2>
                                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em] mt-1">
                                        {notifications.length} {notifications.length === 1 ? 'item' : 'items'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {notifications.length > 0 && (
                                        <button
                                            onClick={handleClearAll}
                                            className="h-9 px-3 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl flex items-center gap-1.5 transition-colors text-[10px] font-bold uppercase tracking-wider"
                                        >
                                            <Trash2 size={12} />
                                            Clear All
                                        </button>
                                    )}
                                    <button
                                        onClick={onClose}
                                        className="w-9 h-9 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                                        <BellOff size={24} className="text-slate-200" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-300 mb-1">All clear</p>
                                    <p className="text-xs text-slate-200 max-w-[200px]">
                                        Notifications from your reminders will appear here.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <AnimatePresence initial={false}>
                                        {notifications.map((notif) => (
                                            <motion.div
                                                key={notif.id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: 80, transition: { duration: 0.2 } }}
                                                className="group relative bg-white border border-slate-100 hover:border-slate-200 rounded-2xl p-4 transition-colors"
                                            >
                                                {/* Dismiss button */}
                                                <button
                                                    onClick={() => handleRemoveOne(notif.id)}
                                                    className="absolute top-3 right-3 w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <X size={12} />
                                                </button>

                                                <div className="flex items-start gap-3">
                                                    {/* Category icon */}
                                                    <div
                                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                                                        style={{ backgroundColor: `${notif.color}12` }}
                                                    >
                                                        {notif.icon}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-semibold text-slate-900 truncate pr-6">{notif.body}</p>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <span
                                                                className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                                                                style={{ color: notif.color, backgroundColor: `${notif.color}12` }}
                                                            >
                                                                {notif.categoryId}
                                                            </span>
                                                            <span className="text-[10px] text-slate-300 font-medium">
                                                                {formatTime(notif.scheduledAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-4 border-t border-slate-50 text-center">
                            <p className="text-[9px] text-slate-200 uppercase tracking-[0.2em] font-bold">
                                Auto-categorized by EchoList
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NotificationCenter;
