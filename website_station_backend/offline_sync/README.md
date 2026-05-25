# Offline Sync: Mock Drone -> Android (No Internet)

This folder contains the simulator side of the offline handoff.

## 1) Payload Schema

`payload_schema.json` (JSON Schema) and `payload.proto` (Protobuf) both define the same fields:

- `latitude` (double)
- `longitude` (double)
- `timestamp_utc` (ISO-8601 UTC string)
- `leaf_image_b64` (base64-encoded cropped JPEG image)

The transport message is an envelope:

```json
{
  "schema_version": "1.0",
  "type": "leaf_capture",
  "payload": {
    "capture_id": "uuid",
    "latitude": 11.2305,
    "longitude": 77.4900,
    "timestamp_utc": "2026-03-17T10:32:40.571Z",
    "leaf_image_b64": "..."
  }
}
```

## 2) Python Mock Drone Simulator

Script: `mock_drone.py`

What it does:
- Loads a source image.
- Randomly crops a leaf region each send.
- Encodes crop to JPEG Base64.
- Builds payload envelope.
- Sends payload over Bluetooth RFCOMM to Android.
- Waits for and prints ack.

### Install deps

```bash
pip install pillow pybluez2
```

### Run

```bash
python offline_sync/mock_drone.py \
  --mac AA:BB:CC:DD:EE:FF \
  --image path/to/leaf.jpg \
  --latitude 11.2305 \
  --longitude 77.4900
```

Press ENTER to send one payload. Type `q` to exit.

## 3) Frame Protocol (for both sides)

Each message is length-prefixed:
- 4-byte big-endian unsigned int = payload length.
- UTF-8 JSON bytes.

Ack from Android uses same frame format:

```json
{"status":"ok","capture_id":"..."}
```
