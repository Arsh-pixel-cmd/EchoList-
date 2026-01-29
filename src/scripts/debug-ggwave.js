import ggwave from 'ggwave';

// Mock browser env
global.window = {};
global.AudioContext = class { };

console.log("Type of export:", typeof ggwave);
console.log("Is it a class? (prototype checks):", ggwave.prototype);

(async () => {
    try {
        console.log(" attempting factory init...");
        const gw = await ggwave({
            // minimal config
            locateFile: () => 'ggwave.wasm'
        });

        console.log("GW Instance Keys:", Object.keys(gw));

        if (gw.getDefaultParameters) {
            console.log("Default Params:", gw.getDefaultParameters());
        } else {
            console.log("No getDefaultParameters found!");
        }

        if (gw.SampleFormat) {
            console.log("SampleFormat Enum:", gw.SampleFormat);
        }

    } catch (e) {
        console.error("Factory init failed:", e);
    }
})();
