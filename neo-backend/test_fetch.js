require('dotenv').config();
const jwt = require('jsonwebtoken');
const phone = '+919137871445';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-neoagri';
const token = jwt.sign({ phone }, JWT_SECRET, { expiresIn: '7d' });

fetch('http://127.0.0.1:3000/farmer/history', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(data => {
  console.log("HISTORY:", data);
  if (data.history && data.history.length > 0) {
    const sessionId = data.history[0].session_id;
    return fetch(`http://127.0.0.1:3000/session/${sessionId}/markers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } else {
    throw new Error('No history');
  }
})
.then(res => res.json())
.then(data => console.log("MARKERS:", data))
.catch(err => console.error(err));
