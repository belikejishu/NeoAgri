import urllib.request
import struct

with open('/home/ariz/DEV/NeoAgri/neoagri-mobile/NeoAgri/models/neoagri_app_model.tflite', 'rb') as f:
    header = f.read(16)
    print(header)
