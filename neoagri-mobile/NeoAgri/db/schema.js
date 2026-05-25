import * as SQLite from 'expo-sqlite';

// Initialize and export the DB instance synchronously (standard for expo-sqlite in Expo SDK 50+)
let db;
export const getDb = () => {
  if(!db) db = SQLite.openDatabaseSync('neoagri.db');
  return db;
};


export const initDB = () => {
  // Use WAL mode for better performance
  getDb().execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      farm_id TEXT,
      farmer_phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS markers (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      lat REAL,
      lng REAL,
      disease TEXT,
      confidence REAL,
      FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS scans (
      id TEXT PRIMARY KEY,
      marker_id TEXT,
      farmer_phone TEXT,
      image_uri TEXT,
      result TEXT,
      scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (marker_id) REFERENCES markers (id) ON DELETE SET NULL
    );
  `);
};

// --- Sessions ---
export const insertSession = (session) => {
  const statement = getDb().prepareSync(
    'INSERT OR REPLACE INTO sessions (id, farm_id, farmer_phone, synced) VALUES ($id, $farm_id, $farmer_phone, $synced)'
  );
  statement.executeSync({
    $id: session.id,
    $farm_id: session.farm_id,
    $farmer_phone: session.farmer_phone,
    $synced: session.synced ? 1 : 0
  });
};

export const getSessions = (phone) => {
  return getDb().getAllSync('SELECT * FROM sessions WHERE farmer_phone = ? ORDER BY created_at DESC', [phone]);
};

export const getUnsyncedSessions = () => {
  return getDb().getAllSync('SELECT * FROM sessions WHERE synced = 0');
};

export const markSessionSynced = (sessionId) => {
  getDb().runSync('UPDATE sessions SET synced = 1 WHERE id = ?', [sessionId]);
};

// --- Markers ---
export const insertMarker = (marker) => {
  const statement = getDb().prepareSync(
    'INSERT OR REPLACE INTO markers (id, session_id, lat, lng, disease, confidence) VALUES ($id, $session_id, $lat, $lng, $disease, $confidence)'
  );
  statement.executeSync({
    $id: marker.id,
    $session_id: marker.session_id,
    $lat: marker.lat,
    $lng: marker.lng,
    $disease: marker.disease,
    $confidence: marker.confidence
  });
};

export const getMarkersForSession = (sessionId) => {
  return getDb().getAllSync('SELECT * FROM markers WHERE session_id = ?', [sessionId]);
};

export const getAllMarkers = () => {
  return getDb().getAllSync('SELECT * FROM markers');
};

// --- Scans ---
export const insertScan = (scan) => {
  const statement = getDb().prepareSync(
    'INSERT INTO scans (id, marker_id, farmer_phone, image_uri, result) VALUES ($id, $marker_id, $farmer_phone, $image_uri, $result)'
  );
  statement.executeSync({
    $id: scan.id,
    $marker_id: scan.marker_id || null,
    $farmer_phone: scan.farmer_phone,
    $image_uri: scan.image_uri,
    $result: scan.result
  });
};

export const getScans = (phone) => {
  return getDb().getAllSync('SELECT * FROM scans WHERE farmer_phone = ? ORDER BY scanned_at DESC', [phone]);
};

// Helper inside App setup (e.g. _layout.js)
// initDB() should be called at the root of the app
