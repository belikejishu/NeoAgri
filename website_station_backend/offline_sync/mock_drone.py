import argparse
import base64
import json
import random
import socket
import struct
import uuid
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from typing import Any

from PIL import Image

try:
    import bluetooth  # type: ignore
except ImportError:
    bluetooth = None


DEFAULT_UUID = "00001101-0000-1000-8000-00805F9B34FB"
DEFAULT_PORT = 1


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def random_leaf_crop(image: Image.Image, min_ratio: float = 0.45, max_ratio: float = 0.75) -> Image.Image:
    width, height = image.size
    crop_ratio = random.uniform(min_ratio, max_ratio)
    crop_w = max(32, int(width * crop_ratio))
    crop_h = max(32, int(height * crop_ratio))

    max_x = max(0, width - crop_w)
    max_y = max(0, height - crop_h)
    x = random.randint(0, max_x) if max_x > 0 else 0
    y = random.randint(0, max_y) if max_y > 0 else 0

    return image.crop((x, y, x + crop_w, y + crop_h))


def encode_leaf_image_b64(image_path: Path) -> str:
    with Image.open(image_path).convert("RGB") as image:
        crop = random_leaf_crop(image)
        out = BytesIO()
        crop.save(out, format="JPEG", quality=90)
        return base64.b64encode(out.getvalue()).decode("ascii")


def build_payload(latitude: float, longitude: float, image_path: Path) -> dict[str, Any]:
    payload = {
        "capture_id": str(uuid.uuid4()),
        "latitude": latitude,
        "longitude": longitude,
        "timestamp_utc": utc_now_iso(),
        "leaf_image_b64": encode_leaf_image_b64(image_path),
    }
    return {
        "schema_version": "1.0",
        "type": "leaf_capture",
        "payload": payload,
    }


def send_framed_json(sock: socket.socket, data: dict[str, Any]) -> None:
    body = json.dumps(data, separators=(",", ":")).encode("utf-8")
    header = struct.pack(">I", len(body))
    sock.sendall(header + body)


def recv_exact(sock: socket.socket, size: int) -> bytes:
    chunks: list[bytes] = []
    remaining = size
    while remaining > 0:
        chunk = sock.recv(remaining)
        if not chunk:
            raise ConnectionError("Socket closed before full frame was received")
        chunks.append(chunk)
        remaining -= len(chunk)
    return b"".join(chunks)


def recv_framed_json(sock: socket.socket) -> dict[str, Any]:
    length_bytes = recv_exact(sock, 4)
    length = struct.unpack(">I", length_bytes)[0]
    body = recv_exact(sock, length)
    return json.loads(body.decode("utf-8"))


def connect_bluetooth(mac_address: str, port: int) -> socket.socket:
    if bluetooth is None:
        raise RuntimeError(
            "PyBluez is not installed. Install with: pip install pybluez2"
        )

    client = bluetooth.BluetoothSocket(bluetooth.RFCOMM)
    client.connect((mac_address, port))
    return client


def run_simulator(args: argparse.Namespace) -> None:
    image_path = Path(args.image).expanduser().resolve()
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    print("Mock drone simulator ready.")
    print(f"Target Android MAC: {args.mac}")
    print("Press ENTER to generate and send payload, or type 'q' then ENTER to quit.")

    while True:
        user_input = input("> ").strip().lower()
        if user_input in {"q", "quit", "exit"}:
            print("Exiting simulator.")
            break

        payload = build_payload(args.latitude, args.longitude, image_path)
        payload_size_kb = len(json.dumps(payload).encode("utf-8")) / 1024

        try:
            with connect_bluetooth(args.mac, args.port) as sock:
                send_framed_json(sock, payload)
                ack = recv_framed_json(sock)

            print(
                "Sent capture_id="
                f"{payload['payload']['capture_id']} "
                f"({payload_size_kb:.1f} KB), ack={ack.get('status', 'unknown')}"
            )
        except Exception as exc:
            print(f"Send failed: {exc}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Mock drone edge simulator for offline Android sync over Bluetooth RFCOMM"
    )
    parser.add_argument("--mac", required=True, help="Android Bluetooth MAC address")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="RFCOMM port (default: 1)")
    parser.add_argument(
        "--image",
        required=True,
        help="Path to source leaf image (a random crop is sent each time)",
    )
    parser.add_argument("--latitude", type=float, required=True, help="Capture latitude")
    parser.add_argument("--longitude", type=float, required=True, help="Capture longitude")
    return parser.parse_args()


if __name__ == "__main__":
    run_simulator(parse_args())
