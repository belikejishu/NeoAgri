import { useState, useCallback } from 'react';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useFrameProcessor } from 'react-native-vision-camera';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { Worklets, useSharedValue } from 'react-native-worklets-core';
import * as Speech from 'expo-speech';

// Require the model and labels directly
// According to Expo asset configuration, the metro.config.js will resolve .tflite files
const appModel = require('../models/neoagri_app_model.tflite');
const diseaseLabels = require('../models/disease_labels.json');

export function useDiseaseScan() {
  const [lastScanResult, setLastScanResult] = useState(null);

  // Load the model using fast-tflite
  const model = useTensorflowModel(appModel);
  const { resize } = useResizePlugin();

  // A shared value to debounce voice alerts in Worklet
  const lastAlertTime = useSharedValue(0);

  // Helper inside JS (non-worklet) to set state and announce
  const processResult = useCallback((bestIndex, confidence, rawPredictions) => {
    if (bestIndex === undefined || bestIndex === null) return;

    // Log the raw predictions for debugging
    console.log("Raw Predictions:", rawPredictions, "Best Index:", bestIndex, "Confidence:", confidence);

    const diseaseInfo = diseaseLabels[bestIndex];
    if (diseaseInfo) {
      setLastScanResult({ ...diseaseInfo, confidence, rawPredictions });

      // Optional: voice alert in Hindi using expo-speech
      if (diseaseInfo.disease !== 'Healthy' && diseaseInfo.disease) {
        Speech.speak(`चेतावनी! ${diseaseInfo.disease} मिला है।`, { language: 'hi-IN' });
      } else {
        Speech.speak('पौधा स्वस्थ है।', { language: 'hi-IN' });
      }
    }
  }, []);

  // Worklet to call back to JS safely
  const reportScanResult = Worklets.createRunOnJS(processResult);

  // For Live Mode: Vision Camera Frame Processor
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    // Ensure model is loaded
    if (model.state !== 'loaded' || model.model == null) return;

    // Resize the frame to match the model input size (usually 224x224 for ResNet/MobileNet)
    // You may need to replace 224 with your exact model input dimensions
    const tensor = resize(frame, {
      scale: { width: 224, height: 224 },
      pixelFormat: 'rgb', // you might want 'bgr' if the model was trained with OpenCV defaults
      dataType: 'float32',
    });

    // Run synchronous inference on the device
    const outputs = model.model.runSync([tensor]);
    if (!outputs || outputs.length === 0) return;

    // The output is typically a flat array of probabilities [class0, class1, class2, class3]
    const predictions = outputs[0];
    if (!predictions) return;

    let bestIndex = 0;
    let maxConfidence = predictions[0];

    for (let i = 1; i < predictions.length; i++) {
        if (predictions[i] > maxConfidence) {
            maxConfidence = predictions[i];
            bestIndex = i;
        }
    }

    // Determine if we should report (e.g. throttle to 1 alert every 3 seconds)
    const now = Date.now();
    // For float32 models, output is usually 0.0 - 1.0. If somehow it's > 1, normalize it.
    const confidence = maxConfidence > 1 ? maxConfidence / 255 : maxConfidence;

    // Lowered threshold to 0.40 just to ensure UI triggers even on medium confidence
    if (confidence > 0.40 && (now - lastAlertTime.value > 3000)) {
        lastAlertTime.value = now;
        reportScanResult(bestIndex, confidence, [predictions[0], predictions[1], predictions[2], predictions[3]]);
    }
  }, [model.state, model.model, lastAlertTime, reportScanResult]);

  // For Manual Scan Mode (Single Image URI)
  const scanImage = useCallback(async (uri) => {
    // Note: react-native-fast-tflite is highly optimized for frame processors.
    // To run it on a single image URI, we'd typically load the bytes.
    // For now, if the model is loaded, we can process a byte array if available.
    // In a real app this depends on an image-to-buffer loader.
    if (model.state !== 'loaded') {
      return null;
    }

    // As a placeholder for actual single-image byte extraction:
    // 1. Load image bytes (e.g., via rn-fetch-blob or expo-file-system)
    // 2. Resize bytes to 224x224 RGB
    // 3. const output = await model.model.run([imageBytes])
    // 4. Return result
    console.warn("scanImage(uri) requires image-to-tensor conversion which is native. In Expo, usually we'd pass it back to a hidden VisionCamera or convert to Base64/Bytes.");

    // Mock response for structure matching
    return lastScanResult;
  }, [model.state, lastScanResult]);

  return {
    modelLoaded: model.state === 'loaded',
    lastScanResult,
    frameProcessor,
    scanImage,
  };
}
