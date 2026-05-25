const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'app/db/offlineSync.js');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "if (!state.isConnected) {",
  "if (state.isConnected === false && state.isInternetReachable === false) { console.log('[Sync] Force assuming offline');"
);

content = content.replace(
  "if (state.isConnected) {",
  "if (state.isConnected !== false) {"
);

fs.writeFileSync(file, content);
console.log('Patched app/db/offlineSync.js');
