import React, { useState, useEffect } from 'react';
import { Download, Share, X } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showIOSPrompt, setShowIOSPrompt] = useState(false);

    // Initialize lazily
    const [isIOS] = useState(() => {
        if (typeof window !== 'undefined') {
            return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
        }
        return false;
    });

    const [isStandalone] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone ||
                document.referrer.includes('android-app://');
        }
        return false;
    });

    useEffect(() => {
        // Capture install prompt for Android/Desktop
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (isIOS) {
            setShowIOSPrompt(true);
        } else if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        } else {
            // Fallback for when prompt isn't available but user is not on iOS
            alert("To install, look for the 'Install' icon in your browser address bar.");
        }
    };

    // Don't show if already installed
    if (isStandalone) return null;

    // Render "Download App" button only if we have a prompt OR we are on iOS
    // (On desktop chrome, prompt event fires. On iOS, it doesn't, so we always show for iOS)

    const showButton = deferredPrompt || isIOS;

    if (!showButton) return null;

    return (
        <>
            <button
                onClick={handleInstallClick}
                className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform"
            >
                <Download size={16} />
                Download App
            </button>

            {/* iOS Instructions Overlay */}
            <AnimatePresence>
                {showIOSPrompt && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
                        onClick={() => setShowIOSPrompt(false)}
                    >
                        <motion.div
                            initial={{ y: 100 }}
                            animate={{ y: 0 }}
                            exit={{ y: 100 }}
                            className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-6 relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowIOSPrompt(false)}
                                className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                            >
                                <X size={16} />
                            </button>

                            <div className="flex flex-col items-center text-center gap-4 pt-4">
                                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-2">
                                    <img src="/icon.png" alt="App Icon" className="w-10 h-10 object-contain" />
                                </div>

                                <h3 className="text-xl font-bold text-slate-900">Install EchoList</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    To install on your iPhone/iPad:
                                </p>

                                <div className="flex flex-col gap-4 w-full mt-2">
                                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl text-left">
                                        <Share size={24} className="text-blue-500 shrink-0" />
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">1. Tap Share</p>
                                            <p className="text-xs text-slate-400">At the bottom of your screen</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl text-left">
                                        <span className="w-6 h-6 flex items-center justify-center bg-slate-200 rounded-md font-bold text-xs text-slate-600">+</span>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">2. Add to Home Screen</p>
                                            <p className="text-xs text-slate-400">Scroll down to find this option</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default InstallPrompt;
