
import ggwave from 'ggwave';

global.window = {};

(async () => {
    try {
        const gw = await ggwave({
            locateFile: () => 'ggwave.wasm'
        });

        console.log("GW Loaded");

        // Init dummy instance
        const params = gw.getDefaultParameters();
        params.captureDeviceId = -1;
        params.sampleFormatInp = gw.SampleFormat.GGWAVE_SAMPLE_FORMAT_F32;
        params.sampleFormatOut = gw.SampleFormat.GGWAVE_SAMPLE_FORMAT_F32;
        params.operatingMode = gw.GGWAVE_OPERATING_MODE_RX; // RX

        const id = gw.init(params);
        console.log("Instance initialized with ID:", id);

        // Create dummy F32 buffer
        const f32 = new Float32Array(1024);

        console.log("Attempting decode with Float32Array...");
        try {
            gw.decode(id, f32);
            console.log("Decode F32 Success!");
        } catch (e) {
            console.error("Decode F32 Failed:", e.message);
        }

        // Try Int8Array
        const i8 = new Int8Array(f32.buffer);
        console.log("Attempting decode with Int8Array...");
        try {
            gw.decode(id, i8);
            console.log("Decode Int8 Success!");
        } catch (e) {
            console.error("Decode Int8 Failed:", e.message);
        }

    } catch (e) {
        console.error("Script Error:", e);
    }
})();
