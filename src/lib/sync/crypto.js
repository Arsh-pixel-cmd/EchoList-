export const deriveIdentity = async (phrase) => {
    try {
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            enc.encode(phrase),
            { name: "PBKDF2" },
            false,
            ["deriveBits", "deriveKey"]
        );

        // Deterministic salt for "Identity-less" syc (Trade-off: Rainbow table risk vs. UX)
        // In a real app, strict warnings would apply.
        const salt = enc.encode("echo-list-v1-salt");

        const key = await window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 100000,
                hash: "SHA-256",
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );

        // Export key as JWK to use as a portable token if needed, or just keep in memory.
        const exportedKey = await window.crypto.subtle.exportKey("jwk", key);

        // Generate a public "Sync ID" (SHA-256 of the phrase + salt) to share with peers/server
        // This is what we broadcast over audio.
        const idBuffer = await window.crypto.subtle.digest("SHA-256", enc.encode(phrase + "echo-list-unique-id"));
        const idArray = Array.from(new Uint8Array(idBuffer));
        const syncId = idArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 12); // Short 12-char ID

        return {
            key,        // CryptoKey object for data encryption
            exportedKey,// JWK format
            syncId      // Public ID (safe to broadcast)
        };
    } catch (e) {
        console.error("Crypto Error:", e);
        return null;
    }
};

export const encryptData = async (key, data) => {
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        enc.encode(JSON.stringify(data))
    );

    // Combine IV + Data for storage
    const buffer = new Uint8Array(iv.byteLength + encrypted.byteLength);
    buffer.set(iv, 0);
    buffer.set(new Uint8Array(encrypted), iv.byteLength);

    return btoa(String.fromCharCode(...buffer));
};
