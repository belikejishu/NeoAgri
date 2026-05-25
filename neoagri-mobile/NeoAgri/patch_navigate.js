const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'app/navigate.js');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "Alert.alert(\"No disease markers found in database.\");",
  "Alert.alert(\"No disease markers found in database. Did the backend fetch fail? Please check your terminal for logs.\");"
);

fs.writeFileSync(file, content);
console.log('Patched app/navigate.js');
