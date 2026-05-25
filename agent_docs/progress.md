# Build Progress

## Done
- [x] Drone backend (Python, separate repo / `website_station_backend` mapped)
- [x] App UI screens designed and built (updated to UIUX mockups)
- [x] TFLite model trained — 83% val_accuracy, 4 classes (`float32` parsed)
- [x] models/neoagri_app_model.tflite in project root
- [x] models/disease_labels.json in project root
- [x] All npm packages installed (`fast-tflite`, `vision-camera`, `worklets`, `location`, `speech`, `sqlite`, `sms`, `@react-native-community/netinfo`)
- [x] metro.config.js — add tflite to assetExts
- [x] babel.config.js — add react-native-worklets-core/plugin
- [x] app.json — add plugins + Android permissions
- [x] npx expo prebuild --clean
- [x] hooks/useDiseaseScan.js — TFLite single image + frame processor
- [x] db/schema.js — SQLite tables: sessions, markers, scans
- [x] utils/haversine.js — bearing + distance calculation
- [x] GPS navigation screen logic + voice directions (`navigate.js`)
- [x] Live mode screen — Vision Camera + frame processor (`live-scan.js`)
- [x] OTP phone auth — UI created (`login.tsx`)
- [x] Backend sync — online pull → SQLite, offline queue (`db/offlineSync.js` + `sync_api.js`)
- [x] App backend — Node.js/Express + PostgreSQL endpoints mapped

## Pending (do in this order)
- [x] Spin up the live PostgreSQL server and apply `neo-backend/init.sql`
- [x] Integrate MSG91 / Twilio SMS logic inside `POST /auth/otp/send`
- [x] Finalize Expo SMS Retriever auto-read on Android inside `<LoginScreen/>`
- [x] Test the full physical pipeline (Station -> Node backend -> Wi-Fi pull -> Offline Scan -> Wi-Fi flush).

## Hackathon Polish
- [x] Feature 1: Live Mission Control Dashboard (`neo-backend/public/index.html` + `socket.io` in Express).
- [x] Feature 2: AR Geiger Navigation (Integrated `Magnetometer` + `Haptics` in `navigate.js`).
- [x] Feature 3: WhatsApp/SMS Fallback Bot for Non-Smartphone users.
