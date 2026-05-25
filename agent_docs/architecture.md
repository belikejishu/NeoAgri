# NeoAgri Architecture

## Two Models — Never Confuse These
| | Drone Model | App Model |
|---|---|---|
| Runs on | Python backend server (`website_station_backend`) | Inside Expo app (`neoagri-mobile` offline) |
| Image type | Top-down UAV aerial shots | Close-up ground-level leaf |
| Built? | ✅ Yes | ✅ Yes — `models/neoagri_app_model.tflite` |
| Output | `leaf_capture` JSON payload with GPS | Disease name, severity + cure |

## User Flow
1. Farmer requests drone scan (app/call).
2. Drone scans field → `website_station_backend` runs ONNX drone model → emits `leaf_capture` payload.
3. Node Backend (`neo-backend`) receives payload via POST and saves to Postgres.
4. App (`neoagri-mobile`) receives payload over internet -> Caches via `@react-native-community/netinfo` into `expo-sqlite`.
5. Farmer navigates offline to GPS pin using app radar + `expo-speech` Hindi voice directions.
6. Farmer uses Live Mode → frame processor runs inference at 5 FPS in real-time over the offline TFLite model.
7. Resulting scans stay in `expo-sqlite` and flush to `neo-backend` when Wi-Fi is restored via background sync.

## App Model Classes (order is critical - float32 outputs)
- Index 0 → Caterpillar and Semilooper Pest Attack (High)
- Index 1 → Healthy_Soyabean (None)
- Index 2 → Soyabean_Frog_Leaf_Eye (Medium)
- Index 3 → Soyabean_Spectoria_Brown_Spot (Medium)
Labels + cures → `models/disease_labels.json`

## Offline Strategy (Fully Implemented)
- Built into `app/db/offlineSync.js`.
- Syncs drone sessions continuously when online.
- Employs native SQLite caching. Only queries `getOfflineMarkers()` offline.
- Pending manual scans are queued in `manual_scans` table and bulk POSTed to `<API_URL>/scan/sync` when online.

## Drone Backend Payload Contract (JSON Schema aligned with `website_station_backend`)
```json
{
  "schema_version": "1.0",
  "type": "leaf_capture",
  "payload": {
    "capture_id": "uuid",
    "latitude": 11.2305,
    "longitude": 77.4900,
    "timestamp_utc": "2026-03-17T10:32:40.571Z",
    "leaf_image_b64": "...",
    "model_result": { "disease": "...", "confidence": 0.999 }
  }
}
```
