const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'app/sync_api.js');
let content = fs.readFileSync(file, 'utf8');

const DEV_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaG9uZSI6Iis5MTkxMzc4NzE0NDUiLCJpYXQiOjE3NzQ5NTIxNzcsImV4cCI6MTc3NTU1Njk3N30.teGb_xyxs7gItMxPsTVU65_jXwk5pKrr-TtCT49HaYA";

content = content.replace(
  "export const getAuthToken = async () => {\n  return await SecureStore.getItemAsync(TOKEN_KEY);\n};",
  "export const getAuthToken = async () => {\n  const token = await SecureStore.getItemAsync(TOKEN_KEY);\n  if (token) return token;\n  console.log('[Auth] Using developer bypass token for +919137871445');\n  return '" + DEV_TOKEN + "';\n};"
);

fs.writeFileSync(file, content);
console.log('Patched app/sync_api.js');
