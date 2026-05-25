from pathlib import Path
import base64
import json
import re
import uuid
from datetime import datetime, timezone
from io import BytesIO
from collections.abc import Mapping
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import HTMLResponse
from PIL import Image, ExifTags

from utils.predictor import SoybeanPredictor


app = FastAPI(title="Soybean Disease API", version="1.0.0")

model_path = Path(__file__).parent / "model" / "soybean_uav_modellll.onnx"
predictor = SoybeanPredictor(model_path=model_path)
payload_dir = Path(__file__).parent / "offline_sync" / "generated_payloads"
payload_dir.mkdir(parents=True, exist_ok=True)


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _normalize_label(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())


def _is_abnormal(disease: str) -> bool:
    healthy_aliases = {
        _normalize_label("soyabean_healthy"),
        _normalize_label("healthy_soyabean"),
    }
    return _normalize_label(disease) not in healthy_aliases


def _write_abnormal_payload(*, image_bytes: bytes, latitude: float, longitude: float, result: dict) -> Path:
    capture_id = str(uuid.uuid4())
    payload = {
        "schema_version": "1.0",
        "type": "leaf_capture",
        "payload": {
            "capture_id": capture_id,
            "latitude": latitude,
            "longitude": longitude,
            "timestamp_utc": _utc_now_iso(),
            "leaf_image_b64": base64.b64encode(image_bytes).decode("ascii"),
            "model_result": {
                "disease": result.get("disease"),
                "confidence": result.get("confidence"),
            },
            "status": "abnormal",
        },
    }

    file_path = payload_dir / f"abnormal_{capture_id}.json"
    file_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return file_path


def _as_float_ratio(value: Any) -> float:
    if isinstance(value, (int, float)):
        return float(value)

    numerator = getattr(value, "numerator", None)
    denominator = getattr(value, "denominator", None)
    if numerator is not None and denominator:
        return float(numerator) / float(denominator)

    if isinstance(value, tuple) and len(value) == 2 and value[1] != 0:
        return float(value[0]) / float(value[1])

    raise ValueError(f"Unsupported EXIF ratio value: {value}")


def _dms_to_decimal(dms: Any, ref: str) -> float:
    if not isinstance(dms, (tuple, list)) or len(dms) != 3:
        raise ValueError("GPS DMS value must have 3 parts")

    degrees = _as_float_ratio(dms[0])
    minutes = _as_float_ratio(dms[1])
    seconds = _as_float_ratio(dms[2])
    decimal = degrees + (minutes / 60.0) + (seconds / 3600.0)

    if ref.upper() in {"S", "W"}:
        decimal = -decimal
    return decimal


def _normalize_gps_ref(value: Any) -> str:
    if isinstance(value, bytes):
        return value.decode("ascii", errors="ignore").strip().upper()
    return str(value).strip().upper()


def _extract_coords_from_image(image: Image.Image) -> tuple[float, float] | None:
    exif = image.getexif()
    if not exif:
        return None

    gps_ifd_key = getattr(ExifTags, "IFD", None)
    gps_ifd = None

    # Pillow stores GPS data in a dedicated IFD. Prefer reading it directly.
    if gps_ifd_key is not None and hasattr(exif, "get_ifd"):
        try:
            gps_ifd = exif.get_ifd(gps_ifd_key.GPSInfo)
        except Exception:
            gps_ifd = None

    if gps_ifd is None:
        gps_tag = next((tag for tag, name in ExifTags.TAGS.items() if name == "GPSInfo"), None)
        if gps_tag is None:
            return None
        gps_ifd = exif.get(gps_tag)

    if not isinstance(gps_ifd, Mapping):
        return None

    gps_named: dict[str, Any] = {
        ExifTags.GPSTAGS.get(key, str(key)): value for key, value in gps_ifd.items()
    }

    lat_dms = gps_named.get("GPSLatitude")
    lat_ref = gps_named.get("GPSLatitudeRef")
    lon_dms = gps_named.get("GPSLongitude")
    lon_ref = gps_named.get("GPSLongitudeRef")
    if not lat_dms or not lat_ref or not lon_dms or not lon_ref:
        return None

    latitude = _dms_to_decimal(lat_dms, _normalize_gps_ref(lat_ref))
    longitude = _dms_to_decimal(lon_dms, _normalize_gps_ref(lon_ref))
    return (latitude, longitude)


