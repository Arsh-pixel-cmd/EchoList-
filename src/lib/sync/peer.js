import { Peer } from 'peerjs';

let peerInstance = null;
let connections = []; // Keep track of multiple connections

// Initialize Peer with our deterministic Sync ID
export const initPeer = (syncId, onData, onConnected) => {
    if (peerInstance) return peerInstance;

    // We use the syncId as the PeerID. 
    // Note: PeerJS ID must be a string. Our syncId is a hex string, which is perfect.
    // In a real production app, we might want to suffix this or use a broker to avoid collisions if the "phrase" is weak.
    // For this "Identity-less" concept, the ID *is* the address.

    peerInstance = new Peer(syncId, {
        debug: 0, // Disable verbose logging
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' }
            ]
        }
    });

    peerInstance.on('open', (id) => {
        // console.log('My Peer ID is: ' + id);
    });

    peerInstance.on('connection', (conn) => {
        setupConnection(conn, onData, onConnected);
    });

    peerInstance.on('error', (err) => {
        // console.error("Peer Error:", err);
    });

    return peerInstance;
};

// Connect to another peer (e.g. found via local discovery or manually if we were to typing IDs)
// In our "Identity-less" model with Sonic Handshake:
// Both devices derive the SAME ID. 
// Wait, if they have the SAME ID, PeerJS won't let them connect! (ID collision).
// CORRECT LOGIC: 
// The "Sync ID" derived from the phrase is the "Cluster ID" or "Room ID".
// Each device needs a UNIQUE PeerID, but they join the same "Cluster".
// Since PeerJS is 1:1, we need a way to find each other.

// REVISED ARCHITECTURE for P2P with Shared Secret:
// 1. Device A derives Secret S.
// 2. Device A connects to PeerJS cloud with ID: "S-DeviceA" (random suffix).
// 3. Device B connects with ID: "S-DeviceB".
// 4. How do they know each other's suffix?
//    Solution: We use the Sonic Handshake to send the FULL PeerID, not just the shared secret!
//    OR: We use a known discovery convention.

// SIMPLIFIED APPROACH for this Demo:
// We will use the "Sonic Handshake" to broadcast the FULL PeerID of the device.
// The "Cognitive Key" will be used to encrypt the data, but the CONNECTION is established via the ID sent over audio.
// If using "Memory Phrase" only (remote):
// We can't easily do serverless P2P without a signaling server that supports room logic.
// -> We will stick to the "Sonic Handshake" being the primary way to connect P2P in this demo.
// -> The "Memory Phrase" will just set the encryption key.

export const connectToPeer = (remotePeerId, onData, onConnected, onError) => {
    if (!peerInstance) return;
    // console.log("Attempting to connect to Peer:", remotePeerId);

    // Connect to peer (let PeerJS negotiate)
    const conn = peerInstance.connect(remotePeerId);

    if (!conn) {
        if (onError) onError(new Error("Failed to initiate connection"));
        return;
    }

    // Handle immediate connection errors
    conn.on('error', (err) => {
        // console.error("Connection Error:", err);
        if (onError) onError(err);
    });

    setupConnection(conn, onData, onConnected);
};



const setupConnection = (conn, onData, onConnected) => {
    conn.on('open', () => {
        // console.log("Connected to: " + conn.peer);
        connections.push(conn);
        if (onConnected) onConnected(conn);
    });

    conn.on('data', (data) => {
        // Data is encrypted? handled by caller.
        onData(data);
    });

    conn.on('close', () => {
        connections = connections.filter(c => c !== conn);
    });
};

export const broadcastData = (data) => {
    connections.forEach(conn => {
        if (conn.open) {
            conn.send(data);
        }
    });
};

export const getMyPeerId = () => peerInstance?.id;

export const checkConnection = () => {
    if (peerInstance && peerInstance.disconnected) {
        // console.log("Peer disconnected from server, reconnecting...");
        peerInstance.reconnect();
    }
};
