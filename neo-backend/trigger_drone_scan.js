require('dotenv').config();
const jwt = require('jsonwebtoken');

const phone = process.argv[2] || '+919137871445';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-neoagri';
const token = jwt.sign({ phone }, JWT_SECRET, { expiresIn: '7d' });

const payload = {
  farmId: "FARM-HQ",
  droneId: "DRX-001",
  markers: [
    {
      type: "leaf_capture",
      payload: {
        capture_id: require('crypto').randomUUID(),
        latitude: 23.0 + (Math.random() * 0.1),
        longitude: 72.0 + (Math.random() * 0.1),
        timestamp_utc: new Date().toISOString(),
        model_result: { disease: "Caterpillar_Pest_Attack", confidence: 0.94 },
        leaf_image_b64: "dummy_b64",
        status: "unverified"
      }
    },
    {
      type: "leaf_capture",
      payload: {
        capture_id: require('crypto').randomUUID(),
        latitude: 23.0 + (Math.random() * 0.1),
        longitude: 72.0 + (Math.random() * 0.1),
        timestamp_utc: new Date().toISOString(),
        model_result: { disease: "Healthy_Soyabean", confidence: 0.99 },
        leaf_image_b64: "dummy_b64",
        status: "unverified"
      }
    }
  ]
};

fetch('http://127.0.0.1:3000/session/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(payload)
})
.then(res => res.json())
.then(data => console.log('✅ Drone Payload Successfully Pushed:', data))
.catch(err => console.error('❌ Error hitting backend:', err));
