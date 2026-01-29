import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic,
    Wifi,
    BrainCircuit,
    X,
    Check,
    LogOut
} from 'lucide-react';
import { deriveIdentity } from '../lib/sync/crypto';
import { broadcastAudio, listenAudio } from '../lib/sync/audio';
import { broadcastData, initPeer, connectToPeer, getMyPeerId } from '../lib/sync/peer';

const SyncOverlay = ({ isOpen, onClose, onSync, onConnectionChange, onPeerData }) => {
    const [activeTab, setActiveTab] = useState('cognitive'); // 'cognitive' | 'sonic'
    const [phrase, setPhrase] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, processing, success, error
    const [identity, setIdentity] = useState(null);
    const [peerId, setPeerId] = useState(null);
    const [remoteDevice, setRemoteDevice] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    // Detect Device Type
    const getDeviceType = () => {
        const ua = navigator.userAgent;
        if (/android/i.test(ua)) return "Android Phone";
        if (/ipad|iphone|ipod/i.test(ua)) return "iPhone";
        return "Computer";
    };

    const handleConnected = (conn) => {
        console.log("Connection Established via:", conn.peer);
        if (onConnectionChange) onConnectionChange(true);
        // Send Handshake
        setTimeout(() => {
            const myDevice = getDeviceType();
            broadcastData({ type: 'handshake', device: myDevice });
        }, 500);
    };

    const handleDisconnect = () => {
        // In a real app we'd close the specific connection.
        // For now, we just reset the UI state to allow re-connection.
        setStatus('idle');
        setRemoteDevice(null);
        if (onConnectionChange) onConnectionChange(false);
    };

    // Initialize PeerJS on mount (or when overlay opens)
    useEffect(() => {
        const pid = Math.random().toString(36).substr(2, 9);
        const peer = initPeer(pid, (data) => {
            console.log("Received Data:", data);

            // Handle Handshake
            if (data && data.type === 'handshake') {
                setRemoteDevice(data.device);
                setStatus('success');
                return;
            }

            // Verify encryption here if we were being strict.
            if (onPeerData) onPeerData(data);
        }, handleConnected); // Pass onConnected callback

        // Wait for 'open' event to confirm explicit connection to signaling server
        if (peer.open) {
            setPeerId(peer.id);
        }
        peer.on('open', (id) => {
            console.log("PeerJS Connected to Server:", id);
            setPeerId(id);
        });
        peer.on('error', (err) => {
            console.error("PeerJS Error (Global):", err);
            // If we lose connection to server, maybe show error?
        });

        return () => {
            // peer.destroy(); // Keep it alive
        };
    }, []);

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
                        // Data received via Audio = Remote Peer ID
                        console.log("Heard Peer ID:", data);

                        connectToPeer(data, (incoming) => {
                            // Handle Handshake for Initiator
                            if (incoming && incoming.type === 'handshake') {
                                setRemoteDevice(incoming.device);
                                setStatus('success');
                                return;
                            }
                            if (onPeerData) onPeerData(incoming);
                        }, handleConnected, (err) => {
                            console.error("Failed to connect to peer:", err);
                            setErrorMessage("Could not connect. Ensure both devices are online.");
                            setStatus('error');
                        });

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
    }, [isListening, peerId]);

    // Close automatically ONLY if we have a successful sync/connection
    useEffect(() => {
        if (status === 'success' && remoteDevice) {
            const timer = setTimeout(() => onClose(), 3000); // Give user time to see "Connected to iPhone"
            return () => clearTimeout(timer);
        }
    }, [status, remoteDevice, onClose]);

    const handlePhraseSubmit = async (e) => {
        e.preventDefault();
        setStatus('processing');
        const id = await deriveIdentity(phrase);
        if (id) {
            setIdentity(id);
            setStatus('success');
            onSync({ ...id, source: 'cognitive' });
            setTimeout(() => onClose(), 2000);
        } else {
            setStatus('error');
        }
    };

    const toggleBroadcast = async () => {
        if (isBroadcasting) {
            setIsBroadcasting(false);
        } else {
            // Check if we are ready to broadcast
            if (!peerId) {
                console.warn("PeerID not ready yet.");
                setErrorMessage("Connecting to network...");
                setStatus('error');
                return;
            }

            setIsBroadcasting(true);
            setStatus('processing');

            try {
                await broadcastAudio(peerId);
                setTimeout(() => {
                    setIsBroadcasting(false);
                    setStatus('idle');
                }, 5000);
            } catch (e) {
                console.error("Broadcast UI Error:", e);
                setIsBroadcasting(false);
                setStatus('error');
                // alert(e.message); // Removed as requested
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
                                    Memory Key
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
                                            <BrainCircuit size={32} className="text-slate-900" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Cognitive Link</h3>
                                        <p className="text-slate-400 text-sm mb-8">
                                            Enter a personal phrase. We'll derive a cryptographic identity from it. No servers, no passwords.
                                        </p>

                                        <form onSubmit={handlePhraseSubmit}>
                                            <input
                                                type="text"
                                                placeholder="e.g. Rainy window seat"
                                                value={phrase}
                                                onChange={(e) => setPhrase(e.target.value)}
                                                className="w-full text-center text-xl font-medium border-b-2 border-slate-100 pb-2 mb-8 focus:outline-none focus:border-slate-900 transition-colors placeholder:text-slate-200"
                                                autoFocus
                                            />
                                            <button
                                                disabled={!phrase}
                                                type="submit"
                                                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm tracking-widest uppercase hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {status === 'processing' ? 'Deriving...' : status === 'success' ? 'Linked' : 'Generate Identity'}
                                            </button>
                                        </form>
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
