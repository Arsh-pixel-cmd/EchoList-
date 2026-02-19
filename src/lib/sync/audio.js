import ggwave from 'ggwave';

let ggwaveInstance = null;
let audioContext = null;
let stream = null;

const initGGWave = async () => {
    if (ggwaveInstance) return ggwaveInstance;

    try {
        ggwaveInstance = await ggwave({
            locateFile: (path) => {
                if (path.endsWith('.wasm')) {
                    return `https://cdn.jsdelivr.net/npm/ggwave@0.0.3/ggwave.wasm`;
                }
                return path;
            }
        });
        return ggwaveInstance;
    } catch (e) {
        console.error("GGWave Init Error:", e);
        return null;
    }
};

const cleanup = () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    // We don't close AudioContext to avoid re-creation lag, but we could if needed.
};

export const broadcastAudio = async (text) => {
    // 1. Ensure clean instance if previously aborted
    try {
        if (ggwaveInstance && ggwaveInstance.HEAP8 && ggwaveInstance.HEAP8.buffer.byteLength === 0) {
            console.warn("GGWave Instance seemed detached/aborted. Re-initializing.");
            ggwaveInstance = null;
        }
    } catch (e) { ggwaveInstance = null; }

    const gw = await initGGWave();
    if (!gw) return;

    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 48000 });
    if (audioContext.state === 'suspended') await audioContext.resume();

    const protocolId = 1; // Audible
    const payload = text;
    const sampleRate = audioContext.sampleRate;

    // Use default parameters
    const params = gw.getDefaultParameters();

    // Assign Scalar values
    params.sampleRateInp = sampleRate;
    params.sampleRateOut = sampleRate;
    params.sampleRate = sampleRate;
    params.payloadLength = 64;
    params.samplesPerFrame = 1024;
    params.soundId = -1;
    params.soundMarkerThreshold = 0;

    // CRITICAL: Disable internal Audio Capture (cause of format: 0 errors)
    // The library tries to open default capture device if this is not -1
    params.captureDeviceId = -1;

    // Assign ENUM OBJECTS
    params.sampleFormatInp = gw.SampleFormat.GGWAVE_SAMPLE_FORMAT_F32;
    params.sampleFormatOut = gw.SampleFormat.GGWAVE_SAMPLE_FORMAT_F32;
    params.operatingMode = gw.GGWAVE_OPERATING_MODE_TX;

    console.log("Initialize Broadcast (TX) with Enums & NoCapture:", params);

    try {
        const instanceId = gw.init(params);
        if (instanceId < 0) throw new Error("GGWave init failed (code " + instanceId + ")");

        // Enable Protocol 1 (Audible)
        // Note: txToggleProtocol(instanceId, protocolId)
        if (gw.txToggleProtocol) {
            gw.txToggleProtocol(instanceId, protocolId);
        }

        const waveform = gw.encode(instanceId, payload, protocolId, 10);

        if (!waveform) {
            console.error("GGWave Encode Failed");
            return;
        }

        let floatSamples;
        if (waveform instanceof Float32Array) {
            floatSamples = waveform;
        } else {
            floatSamples = new Float32Array(waveform.buffer, waveform.byteOffset, waveform.length / 4);
        }

        const buffer = audioContext.createBuffer(1, floatSamples.length, sampleRate);
        buffer.getChannelData(0).set(floatSamples);

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();

        return source;

    } catch (e) {
        console.error("GGWave Broadcast Error:", e);
        // Force full reset
        ggwaveInstance = null;
        throw new Error("Broadcast failed: " + e.message);
    }
};

export const listenAudio = async (onMessage) => {
    // Check instance health
    try {
        if (ggwaveInstance && ggwaveInstance.HEAP8.buffer.byteLength === 0) ggwaveInstance = null;
    } catch { ggwaveInstance = null; }

    const gw = await initGGWave();
    if (!gw) return;

    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') await audioContext.resume();

    try {
        stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                autoGainControl: false,
                noiseSuppression: false
            }
        });
    } catch (e) {
        console.error("Mic Access Denied", e);
        return;
    }

    const source = audioContext.createMediaStreamSource(stream);
    // Use deprecated ScriptProcessor for broad compatibility, or consider AudioWorklet if feasible.
    // For now, staying with ScriptProcessor as it's easiest for single-file WASM drop-in.
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    source.connect(processor);
    processor.connect(audioContext.destination);

    let captureId = -1;

    try {
        // Init RX
        const params = gw.getDefaultParameters();

        params.sampleRateInp = audioContext.sampleRate;
        params.sampleRateOut = audioContext.sampleRate;
        params.sampleRate = audioContext.sampleRate;
        params.payloadLength = 64;
        params.samplesPerFrame = 1024;

        // Pass Enum Objects
        params.sampleFormatInp = gw.SampleFormat.GGWAVE_SAMPLE_FORMAT_F32;
        params.sampleFormatOut = gw.SampleFormat.GGWAVE_SAMPLE_FORMAT_F32;
        params.operatingMode = gw.GGWAVE_OPERATING_MODE_RX; // Enum Object

        // CRITICAL: Disable internal Audio Capture for RX too
        params.captureDeviceId = -1;

        console.log("Initialize Listen (RX) with Enums:", params);

        captureId = gw.init(params);
        if (captureId < 0) throw new Error("GGWave RX init failed");

        // Processing Loop
        processor.onaudioprocess = (e) => {
            if (!gw || captureId < 0) return;

            // 6. Pass Float32 directly
            const inputData = e.inputBuffer.getChannelData(0);

            // Calculate Volume (RMS) for UI visualization
            if (onMessage && onMessage.onVolume) {
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) {
                    sum += inputData[i] * inputData[i];
                }
                const rms = Math.sqrt(sum / inputData.length);
                onMessage.onVolume(rms);
            }

            // GGWave JS bindings usually accept TypedlyArrays and copy them to heap
            // Try explicit decode
            try {
                // Fix: BindingError "Cannot pass non-string to std::string"
                // The binding expects a byte-view (Int8Array) of the data
                const byteView = new Int8Array(inputData.buffer, inputData.byteOffset, inputData.byteLength);
                const res = gw.decode(captureId, byteView);

                if (res && res.length > 0) {
                    // Decode the Int8Array/Uint8Array to a string
                    const text = new TextDecoder("utf-8").decode(res);
                    // Fix: Null Termination issues. C++ strings often have trailing \0
                    const cleanText = text.replace(/\0/g, '').trim();

                    if (cleanText) {
                        console.log(`GGWave Decoded: "${cleanText}" (Original len: ${text.length})`);
                        // Handle the message callback
                        if (typeof onMessage === 'function') {
                            onMessage(cleanText);
                        } else if (onMessage && onMessage.onData) {
                            onMessage.onData(cleanText);
                        }
                    }
                }
            } catch (err) {
                console.error("Decode Loop Error:", err);
            }
        };

        return () => {
            cleanup();
            processor.disconnect();
            source.disconnect();
            // gw.free(captureId);
        };

    } catch (e) {
        console.error("RX Init Error:", e);
        ggwaveInstance = null;
        return;
    }
};
