const fs = require('fs');

function parseTFLite() {
    const buffer = fs.readFileSync('/home/ariz/DEV/NeoAgri/models/neoagri_app_model.tflite');
    if (buffer.toString('utf8', 4, 8) !== 'TFL3') {
        console.log('Not a valid TFLite file');
        return;
    }
    
    // Simplistic guess for byte size/dataType checking by looking at the model file.
    // Actually, writing a full flatbuffer parser in script is hard.
}
parseTFLite();
