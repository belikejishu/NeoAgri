const fs = require('fs');
const appJson = JSON.parse(fs.readFileSync('app.json'));
appJson.expo.plugins = appJson.expo.plugins.filter(p => p !== 'expo-speech');
fs.writeFileSync('app.json', JSON.stringify(appJson, null, 2));
