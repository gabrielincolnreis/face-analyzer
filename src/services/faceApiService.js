import * as faceapi from '@vladmandic/face-api';

let modelsLoaded = false;

export async function loadFaceApiModels(onProgress) {
  const MODEL_URL = '/models';

  const steps = [
    { name: 'TinyFaceDetector', load: () => faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL) },
    { name: 'FaceLandmark68', load: () => faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL) },
    { name: 'FaceRecognition', load: () => faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL) },
    { name: 'FaceExpression', load: () => faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL) },
    { name: 'AgeGender', load: () => faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL) },
  ];

  for (let i = 0; i < steps.length; i++) {
    onProgress?.({ step: steps[i].name, current: i, total: steps.length });
    await steps[i].load();
  }

  modelsLoaded = true;
  onProgress?.({ step: 'Done', current: steps.length, total: steps.length });
}

export function isLoaded() {
  return modelsLoaded;
}

export async function detectFaces(input) {
  if (!modelsLoaded) throw new Error('Face API models not loaded');

  const detections = await faceapi
    .detectAllFaces(input, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceExpressions()
    .withAgeAndGender();

  return detections.map((d) => ({
    detection: d.detection,
    landmarks: d.landmarks,
    age: Math.round(d.age),
    gender: d.gender,
    genderProbability: d.genderProbability,
    expressions: d.expressions,
    dominantExpression: getDominantExpression(d.expressions),
    box: d.detection.box,
  }));
}

function getDominantExpression(expressions) {
  return Object.entries(expressions).reduce((best, [key, val]) =>
    val > best.value ? { label: key, value: val } : best,
    { label: 'neutral', value: 0 }
  );
}

export async function extractFaceCrop(videoOrCanvas, box) {
  const canvas = document.createElement('canvas');
  const padding = 40;
  const x = Math.max(0, box.x - padding);
  const y = Math.max(0, box.y - padding);
  const w = Math.min(box.width + padding * 2, (videoOrCanvas.videoWidth || videoOrCanvas.width) - x);
  const h = Math.min(box.height + padding * 2, (videoOrCanvas.videoHeight || videoOrCanvas.height) - y);

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoOrCanvas, x, y, w, h, 0, 0, w, h);

  return canvas;
}

export { faceapi };