def _extract_coords_from_bytes(image_bytes: bytes) -> tuple[float, float] | None:
    try:
        with Image.open(BytesIO(image_bytes)) as raw_image:
            return _extract_coords_from_image(raw_image)
    except Exception:
        return None


def _process_single_upload(*, image_bytes: bytes, latitude: float, longitude: float) -> dict[str, Any]:
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    result = predictor.predict(image)

    disease = str(result.get("disease", "unknown"))
    abnormal = _is_abnormal(disease)

    payload_file = None
    if abnormal:
        payload_file = _write_abnormal_payload(
            image_bytes=image_bytes,
            latitude=latitude,
            longitude=longitude,
            result=result,
        )

    return {
        "status": "abnormal" if abnormal else "healthy",
        "prediction": result,
        "coordinates": {"latitude": latitude, "longitude": longitude},
        "payload_created": abnormal,
        "payload_file": str(payload_file) if payload_file else None,
    }


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/", response_class=HTMLResponse)
def index() -> str:
    return """
<!DOCTYPE html>
<html lang=\"en\">
<head>
    <meta charset=\"UTF-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
    <title>Soybean Drone Upload</title>
    <style>
        body { font-family: Tahoma, sans-serif; margin: 24px; background: #f4f7f2; color: #1f2a1f; }
        .card { max-width: 640px; background: #ffffff; border: 1px solid #d8e3d1; border-radius: 10px; padding: 18px; }
        h1 { margin-top: 0; color: #245a34; }
        label { display: block; margin-top: 10px; font-weight: 600; }
        input, button { width: 100%; margin-top: 6px; padding: 10px; box-sizing: border-box; }
        button { margin-top: 14px; background: #2f7d32; color: #fff; border: 0; cursor: pointer; border-radius: 6px; }
        pre { margin-top: 14px; padding: 10px; background: #0f1720; color: #d9f3de; border-radius: 6px; overflow: auto; }
    </style>
</head>
<body>
    <div class=\"card\">
        <h1>Drone Image Upload</h1>
        <form id=\"uploadForm\">
            <label>Leaf Image</label>
            <input type=\"file\" name=\"file\" accept=\"image/*\" required />

            <label>Latitude (optional if EXIF GPS exists)</label>
            <input type=\"number\" name=\"latitude\" step=\"any\" />

            <label>Longitude (optional if EXIF GPS exists)</label>
            <input type=\"number\" name=\"longitude\" step=\"any\" />

            <button type=\"submit\">Analyze and Create Payload</button>
        </form>
        <pre id=\"result\">Waiting for upload...</pre>

        <hr style=\"margin: 20px 0; border: 0; border-top: 1px solid #d8e3d1;\" />

        <h1 style=\"font-size: 20px;\">Batch Field Upload</h1>
        <form id=\"batchForm\">
            <label>Field Images (multiple)</label>
            <input type=\"file\" name=\"files\" accept=\"image/*\" multiple required />

            <label>Default Latitude (used if per-file coords missing)</label>
            <input type=\"number\" name=\"latitude\" step=\"any\" />

            <label>Default Longitude (used if per-file coords missing)</label>
            <input type=\"number\" name=\"longitude\" step=\"any\" />

            <label>Optional Coordinates JSON by filename</label>
            <textarea name=\"coordinates_json\" rows=\"5\" style=\"width:100%; margin-top:6px;\" placeholder='{"img1.jpg":{"latitude":11.22,"longitude":77.49}}'></textarea>

            <button type=\"submit\">Process Batch and Create Payloads</button>
        </form>
        <pre id=\"batchResult\">Batch idle...</pre>
    </div>

    <script>
        const form = document.getElementById('uploadForm');
        const result = document.getElementById('result');
        const batchForm = document.getElementById('batchForm');
        const batchResult = document.getElementById('batchResult');

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            result.textContent = 'Processing...';
            const formData = new FormData(form);

            try {
                const response = await fetch('/upload-drone', { method: 'POST', body: formData });
                const body = await response.json();
                result.textContent = JSON.stringify(body, null, 2);
            } catch (err) {
                result.textContent = 'Request failed: ' + err;
            }
        });

        batchForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            batchResult.textContent = 'Batch processing...';
            const formData = new FormData(batchForm);

            try {
                const response = await fetch('/upload-drone-batch', { method: 'POST', body: formData });
                const body = await response.json();
                batchResult.textContent = JSON.stringify(body, null, 2);
            } catch (err) {
                batchResult.textContent = 'Batch request failed: ' + err;
            }
        });
    </script>
</body>
</html>
        """


