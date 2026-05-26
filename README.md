# 🌾 NeoAgri — Drone + Edge AI Agriculture Intelligence System

NeoAgri is a full-stack, offline-first precision agriculture platform that combines drone-based AI, edge machine learning, and real-time backend synchronization to assist farmers in detecting crop diseases and managing fields efficiently — even in low-connectivity rural environments.

It is designed for Indian soybean farmers (Maharashtra focus) with strong emphasis on:

- Offline functionality
- Voice-first interaction
- Low-literacy accessibility
- Real-time + delayed sync hybrid architecture

---

# 🚀 Project Overview

NeoAgri is a distributed AI system made of three intelligent layers:

1. 🚁 Drone Intelligence Layer (Cloud AI)
2. ⚙️ Backend Sync Layer (Node.js + PostgreSQL)
3. 📱 Mobile Edge AI Layer (Offline-first React Native App)

Each layer works independently but synchronizes through a unified data contract (`leaf_capture` schema).

---

# 🧠 Core Architecture (System Design)

## 🚁 1. Drone Intelligence System (Cloud AI Layer)

**Tech Stack:**

- Python
- FastAPI (`website_station_backend`)
- ONNX Runtime AI model

**Responsibilities:**

- Receives aerial crop images from drones
- Processes large field sections
- Detects crop disease patterns
- Generates structured AI output

**Output Format (`leaf_capture`):**

- capture_id (UUID)
- latitude & longitude
- timestamp (UTC)
- leaf_image (base64)
- model_result (disease + confidence)

---

## ⚙️ 2. Backend System (Node.js + PostgreSQL)

**Tech Stack:**

- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- Firebase Cloud Messaging (FCM)

### 🔌 APIs

- `POST /session/create` → Store drone payload + trigger notifications
- `GET /session/:id/markers` → Fetch GPS disease markers
- `GET /farmer/history` → Farmer scan history
- `POST /scan/sync` → Offline mobile scan sync
- `POST /auth/otp/send` → Send OTP (MSG91/Twilio)
- `POST /auth/otp/verify` → Verify OTP + return JWT

---

### 📊 Database Schema

**farmers**

- phone (PK)
- created_at

**drone_sessions**

- session_id (PK)
- farmer_phone (FK)
- farm_id
- drone_id

**drone_markers**

- capture_id (PK)
- session_id
- latitude
- longitude
- timestamp_utc
- disease
- confidence
- leaf_image_b64
- status

**manual_scans**

- scan_id (PK)
- farmer_phone
- timestamp
- latitude
- longitude
- disease
- confidence

---

### 🔔 Notifications

- Firebase Cloud Messaging (FCM)
- Real-time alerts for drone sessions and scan updates

---

## 📱 3. Mobile Application (Edge AI Layer)

**Tech Stack:**

- React Native (Expo SDK 54)
- Vision Camera
- react-native-fast-tflite
- expo-sqlite
- expo-speech
- NetInfo

---

### 🧠 Features

- 📷 Real-time crop disease detection (TFLite)
- 🧠 On-device AI inference (offline)
- 📍 GPS-based navigation system
- 🔊 Hindi voice guidance (expo-speech)
- 📦 Offline-first data storage
- 🔄 Automatic sync when online

---

## 🧠 AI Model

- Model: `neoagri_app_model.tflite`
- Accuracy: ~83% validation accuracy

### Classes:

- Caterpillar & Semilooper Pest Attack
- Healthy Soybean
- Frog Leaf Disease
- Brown Spot Disease

---

## 🔄 Offline-First Architecture

NeoAgri works without internet.

### Flow:

User Action → SQLite Storage → Network Check → Sync Queue → Backend Update

- All offline scans stored locally
- Syncs automatically when internet returns
- Uses `offlineSync.js` system

---

## 📡 End-to-End System Flow

Drone Scan → Backend → PostgreSQL → Mobile Sync → Offline AI Scan → Re-sync → Database

---

## 🧪 Testing Setup

### Backend

```bash
cd neo-backend
docker compose up -d
npm install
npm start
```

---

### Mobile App

```bash
cd neoagri-mobile/NeoAgri
npm install
npx expo run:android
```

---

### Drone Simulation

```bash
node trigger_drone_scan.js
```

---

### Offline Test Flow

1. Turn OFF internet
2. Capture leaf image
3. AI runs locally (TFLite)
4. Data stored in SQLite
5. Turn ON internet
6. Auto-sync to backend

---

## 🎯 Advanced Features

### 📊 Mission Control Dashboard

- Real-time monitoring of drones + farmers
- WebSocket live updates

### 🧭 AR Navigation System

- Magnetometer-based compass
- Haptic feedback for proximity alerts

### 📲 SMS / WhatsApp Bot

- Works for non-smartphone users
- Disease diagnosis via text

---

## 🔐 Authentication

- Phone number only login
- OTP via MSG91 / Twilio
- JWT session tokens

---

## ⚙️ Native ML Setup

- Vision Camera frame processors
- React Native Worklets
- TFLite bundling via Metro config
- Android native permissions

---

## 📈 Key Highlights

- Edge AI (on-device inference)
- Cloud AI (drone processing)
- Offline-first architecture
- Real-time sync engine
- Voice-first UX (Hindi support)
- Rural optimized design
- Distributed AI system

---

## 🌍 Impact

NeoAgri enables:

Smart farming in rural India using AI, drones, and offline mobile intelligence systems — even without continuous internet access.

---

## 🛠 Tech Stack

- React Native (Expo)
- Node.js + Express
- PostgreSQL
- Python + FastAPI
- ONNX Runtime
- TensorFlow Lite
- Firebase Cloud Messaging
- SQLite

---

## 🚀 Future Scope

- Satellite crop monitoring
- Multilingual AI support
- Predictive disease analytics
- Government scheme integration
- Full cloud deployment

---

## 👨‍💻 Author

NeoAgri Project  
AI + Drone + Edge Agriculture Intelligence System

---

## ⭐ Final Note

NeoAgri is a production-grade distributed AI agriculture ecosystem combining drone intelligence, edge computing, offline-first mobile AI, and real-time backend synchronization.
