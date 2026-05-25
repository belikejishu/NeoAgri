# NeoAgri - End-to-End Testing & Usage Guide

Welcome to NeoAgri! This guide will walk you through setting up, running, and testing the entire NeoAgri ecosystem, which includes the PostgreSQL database, Node.js backend, Python drone ground station simulator, and React Native (Expo) mobile app.

## 🚀 Prerequisites
- **Node.js**: v18+ 
- **Docker & Docker Compose**: For running the PostgreSQL database locally.
- **Python**: v3.9+ (For the drone mock station).
- **Physical Android Device or Emulator**: To run the Expo React Native app.
- **Expo Go** (optional) or set up for `npx expo run:android`.

---

## 🛠️ Step 1: Start the Backend & Database

The backend is built with Express.js and uses PostgreSQL to store drone captures and manual offline scans.

1. **Start the Database**
   ```bash
   cd neo-backend
   docker compose up -d
   ```
   *This starts a PostgreSQL container on port `5433` (to avoid local conflicts).*

2. **Initialize Environment Variables**
   Ensure you have a `.env` file in the `neo-backend` directory with:
   ```env
   DATABASE_URL=postgresql://neoagri:neoagri_password@localhost:5433/neoagri
   JWT_SECRET=super_secret_jwt_key
   PORT=3000
   TWILIO_ACCOUNT_SID=AC_dummy_bypass
   TWILIO_AUTH_TOKEN=dummy
   TWILIO_PHONE_NUMBER=+1234567890
   ```

3. **Start the Express Server**
   ```bash
   npm install
   npm start
   ```
   *You should see `Server running on port 3000` and `[DB] Connected to PostgreSQL`.*

---

## 📱 Step 2: Configure & Run the Mobile App

The mobile app needs to know where the backend is hosted.

1. **Find your local IP address**:
   - Mac/Linux: `ifconfig` or `ip a`
   - Windows: `ipconfig`
   *(e.g., `192.168.1.100`)*

2. **Update the App's API URL**:
   Open `neoagri-mobile/NeoAgri/app/sync_api.js` and change `API_URL`:
   ```javascript
   export const API_URL = 'http://192.168.1.100:3000'; // Make sure to use YOUR IP
   ```

3. **Run the App**:
   ```bash
   cd neoagri-mobile/NeoAgri
   npm install
   npx expo run:android
   ```
   *This will build the native app and launch it on your connected device/emulator.*

---

## 🧪 Step 3: End-to-End Test Workflow

Now that everything is running, follow this flow to simulate a real-world use case.

### 1. Authenticate the Farmer
- Open the app on your device.
- Enter any phone number (e.g., `2222222222`).
- The backend will mock the OTP (check your backend terminal for the fake OTP code if not bypassed).
- Enter the OTP to log in and reach the Map Dashboard.

### 2. Simulate a Drone Scan (Ground Station -> Server)
In a real scenario, the Python ground station processes drone images via an ONNX AI model and sends them to the Node backend. We provide a simulator script.

Open a new terminal and run:
```bash
cd neo-backend
node trigger_drone_scan.js
```
*Wait for the `✅ Drone Payload Successfully Pushed` message. A mock "Yellow_Rust" disease marker is now in the PostgreSQL database.*

### 3. App Online Sync (Server -> App)
- Make sure your phone's Wi-Fi is **ON**.
- The app polls the backend automatically. You should see the new drone marker populate on your Map UI, saved securely in the Expo SQLite database.

### 4. App Offline Capture (No Internet)
- Turn **OFF Wi-Fi/Cellular data** on your phone.
- Navigate to the **Scan/Camera** tab.
- Capture an image of a leaf. The on-device TFLite model will instantly process it and identify the disease.
- Complete the save. Since there is no internet, the capture is queued in the local offline SQLite database.

### 5. Offline Flush (App -> Server)
- Turn your phone's **Wi-Fi back ON**.
- The React Native `@react-native-community/netinfo` listener will detect the connection restoration.
- Watch your `neo-backend` terminal! You will see log messages indicating that the offline manual scan was flushed and synced to the live PostgreSQL database.

---

## 🎉 Verification
You can manually query the PostgreSQL database to verify data integrity:
```bash
# Enter the database container
docker exec -it neoagri-postgres psql -U neoagri -d neoagri

# Check Drone sessions
SELECT * FROM drone_markers;

# Check Offline scans uploaded by mobile
SELECT * FROM manual_scans;
```

If the rows match your test data, the pipeline is 100% functional!

---

## 🏆 Step 4: Testing the Hackathon "Wow" Features

### 1. Live Mission Control Dashboard
Our real-time command center watches for drone payloads and farmer manual scans.
1. Make sure your `neo-backend` node server is running.
2. Open a web browser on your PC and navigate to: `http://localhost:3000/`
3. You will see a dark-mode military-style map tracking stats.
4. **Trigger an event:** Run `node trigger_drone_scan.js` in your terminal, or capture a leaf in the React Native app while online.
5. Watch the dashboard instantly update via WebSocket, dropping a pulsing red pin on the map and showing live logs.

### 2. AR "Geiger" GPS Navigation
Test the gamified compass tool used to find infected crops in the field.
1. Run the app on a **Physical Android Device** (Emulators don't have accurate magnetometers).
2. Tap "Start Navigation" from the home screen to find a detected disease marker.
3. Rotate your phone: The compass arrow should rotate physically, tracking the geographic heading of the infected plant.
4. As the distance closes (under 10 meters), you should feel physical haptic vibrations accelerating, mimicking a Geiger counter.

### 3. WhatsApp / SMS Fallback Bot (Non-Smartphone Users)
Instead of forcing marginalized farmers to use a 5G app, they can use regular SMS/WhatsApp. We configured a TwiML webhook on the Express server.
1. Open a new terminal to simulate a Twilio webhook POST request:
    ```bash
    curl -X POST http://localhost:3000/bot/whatsapp \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "Body=caterpillar"
    ```
2. You should see a formatted XML response returning the recommended organic cure in text. This can easily be hooked up to Twilio + ngrok for a live WhatsApp number.
