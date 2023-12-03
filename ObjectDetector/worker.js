// importScripts("https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js");
// importScripts("https://cdn.jsdelivr.net/npm/sweetalert2@11");

// onmessage = async(event) => {
//     console.log("Received message from worker");
//     const input = event.data;
//     const output = await run_model(input);
//     postMessage(output);
// }

// async function run_model(input) {
//     const model = await ort.InferenceSession.create("./yolov8m.onnx");
//     input = new ort.Tensor(Float32Array.from(input),[1, 3, 640, 640]);
//     const outputs = await model.run({images:input});
//     return outputs["output0"].data;
// }
importScripts("https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js");
// importScripts("https://cdn.jsdelivr.net/npm/sweetalert2@11");

let model;

// Load the model during worker initialization
(async function initialize() {
    model = await ort.InferenceSession.create("../runs/detect/all2/weights/best.onnx");
})();

onmessage = async(event) => {
    console.log("Received message from worker");
    const input = event.data;
    const output = await run_model(input);
    postMessage(output);
}

async function run_model(input) {
    input = new ort.Tensor(Float32Array.from(input),[1, 3, 640, 640]);
    const outputs = await model.run({images:input});
    return outputs["output0"].data;
}
