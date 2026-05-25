package com.example.offlinesync

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothServerSocket
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat
import com.google.gson.Gson
import java.io.BufferedInputStream
import java.io.BufferedOutputStream
import java.io.DataInputStream
import java.io.DataOutputStream
import java.io.EOFException
import java.io.IOException
import java.util.UUID
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

class BluetoothPayloadServer(
    private val context: Context,
    private val repository: PayloadRepository,
    private val onStatus: (String) -> Unit = {}
) {
    private val running = AtomicBoolean(false)
    private val executor = Executors.newSingleThreadExecutor()
    private val gson = Gson()
    private var serverSocket: BluetoothServerSocket? = null

    @SuppressLint("MissingPermission")
    fun start() {
        if (running.getAndSet(true)) {
            return
        }

        if (!hasBluetoothPermission()) {
            onStatus("Missing Bluetooth permissions")
            running.set(false)
            return
        }

        val adapter = BluetoothAdapter.getDefaultAdapter()
        if (adapter == null) {
            onStatus("Bluetooth not supported on this device")
            running.set(false)
            return
        }

        executor.submit {
            try {
                serverSocket = adapter.listenUsingRfcommWithServiceRecord(SERVICE_NAME, SERVICE_UUID)
                onStatus("Bluetooth server listening")

                while (running.get()) {
                    val client = serverSocket?.accept() ?: break
                    onStatus("Client connected: ${client.remoteDevice?.name}")
                    handleClient(client)
                }
            } catch (e: IOException) {
                if (running.get()) {
                    onStatus("Server error: ${e.message}")
                }
            } finally {
                closeServerSocket()
                running.set(false)
            }
        }
    }

    fun stop() {
        running.set(false)
        closeServerSocket()
    }

    private fun hasBluetoothPermission(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            return true
        }

        val connectGranted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.BLUETOOTH_CONNECT
        ) == PackageManager.PERMISSION_GRANTED

        val scanGranted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.BLUETOOTH_SCAN
        ) == PackageManager.PERMISSION_GRANTED

        return connectGranted && scanGranted
    }

    @SuppressLint("MissingPermission")
    private fun handleClient(socket: BluetoothSocket) {
        socket.use { btSocket ->
            val input = DataInputStream(BufferedInputStream(btSocket.inputStream))
            val output = DataOutputStream(BufferedOutputStream(btSocket.outputStream))

            try {
                val message = readFrame(input)
                val envelope = gson.fromJson(message, DronePayloadEnvelope::class.java)
                repository.upsert(envelope)
                writeAck(output, "ok", envelope.payload.capture_id)
                onStatus("Stored capture_id=${envelope.payload.capture_id}")
            } catch (e: Exception) {
                writeAck(output, "error", null)
                onStatus("Client handling error: ${e.message}")
            }
        }
    }

    private fun readFrame(input: DataInputStream): String {
        val length = try {
            input.readInt()
        } catch (e: EOFException) {
            throw IOException("Client disconnected before sending a frame", e)
        }

        if (length <= 0 || length > MAX_FRAME_BYTES) {
            throw IOException("Invalid frame length: $length")
        }

        val body = ByteArray(length)
        input.readFully(body)
        return body.toString(Charsets.UTF_8)
    }

    private fun writeAck(output: DataOutputStream, status: String, captureId: String?) {
        val ack = if (captureId != null) {
            gson.toJson(mapOf("status" to status, "capture_id" to captureId))
        } else {
            gson.toJson(mapOf("status" to status))
        }

        val body = ack.toByteArray(Charsets.UTF_8)
        output.writeInt(body.size)
        output.write(body)
        output.flush()
    }

    private fun closeServerSocket() {
        try {
            serverSocket?.close()
        } catch (_: IOException) {
        }
    }

    companion object {
        private const val SERVICE_NAME = "UavOfflineSync"
        private val SERVICE_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
        private const val MAX_FRAME_BYTES = 20 * 1024 * 1024
    }
}
