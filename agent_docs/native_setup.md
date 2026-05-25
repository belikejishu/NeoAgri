# Native Module Setup

## metro.config.js (MUST HAVE — tflite files won't bundle without this)
```js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('tflite');
module.exports = config;
```

## babel.config.js (MUST HAVE — Vision Camera frame processors won't work without this)
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets-core/plugin'],
  };
};
```

## app.json plugins required
- react-native-vision-camera (cameraPermissionText)
- react-native-fast-tflite
- expo-location
- expo-speech

## Android permissions required
CAMERA, ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, RECEIVE_SMS, READ_SMS

## After any config change
Run: npx expo prebuild --clean && npx expo run:android

## Known Issues
- fast-tflite model path: use require() from assets, NOT a file path string
- worklets plugin MUST be first in babel plugins array
- vision-camera frame processors must use 'worklet' directive
