const fetch = require('node-fetch'); // node 18+ has built in fetch
fetch('http://127.0.0.1:3000/bot/whatsapp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'From=+919876543210&Body=Rent 15 acres at 26.25,78.18'
})
.then(res => res.text())
.then(data => console.log('✅ WhatsApp Rendered TwiML:', data))
.catch(console.error);
