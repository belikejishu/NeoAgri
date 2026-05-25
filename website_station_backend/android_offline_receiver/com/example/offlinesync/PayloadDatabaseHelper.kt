package com.example.offlinesync

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

class PayloadDatabaseHelper(context: Context) :
    SQLiteOpenHelper(context, DB_NAME, null, DB_VERSION) {

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE $TABLE_CAPTURES (
                capture_id TEXT PRIMARY KEY,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                timestamp_utc TEXT NOT NULL,
                leaf_image_bytes BLOB NOT NULL,
                received_at_utc TEXT NOT NULL,
                sync_status INTEGER NOT NULL DEFAULT 0
            )
            """.trimIndent()
        )
        db.execSQL("CREATE INDEX idx_captures_timestamp ON $TABLE_CAPTURES(timestamp_utc)")
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        if (oldVersion < 2) {
            db.execSQL("ALTER TABLE $TABLE_CAPTURES ADD COLUMN sync_status INTEGER NOT NULL DEFAULT 0")
        }
    }

    companion object {
        const val DB_NAME = "uav_offline_sync.db"
        const val DB_VERSION = 2
        const val TABLE_CAPTURES = "captures"
    }
}
