package com.example.offlinesync

data class DronePayloadEnvelope(
    val schema_version: String,
    val type: String,
    val payload: DronePayload
)

data class DronePayload(
    val capture_id: String,
    val latitude: Double,
    val longitude: Double,
    val timestamp_utc: String,
    val leaf_image_b64: String
)
