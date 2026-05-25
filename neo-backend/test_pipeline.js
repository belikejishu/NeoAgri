const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { randomUUID } = require('crypto');
require('dotenv').config();

async function runTest() {
  console.log('\n--- 🚀 STARTING NEOGARI E2E PIPELINE TEST ---');

  const phone = '+919999999999';
  const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-neoagri';
  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5433/neoagri';

  // 1. Manually forge a JWT session token
  const token = jwt.sign({ phone }, JWT_SECRET, { expiresIn: '7d' });

  const pool = new Pool({ connectionString: dbUrl });
  await pool.query('INSERT INTO farmers (phone) VALUES ($1) ON CONFLICT DO NOTHING', [phone]);
  console.log('✅ 1. Mock Farmer Authenticated with forged JWT.');

  const mockDronePayload = {
    farmId: 'FARM-001',
    droneId: 'DRX-001',
    markers: [
      {
        type: 'leaf_capture',
        payload: {
          capture_id: randomUUID(),
          latitude: 19.5038,
          longitude: 78.1513,
          timestamp_utc: new Date().toISOString(),
          model_result: { disease: 'Soyabean_Frog_Leaf_Eye', confidence: 0.95 },
          leaf_image_b64: 'base64_placeholder'
        }
      }
    ]
  };

  try {
    console.log(`\n🚁 2. Drone posting ${mockDronePayload.markers.length} GPS markers to backend...`);
    const createRes = await fetch('http://127.0.0.1:3000/session/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(mockDronePayload)
    });
    const createData = await createRes.json();
    console.log('   Response:', createData);
    const sessionId = createData.sessionId;

    console.log(`\n📱 3. App requesting offline marker cache for ${sessionId}...`);
    const getRes = await fetch(`http://127.0.0.1:3000/session/${sessionId}/markers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getData = await getRes.json();
    console.log('   App received', getData.markers.length, 'marker(s). Sample disease:', getData.markers[0].payload.model_result.disease);

    console.log('\n📡 4. App flashing a pending manual scan back to server after WiFi restores...');
    const syncRes = await fetch('http://127.0.0.1:3000/scan/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        scans: [
          {
            id: randomUUID(),
            timestamp: new Date().toISOString(),
            latitude: 19.5040,
            longitude: 78.1520,
            disease: 'Healthy_Soyabean',
            confidence: 0.99
          }
        ]
      })
    });
    const syncData = await syncRes.json();
    console.log('   Sync Response:', syncData);

    console.log('\n🗄️ 5. Final verification directly inside PostgreSQL:');
    const dbDrone = await pool.query('SELECT capture_id, disease, status FROM drone_markers');
    console.log('   Drone Markers DB State:', dbDrone.rows);
    const dbScans = await pool.query('SELECT scan_id, disease FROM manual_scans');
    console.log('   Manual Scans DB State:', dbScans.rows);

  } catch (err) {
    console.error('Test Failed:', err);
  } finally {
    await pool.end();
    console.log('\n--- ✅ PIPELINE TEST COMPLETE ---\n');
  }
}
runTest();
