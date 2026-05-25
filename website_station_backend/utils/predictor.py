from pathlib import Path
from typing import Any

import numpy as np
import onnxruntime as ort
from PIL import Image


class SoybeanPredictor:
    def __init__(self, model_path: Path):
        self.model_path = Path(model_path)
        self.class_names = [
            "Healthy_Soyabean",
            "Soyabean Semilooper and Caterpillar_Pest_Attack",
            "Soyabean_Mosaic",
            "Soyabean_Rust",
        ]
        self._session: ort.InferenceSession | None = None

    def _preprocess(self, image: Image.Image) -> np.ndarray:
        resized = image.resize((224, 224))
        array = np.asarray(resized, dtype=np.float32) / 255.0

        mean = np.asarray([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.asarray([0.229, 0.224, 0.225], dtype=np.float32)
        normalized = (array - mean) / std

        chw = np.transpose(normalized, (2, 0, 1))
        return np.expand_dims(chw, axis=0)

    def _get_session(self) -> ort.InferenceSession:
        if self._session is not None:
            return self._session

        if not self.model_path.exists():
            raise RuntimeError(f"Model file not found: {self.model_path}")

        try:
            self._session = ort.InferenceSession(str(self.model_path), providers=["CPUExecutionProvider"])
            return self._session
        except Exception as exc:
            external_data_path = self.model_path.with_suffix(self.model_path.suffix + ".data")
            message = str(exc)
            if ".onnx.data" in message and not external_data_path.exists():
                raise RuntimeError(
                    f"Missing external model weights file: {external_data_path}. "
                    "Place it next to the ONNX model."
                ) from exc
            raise RuntimeError(f"Unable to initialize ONNX session: {exc}") from exc

    def predict(self, image: Image.Image) -> dict[str, Any]:
        session = self._get_session()

        input_name = session.get_inputs()[0].name
        outputs = session.run(None, {input_name: self._preprocess(image)})

        

        logits = outputs[0][0]

        # apply softmax
        exp_logits = np.exp(logits - np.max(logits))
        probs = exp_logits / exp_logits.sum()

        pred_index = int(np.argmax(probs))
        confidence = float(probs[pred_index])

        disease = self.class_names[pred_index] if pred_index < len(self.class_names) else str(pred_index)
        return {"disease": disease, "confidence": confidence}