import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic,
    Wifi,
    Link as LinkIcon,
    X,
    Check,
    LogOut
} from 'lucide-react';
import { broadcastAudio, listenAudio } from '../lib/sync/audio';
import { broadcastData, initPeer, connectToPeer, ensureConnection } from '../lib/sync/peer';

const SyncOverlay = ({ isOpen, onClose, onSync, onConnectionChange, onPeerData }) => {
    const [activeTab, setActiveTab] = useState('cognitive'); // 'cognitive' | 'sonic'
    const [isListening, setIsListening] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, processing, success, error
    const [peerId, setPeerId] = useState(null);
    const [remoteDevice, setRemoteDevice] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [copied, setCopied] = useState(false);
    const [pasteValue, setPasteValue] = useState('');

    const shareUrl = peerId ? `${window.location.origin}${window.location.pathname}?pair=${peerId}` : '';

    const handleCopyLink = () => {
        if (!shareUrl) return;
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleShareLink = () => {
        if (!shareUrl) return;
        if (navigator.share) {
            navigator.share({
                title: 'EchoList Sync Bridge',
                text: 'Connect and sync your EchoList tasks.',
                url: shareUrl,
            }).catch(() => {});
        }
    };

    const handleConnectWithLink = (e) => {
        if (e) e.preventDefault();
        const value = pasteValue.trim();
        if (!value) return;

        let targetPeerId = value;

        try {
            if (value.startsWith('http://') || value.startsWith('https://') || value.includes('?')) {
                const url = value.includes('?') ? value : `http://dummy.com/${value}`;
                const urlObj = new URL(url);
                const idParam = urlObj.searchParams.get('pair') || urlObj.searchParams.get('syncId');
                if (idParam) {
                    targetPeerId = idParam;
                }
            }
        } catch {
            // Ignore URL parsing errors
        }

        if (targetPeerId === peerId) {
            setErrorMessage("Cannot connect to your own device.");
            setStatus('error');
            return;
        }

        setStatus('processing');
        setErrorMessage("Connecting to entered link...");

        connectToPeer(targetPeerId, (incoming) => {
            if (incoming && incoming.type === 'handshake') {
                setRemoteDevice(incoming.device);
                setStatus('success');
                return;
            }
            if (onPeerData) onPeerData(incoming);
        // eslint-disable-next-line no-unused-vars
        }, (_conn) => {
            if (onConnectionChange) onConnectionChange(true);
            setTimeout(() => {
                const myDevice = getDeviceType();
                broadcastData({ type: 'handshake', device: myDevice });
            }, 500);
        }, () => {
            setStatus('error');
            setErrorMessage("Link connection failed. Is the other device online?");
        });
    };

    // Detect Device Type
    const getDeviceType = () => {
        const ua = navigator.userAgent;
        if (/android/i.test(ua)) return "Android Phone";
        if (/ipad|iphone|ipod/i.test(ua)) return "iPhone";
        return "Computer";
    };

    // Initialize PeerJS on mount (or when overlay opens)
    useEffect(() => {
        // eslint-disable-next-line no-unused-vars
        const handleConnected = (_conn) => {
            if (onConnectionChange) onConnectionChange(true);
            // Send Handshake
            setTimeout(() => {
                const myDevice = getDeviceType();
                broadcastData({ type: 'handshake', device: myDevice });
            }, 500);
        };

        const tryAutoReconnect = () => {
            const lastRemote = localStorage.getItem('echo_last_remote_peer');
            if (lastRemote) {
                setStatus('processing'); // Show visual indicator
                setErrorMessage("Reconnecting to last session...");

                // Wait a bit for the other peer to be online
                setTimeout(() => {
                    connectToPeer(lastRemote, (incoming) => {
                        // Handle Handshake
                        if (incoming && incoming.type === 'handshake') {
                            setRemoteDevice(incoming.device);
                            setStatus('success');
                            return;
                        }
                        if (onPeerData) onPeerData(incoming);
                    }, (conn) => {
                        handleConnected(conn);
                    }, () => {
                        setStatus('idle'); // Reset to allow manual retry
                        setErrorMessage("");
                    });
                }, 1000);
            }
        };

        const handleUrlPairing = (currentPeerId) => {
            const urlParams = new URLSearchParams(window.location.search);
            const pairId = urlParams.get('pair') || urlParams.get('syncId');
            if (pairId && pairId !== currentPeerId) {
                setStatus('processing');
                setErrorMessage("Connecting to shared link...");

                // Clean the URL query params
                const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({ path: cleanUrl }, '', cleanUrl);

                setTimeout(() => {
                    connectToPeer(pairId, (incoming) => {
                        if (incoming && incoming.type === 'handshake') {
                            setRemoteDevice(incoming.device);
                            setStatus('success');
                            return;
                        }
                        if (onPeerData) onPeerData(incoming);
                    }, (conn) => {
                        handleConnected(conn);
                    }, () => {
                        setStatus('error');
                        setErrorMessage("Link connection failed. Is the other device online?");
                    });
                }, 1000);
                return true;
            }
            return false;
        };

        const initializePairing = (id) => {
            setPeerId(id);
            const hasPairParam = handleUrlPairing(id);
            if (!hasPairParam) {
                tryAutoReconnect();
            }
        };

        // 1. Persistence: Load or Create My Peer ID
        let savedPid = localStorage.getItem('echo_peer_id');
        if (!savedPid) {
            savedPid = Math.random().toString(36).substr(2, 9);
            localStorage.setItem('echo_peer_id', savedPid);
        }

        const peer = initPeer(savedPid, (data) => {
            // Handle Handshake
            if (data && data.type === 'handshake') {
                setRemoteDevice(data.device);
                setStatus('success');
                return;
            }

            // If we receive ANY data, we are effectively connected
            if (status !== 'success') {
                setStatus('success');
                setRemoteDevice("Remote Peer");
            }

            if (onPeerData) onPeerData(data);
        }, (conn) => {
            // Success Callback
            handleConnected(conn);
            // Persist the remote peer ID
            localStorage.setItem('echo_last_remote_peer', conn.peer);
        });

        // Wait for 'open' event to confirm explicit connection to signaling server
        if (peer.open) {
            initializePairing(peer.id);
        }
        peer.on('open', (id) => {
            initializePairing(id);
        });
        peer.on('error', () => {
            setStatus('error'); // Show error UI to user
        });

        return () => {
            // peer.destroy(); // Keep it alive
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    const handleDisconnect = () => {
        // In a real app we'd close the specific connection.
        // For now, we just reset the UI state to allow re-connection.
        setStatus('idle');
        setRemoteDevice(null);
        if (onConnectionChange) onConnectionChange(false);
    };

    // Removed tryAutoReconnect from here as it's moved inside useEffect

    const [micVolume, setMicVolume] = useState(0);

    // Audio Cleanup
    useEffect(() => {
        let stopListening = null;
        if (isListening) {
            listenAudio({
                onData: (data) => {
                    // Allow processing if peerId is not set yet (we can still receive audio)
                    // but don't connect to ourselves.
                    if (data && (peerId ? data !== peerId : true)) {
                        let attempts = 0;
                        const maxAttempts = 5; // Increased attempts
                        const baseDelay = 1000;

                        const attemptConnection = () => {
                            attempts++;

                            connectToPeer(data, (incoming) => {
                                if (incoming && incoming.type === 'handshake') {
                                    setRemoteDevice(incoming.device);
                                    setStatus('success');
                                    return;
                                }
                                if (onPeerData) onPeerData(incoming);
                            // eslint-disable-next-line no-unused-vars
                            }, (_conn) => {
                                if (onConnectionChange) onConnectionChange(true);
                                setTimeout(() => {
                                    const myDevice = getDeviceType();
                                    broadcastData({ type: 'handshake', device: myDevice });
                                }, 500);
                            }, () => {
                                if (attempts < maxAttempts) {
                                    const delay = baseDelay * attempts;
                                    setTimeout(attemptConnection, delay);
                                } else {
                                    setErrorMessage("Could not connect. Ensure connected device is online.");
                                    setStatus('error');
                                }
                            });
                        };

                        attemptConnection();

                        setIsListening(false);
                        // Pass the "Connection" as the sync event
                        onSync({ syncId: 'P2P-Linked', source: 'sonic' });
                    }
                },
                onVolume: (vol) => {
                    // Smooth volume for UI (multiply for visibility)
                    setMicVolume(vol * 5);
                }
            }).then(stop => stopListening = stop);
        } else {
            setMicVolume(0);
        }
        return () => {
            if (stopListening) stopListening();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isListening, peerId]); // Added suppression if onSync/onPeerData changes

    // Close automatically ONLY if we have a successful sync/connection
    useEffect(() => {
        if (status === 'success' && remoteDevice) {
            const timer = setTimeout(() => onClose(), 3000); // Give user time to see "Connected to iPhone"
            return () => clearTimeout(timer);
        }
    }, [status, remoteDevice, onClose]);

    const toggleBroadcast = async () => {
        if (isBroadcasting) {
            setIsBroadcasting(false);
        } else {
            if (!peerId) {
                setErrorMessage("Connecting to network...");
                setStatus('error');
                return;
            }

            setIsBroadcasting(true);
            setStatus('processing');

            try {
                await ensureConnection();

                await broadcastAudio(peerId);
                setTimeout(() => {
                    setIsBroadcasting(false);
                    setStatus('idle');
                }, 5000);
            } catch {
                setIsBroadcasting(false);
                setStatus('error');
                setErrorMessage("Connection lost. Retrying...");
                try { ensureConnection(); } catch { /* ignore */ }
            }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-6"
                >
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={onClose} />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                        className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl relative z-10"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setActiveTab('cognitive')}
                                    className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all ${activeTab === 'cognitive' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900'}`}
                                >
                                    Link Sync
                                </button>
                                <button
                                    onClick={() => setActiveTab('sonic')}
                                    className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all ${activeTab === 'sonic' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900'}`}
                                >
                                    Sonic Handshake
                                </button>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 min-h-[300px] flex flex-col justify-center">
                            <AnimatePresence mode="wait">
                                {activeTab === 'cognitive' ? (
                                    <motion.div
                                        key="cognitive"
                                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                        className="text-center"
                                    >
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                            <LinkIcon size={32} className="text-slate-900" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Link Sync</h3>

                                        {status === 'success' ? (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex flex-col items-center mt-4"
                                            >
                                                <p className="text-green-500 font-bold mb-2 flex items-center gap-2">
                                                    <Check size={18} />
                                                    Connected to {remoteDevice || 'Peer'}
                                                </p>
                                                <p className="text-slate-400 text-sm mb-4">Synchronizing data...</p>
                                                <button
                                                    onClick={handleDisconnect}
                                                    className="px-6 py-2 bg-slate-100 text-slate-500 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-red-50 hover:text-red-500 transition-colors flex items-center gap-2"
                                                >
                                                     <LogOut size={14} />
                                                     Disconnect
                                                </button>
                                            </motion.div>
                                        ) : status === 'processing' ? (
                                            <div className="flex flex-col items-center mt-4">
                                                <p className="text-slate-500 font-medium animate-pulse">
                                                    {errorMessage || 'Connecting...'}
                                                </p>
                                            </div>
                                        ) : status === 'error' ? (
                                            <div className="flex flex-col items-center mt-4">
                                                <p className="text-red-500 font-medium mb-4">
                                                    {errorMessage || 'Connection failed.'}
                                                </p>
                                                <button
                                                    onClick={() => setStatus('idle')}
                                                    className="px-6 py-2 bg-slate-900 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
                                                >
                                                    Retry
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-slate-400 text-sm mb-8">
                                                    Share this link with your other device to connect and sync your tasks instantly.
                                                </p>

                                                <div 
                                                    onClick={handleCopyLink}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6 text-center select-all cursor-pointer group hover:bg-slate-100/50 transition-colors"
                                                >
                                                    <p className="text-xs font-mono text-slate-500 break-all select-all">
                                                        {shareUrl || 'Generating link...'}
                                                    </p>
                                                </div>

                                                <div className="flex gap-4">
                                                    <button
                                                        onClick={handleCopyLink}
                                                        disabled={!shareUrl}
                                                        className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-bold text-sm tracking-widest uppercase hover:bg-slate-800 transition-all disabled:opacity-50"
                                                    >
                                                        {copied ? 'Copied' : 'Copy Link'}
                                                    </button>
                                                    {navigator.share && (
                                                        <button
                                                            onClick={handleShareLink}
                                                            disabled={!shareUrl}
                                                            className="flex-1 py-4 border border-slate-200 text-slate-700 rounded-xl font-bold text-sm tracking-widest uppercase hover:bg-slate-50 transition-all disabled:opacity-50"
                                                        >
                                                            Share Link
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="mt-8 pt-8 border-t border-slate-100 text-left">
                                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                                        Or Connect to another device's link
                                                    </label>
                                                    <form onSubmit={handleConnectWithLink} className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Paste pairing URL or Peer ID here..."
                                                            value={pasteValue}
                                                            onChange={(e) => setPasteValue(e.target.value)}
                                                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-slate-300 transition-all placeholder:text-slate-400 font-mono text-xs"
                                                        />
                                                        <button
                                                            type="submit"
                                                            disabled={!pasteValue.trim()}
                                                            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Connect
                                                        </button>
                                                    </form>
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="sonic"
                                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                        className="text-center"
                                    >
                                        <div className="relative w-32 h-32 mx-auto mb-8 flex items-center justify-center">
                                            {/* Pulse Effects */}
                                            {(isBroadcasting || isListening) && (
                                                <>
                                                    <motion.div
                                                        animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                                        className={`absolute inset-0 rounded-full ${isBroadcasting ? 'bg-orange-100' : 'bg-blue-100'}`}
                                                    />
                                                    <motion.div
                                                        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                                        transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                                                        className={`absolute inset-0 rounded-full ${isBroadcasting ? 'bg-orange-200' : 'bg-blue-200'}`}
                                                    />
                                                </>
                                            )}

                                            <div className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-colors duration-500 ${isBroadcasting ? 'bg-orange-500' : isListening ? 'bg-blue-500' : 'bg-slate-100'}`}>
                                                {isBroadcasting ? (
                                                    <Wifi size={40} className="text-white" />
                                                ) : (
                                                    <motion.div
                                                        animate={{ scale: 1 + Math.min(micVolume, 0.5) }}
                                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                    >
                                                        <Mic size={40} className={`${isListening ? 'text-white' : 'text-slate-400'}`} />
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Sonic Handshake</h3>
                                        <AnimatePresence mode="wait">
                                            {status === 'success' ? (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="flex flex-col items-center"
                                                >
                                                    <p className="text-green-500 font-bold mb-2 flex items-center gap-2">
                                                        <Check size={18} />
                                                        Connected to {remoteDevice || 'Peer'}
                                                    </p>
                                                    <p className="text-slate-400 text-sm mb-4">Synchronizing data...</p>

                                                    <button
                                                        onClick={handleDisconnect}
                                                        className="px-6 py-2 bg-slate-100 text-slate-500 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-red-50 hover:text-red-500 transition-colors flex items-center gap-2"
                                                    >
                                                        <LogOut size={14} />
                                                        Disconnect
                                                    </button>
                                                </motion.div>
                                            ) : status === 'error' ? (
                                                <motion.p
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="text-red-500 text-sm mb-3 font-medium"
                                                >
                                                    {errorMessage || 'Connection failed. Please retry.'}
                                                </motion.p>
                                            ) : (
                                                <motion.p
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="text-slate-400 text-sm mb-3"
                                                >
                                                    {isBroadcasting ? 'Broadcasting Peer Signal...' : isListening ? 'Listening for Peer Signal...' : 'Broadcast to or listen for a nearby device.'}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>

                                        {peerId ? (
                                            status !== 'success' && <p className="text-[10px] text-slate-300 font-mono mb-8">My ID: {peerId}</p>
                                        ) : (
                                            <p className="text-[10px] text-orange-400 font-mono mb-8 animate-pulse">Connecting to Network...</p>
                                        )}

                                        {status !== 'success' && (
                                            <div className="flex gap-4 max-w-xs mx-auto">
                                                <button
                                                    onClick={toggleBroadcast}
                                                    disabled={isListening || !peerId}
                                                    className={`flex-1 py-3 border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${(isListening || !peerId) ? 'opacity-50 cursor-not-allowed' : ''} ${isBroadcasting ? 'bg-orange-500 text-white border-orange-500' : 'hover:border-slate-900 hover:text-slate-900 text-slate-500'}`}
                                                >
                                                    {isBroadcasting ? 'Stop' : 'Broadcast'}
                                                </button>
                                                <button
                                                    onClick={() => setIsListening(!isListening)}
                                                    disabled={isBroadcasting}
                                                    className={`flex-1 py-3 border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${isListening ? 'bg-blue-500 text-white border-blue-500' : 'hover:border-slate-900 hover:text-slate-900 text-slate-500'}`}
                                                >
                                                    {isListening ? 'Stop' : 'Listen'}
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SyncOverlay;