@app.post("/predict")
async def predict(file: UploadFile = File(...)) -> dict:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    try:
        image = Image.open(file.file).convert("RGB")
        result = predictor.predict(image)
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc


@app.post("/upload-drone")
async def upload_drone(
    file: UploadFile = File(...),
    latitude: float | None = Form(None),
    longitude: float | None = Form(None),
) -> dict:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    try:
        image_bytes = await file.read()

        final_lat = latitude
        final_lon = longitude
        if final_lat is None or final_lon is None:
            extracted = _extract_coords_from_bytes(image_bytes)
            if extracted is not None:
                final_lat, final_lon = extracted

        if final_lat is None or final_lon is None:
            raise HTTPException(
                status_code=400,
                detail="Latitude/longitude not provided and no EXIF GPS metadata found in image.",
            )

        if final_lat < -90 or final_lat > 90:
            raise HTTPException(status_code=400, detail="Latitude must be between -90 and 90")
        if final_lon < -180 or final_lon > 180:
            raise HTTPException(status_code=400, detail="Longitude must be between -180 and 180")

        return _process_single_upload(
            image_bytes=image_bytes,
            latitude=final_lat,
            longitude=final_lon,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Upload processing failed: {exc}") from exc


@app.post("/upload-drone-batch")
async def upload_drone_batch(
    files: list[UploadFile] = File(...),
    latitude: float | None = Form(None),
    longitude: float | None = Form(None),
    coordinates_json: str | None = Form(None),
) -> dict:
    if not files:
        raise HTTPException(status_code=400, detail="At least one image file is required.")

    if latitude is not None and (latitude < -90 or latitude > 90):
        raise HTTPException(status_code=400, detail="Latitude must be between -90 and 90")
    if longitude is not None and (longitude < -180 or longitude > 180):
        raise HTTPException(status_code=400, detail="Longitude must be between -180 and 180")

    coords_map: dict[str, dict[str, float]] = {}
    if coordinates_json:
        try:
            parsed = json.loads(coordinates_json)
            if isinstance(parsed, dict):
                coords_map = parsed
            else:
                raise ValueError("coordinates_json must be a JSON object")
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Invalid coordinates_json: {exc}") from exc

    results: list[dict[str, Any]] = []
    abnormal_count = 0
    payload_files: list[str] = []

    for upload in files:
        if not upload.content_type or not upload.content_type.startswith("image/"):
            results.append(
                {
                    "file": upload.filename,
                    "status": "skipped",
                    "reason": "Not an image file",
                }
            )
            continue

        file_coords = coords_map.get(upload.filename or "")
        final_lat = latitude if latitude is not None else None
        final_lon = longitude if longitude is not None else None

        if isinstance(file_coords, dict):
            final_lat = file_coords.get("latitude", final_lat)
            final_lon = file_coords.get("longitude", final_lon)

        image_bytes = await upload.read()

        if final_lat is None or final_lon is None:
            if image_bytes:
                extracted = _extract_coords_from_bytes(image_bytes)
                if extracted is not None:
                    final_lat, final_lon = extracted

        if final_lat is None or final_lon is None:
            results.append(
                {
                    "file": upload.filename,
                    "status": "skipped",
                    "reason": "Missing coordinates for file and no EXIF GPS metadata found",
                }
            )
            continue

        try:
            file_result = _process_single_upload(
                image_bytes=image_bytes,
                latitude=float(final_lat),
                longitude=float(final_lon),
            )
            results.append({"file": upload.filename, **file_result})

            if file_result["status"] == "abnormal":
                abnormal_count += 1
            if file_result["payload_file"]:
                payload_files.append(file_result["payload_file"])
        except Exception as exc:
            results.append(
                {
                    "file": upload.filename,
                    "status": "error",
                    "reason": str(exc),
                }
            )

    return {
        "total_files": len(files),
        "processed_files": len(results),
        "abnormal_count": abnormal_count,
        "payload_files_created": len(payload_files),
        "payload_files": payload_files,
        "results": results,
    }
