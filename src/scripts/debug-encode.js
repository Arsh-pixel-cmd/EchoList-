import ggwave from 'ggwave';

global.window = {};

(async () => {
    try {
        const gw = await ggwave({
            locateFile: () => 'ggwave.wasm'
        });

        const params = gw.getDefaultParameters();
        params.captureDeviceId = -1;
        params.sampleFormatInp = gw.SampleFormat.GGWAVE_SAMPLE_FORMAT_F32;
        params.sampleFormatOut = gw.SampleFormat.GGWAVE_SAMPLE_FORMAT_F32;
        params.operatingMode = gw.GGWAVE_OPERATING_MODE_TX;

        const id = gw.init(params);
        console.log("Instance ID:", id);

        // 1. Try Encoding String
        console.log("Testing gw.encode(string)...");
        const wave1 = gw.encode(id, "TestString", 1, 10);
        console.log("Waveform1 Length:", wave1 ? wave1.length : 'null');

        // 2. Try Encoding Array
        console.log("Testing gw.encode(Int8Array)...");
        const encoder = new TextEncoder();
        const bytes = encoder.encode("TestString");
        // Warning: TextEncoder returns Uint8Array, gw might want Int8Array
        const int8 = new Int8Array(bytes);

        const wave2 = gw.encode(id, int8, 1, 10);
        console.log("Waveform2 Length:", wave2 ? wave2.length : 'null');

    } catch (e) {
        console.error("Script Error:", e);
    }
})();
