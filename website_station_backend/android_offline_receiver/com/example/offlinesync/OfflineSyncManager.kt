package com.example.offlinesync

import android.content.Context

class OfflineSyncManager(
    context: Context,
    private val onStatus: (String) -> Unit = {}
) {
    private val repository = PayloadRepository(context)
    private val server = BluetoothPayloadServer(context, repository, onStatus)

    fun startListening() {
        server.start()
    }

    fun stopListening() {
        server.stop()
    }
}
