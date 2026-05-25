package com.example.offlinesync

import android.content.ContentValues
import android.content.Context
import android.util.Base64
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class PayloadRepository(context: Context) {
    private val dbHelper = PayloadDatabaseHelper(context)
    private val utcFormatter = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }

    fun upsert(envelope: DronePayloadEnvelope): Long {
        require(envelope.schema_version == "1.0") { "Unsupported schema version" }
        require(envelope.type == "leaf_capture") { "Unsupported payload type" }

        val imageBytes = Base64.decode(envelope.payload.leaf_image_b64, Base64.DEFAULT)
        val db = dbHelper.writableDatabase

        val values = ContentValues().apply {
            put("capture_id", envelope.payload.capture_id)
            put("latitude", envelope.payload.latitude)
            put("longitude", envelope.payload.longitude)
            put("timestamp_utc", envelope.payload.timestamp_utc)
            put("leaf_image_bytes", imageBytes)
            put("received_at_utc", utcFormatter.format(Date()))
            put("sync_status", 0)
        }

        return db.insertWithOnConflict(
            PayloadDatabaseHelper.TABLE_CAPTURES,
            null,
            values,
            android.database.sqlite.SQLiteDatabase.CONFLICT_REPLACE
        )
    }
}
