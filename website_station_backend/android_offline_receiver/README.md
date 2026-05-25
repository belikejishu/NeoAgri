# Android Offline Receiver (Bluetooth RFCOMM + SQLite)

Copy `android_offline_receiver/com/example/offlinesync/` into your Android app module, then integrate as below.

## 1) Manifest Permissions

Add to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
```

Request runtime permissions for Android 12+ (`BLUETOOTH_CONNECT`, `BLUETOOTH_SCAN`).

## 2) Gradle Dependency

`BluetoothPayloadServer.kt` uses Gson:

```gradle
implementation("com.google.code.gson:gson:2.10.1")
```

## 3) Start Listening

In your app (for example in an Activity or foreground Service):

```kotlin
private lateinit var offlineSyncManager: OfflineSyncManager

override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    offlineSyncManager = OfflineSyncManager(this) { status ->
        Log.d("OfflineSync", status)
    }
    offlineSyncManager.startListening()
}

override fun onDestroy() {
    offlineSyncManager.stopListening()
    super.onDestroy()
}
```

## 4) SQLite Table

Database: `uav_offline_sync.db`

Table: `captures`
- `capture_id TEXT PRIMARY KEY`
- `latitude REAL`
- `longitude REAL`
- `timestamp_utc TEXT`
- `leaf_image_bytes BLOB`
- `received_at_utc TEXT`
- `sync_status INTEGER`

The receiver decodes `leaf_image_b64` and stores bytes in `leaf_image_bytes`.

## 5) Read Data For UI

Example query:

```sql
SELECT capture_id, latitude, longitude, timestamp_utc, leaf_image_bytes
FROM captures
ORDER BY timestamp_utc DESC;
```

Convert `leaf_image_bytes` to `Bitmap` before rendering in UI.

## 6) Pairing Requirement

Pair the laptop and Android device first. Use the Android device Bluetooth MAC as `--mac` in the Python simulator.
