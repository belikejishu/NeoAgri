# NeoAgri — Expo App

## Project
Drone-assisted crop disease detection app for Indian farmers. Built for ABV IIITM Hacksagon hackathon. Expo SDK 54 / React Native 0.81.5 / JavaScript (not TypeScript).

## IMPORTANT: Read Before Any Task
Before starting any task, read the relevant doc in `agent_docs/`:
- Architecture & data flow → `agent_docs/architecture.md`
- What's done / what's pending → `agent_docs/progress.md`
- Native module setup & known issues → `agent_docs/native_setup.md`
- Backend contract & API → `agent_docs/backend.md`

## Stack
- Navigation: expo-router
- On-device ML: react-native-fast-tflite (NOT TensorFlow.js)
- Camera: react-native-vision-camera v4 + vision-camera-resize-plugin
- Offline DB: expo-sqlite (NOT AsyncStorage for structured data)
- Location: expo-location
- Voice: expo-speech

## Commands
```bash
npx expo run:android     # build + run on device
npx expo start           # dev server (after native build)
```

## YOU MUST Follow These Rules
- Never use TypeScript — this is a JS project
- Never suggest switching to Flutter or bare React Native
- Never merge the drone model and app model — they are completely separate
- Always handle offline-first: assume no internet in field logic
- All user-facing text/voice must support Hindi — use expo-speech with `language: 'hi-IN'`
- When writing hooks, keep inference logic in worklets where Vision Camera requires it
- After completing any task, update `agent_docs/progress.md`
