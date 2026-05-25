# App Backend (Node.js/Express + PostgreSQL)

## Endpoints to Build
`POST   /session/create`         — drone/station uploads payload (`leaf_capture` format), stored in Postgres DB, triggers FCM push.
`GET    /session/:id/markers`    — returns all GPS markers for a session directly parsed matching the `leaf_capture` schema.
`GET    /farmer/history`         — returns all past sessions for a farmer (`req.user.phone`).
`POST   /scan/sync`              — bulk uploads queued `manual_scans` captured by the farmer while offline.
`POST   /auth/otp/send`          — triggers OTP SMS via MSG91 or Twilio.
`POST   /auth/otp/verify`        — verifies OTP, returns JWT session token string.

## Database Tables (refer to neo-backend/init.sql)
`farmers`: phone (PK), created_at
`drone_sessions`: session_id (PK), farmer_phone (FK), farm_id, drone_id
`drone_markers`: capture_id (PK), session_id (FK), latitude, longitude, timestamp_utc, disease, confidence, leaf_image_b64, status
`manual_scans`: scan_id (PK), farmer_phone (FK), timestamp, latitude, longitude, disease, confidence

## Auth
- Phone number only — no email/password
- OTP via MSG91 (India) or Twilio
- JWT for session token, passed via traditional Bearer authorization header.

## Push Notifications
- FCM via Firebase when new drone session payload arrives
- Payload includes `session_id` so app knows what to fetch into `expo-sqlite`
