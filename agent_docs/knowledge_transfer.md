# NeoAgri Knowledge Transfer Document

## 1. Project Motivation & Constraints
**NeoAgri** is a drone-assisted crop disease detection application built designed specifically for Indian farmers (specifically soybean farmers in Maharashtra).
- **Offline-First**: Farms lack internet. The app must cache Drone Coordinates (Wi-Fi) -> Operate on local `expo-sqlite` and `react-native-fast-tflite` offline -> Queue farmer confirmations -> Post back to the server when network is restored.
- **Voice-First**: Lower literacy requirements mandate UI readouts. `expo-speech` with `language: 'hi-IN'` is used for navigating to points and reporting crop diseases.
- **Strict Separation of Models**:
  1. The Drone runs Python + ONNX models in the sky/ground-station (`website_station_backend`).
  2. The App runs a completely separate TFLite model on the close-up leaf using the smartphone camera.

## 2. Component Architecture Overview

### A. The Ground Station (`website_station_backend`)
- **Stack**: Python, FastAPI.
- **Role**: Receives bulk imagery from drones over Bluetooth or cables. Evaluates crop rows to spot anomalies.
- **Output**: Generates a standardized JSON envelope (`leaf_capture` schema) containing `capture_id` (UUID), `latitude`, `longitude`, `timestamp`, `disease`, `confidence`, and a base64 crop.

### B. The Sync Node (`neo-backend`)
- **Stack**: Node.js, Express, PostgreSQL, JWT.
- **Role**: The permanent state database. Receives JSON from the Station. Safely secures it into relational tables (`drone_sessions`, `drone_markers`). Handles Farmer Auth (Phone OTP). Serves the offline synchronization endpoints (`GET /session/:id/markers`, `POST /scan/sync`).
- **Database File**: Initialization instructions are mapped in `neo-backend/init.sql`.

### C. The Farmer Phone (React Native via Expo)
- **Stack**: Expo SDK 54, React Native 0.81.5, JavaScript (No TypeScript allowed).
- **Core Integrations**:
  - `Vision Camera` + `fast-tflite`: Scans the `neoagri_app_model.tflite` via `float32` mappings in `hooks/useDiseaseScan.js`. Returns an array bounding summing ~1.0; parses Index 0 through 3 against `disease_labels.json`.
  - `@react-native-community/netinfo`: Monitors connectivity. Uses `db/offlineSync.js` to automatically map Wi-Fi restorations into flushing database changes.
  - `expo-sqlite`: Contains three offline tables (`sessions`, `markers`, `manual_scans`). Powers the app in the field.
  - UI/UX: Fully overhauled UI matching user mockups (Radar navigation in `navigate.js`, animated scanning boxes in `live-scan.js`, rich weather dashboard in `index.tsx`).

## 3. The Offline Protocol Loop
1. Farmers load the App at home (Wi-Fi). `<RootLayout>` executes `initializeOfflineSync()`.
2. NetInfo verifies connection -> Queries `neo-backend` for pending `drone_markers` under the farmer's session. Data caches to `expo-sqlite`.
3. Farmer drives to farm (zero internet). App loads offline pins from `getOfflineMarkers()`.
4. Radar (`navigate.js`) guides them locally.
5. Camera catches crop disease (`live-scan.js`). TFLite triggers alert. `disease_labels.json` reveals the cure.
6. Record is inserted into `manual_scans` table (offline).
7. Farmer returns home. Wi-Fi connects. NetInfo detects network -> `flushOfflineScans()` fires `POST /scan/sync` emptying the SQLite queue securely to Postgres.

## 4. Pending / Next Steps for Future Devs
- Initialize the real PostgreSQL instance locally or in the cloud using `init.sql`.
- Inject MSG91/Twilio into the existing `POST /auth/otp/send` wrapper in `server.js`.
- Execute a full end-to-end integration test pushing a raw image through the Station -> verifying it lands in Postgres -> pulling it over the App -> executing an offline scan -> restoring connection to prove the queue clears successfully.
