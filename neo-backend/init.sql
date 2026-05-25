-- NeoAgri PostgreSQL Initialization Schema
-- This script matches the offline sqlite schema in the React Native App
-- and the JSON payloads emitted by `website_station_backend`

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: Farmers
-- Primary auth entity, phone number acts as the ID
CREATE TABLE IF NOT EXISTS farmers (
    phone VARCHAR(20) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Drone Sessions
-- Created when a new drone scan flight is initiated for a specific farm
CREATE TABLE IF NOT EXISTS drone_sessions (
    session_id VARCHAR(100) PRIMARY KEY,
    farmer_phone VARCHAR(20) REFERENCES farmers(phone) ON DELETE CASCADE,
    farm_id VARCHAR(100),
    drone_id VARCHAR(100),
    flight_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Drone Markers (The payloads received from website_station_backend)
-- Format expects a 1:1 mapping with the 'leaf_capture' JSON envelope
CREATE TABLE IF NOT EXISTS drone_markers (
    capture_id UUID PRIMARY KEY,
    session_id VARCHAR(100) REFERENCES drone_sessions(session_id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    timestamp_utc TIMESTAMP WITH TIME ZONE,
    disease VARCHAR(255),
    confidence DOUBLE PRECISION,
    leaf_image_b64 TEXT,
    status VARCHAR(50) DEFAULT 'unverified', -- 'unverified', 'verified_by_farmer'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Manual Farmer Scans
-- Flushed from the offline SQLite queue when the farmer connects to Wi-Fi
CREATE TABLE IF NOT EXISTS manual_scans (
    scan_id UUID PRIMARY KEY,
    farmer_phone VARCHAR(20) REFERENCES farmers(phone) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    disease VARCHAR(255),
    confidence DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add Geo-Spatial extensions or JSONB logging columns later if analytics are required.
