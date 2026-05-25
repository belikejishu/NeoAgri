import argparse
import json
from pathlib import Path
from typing import Any

import requests


def load_coords_map(path: Path | None) -> dict[str, dict[str, float]]:
    if path is None:
        return {}
    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise ValueError("Coordinates file must be a JSON object")
    return raw


def iter_images(folder: Path) -> list[Path]:
    exts = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}
    return sorted([p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in exts])


def run_batch_upload(
    api_base: str,
    folder: Path,
    default_lat: float | None,
    default_lon: float | None,
    coords_map: dict[str, dict[str, float]],
) -> dict[str, Any]:
    files_payload = []
    opened_files = []

    try:
        for image_path in iter_images(folder):
            handle = image_path.open("rb")
            opened_files.append(handle)
            files_payload.append(("files", (image_path.name, handle, "image/jpeg")))

        data: dict[str, str] = {}
        if default_lat is not None:
            data["latitude"] = str(default_lat)
        if default_lon is not None:
            data["longitude"] = str(default_lon)
        if coords_map:
            data["coordinates_json"] = json.dumps(coords_map)

        response = requests.post(f"{api_base.rstrip('/')}/upload-drone-batch", files=files_payload, data=data, timeout=600)
        response.raise_for_status()
        return response.json()
    finally:
        for handle in opened_files:
            handle.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Upload a folder of drone images for batch payload generation")
    parser.add_argument("--api", default="http://127.0.0.1:8000", help="Base URL of FastAPI server")
    parser.add_argument("--folder", required=True, help="Folder containing field images")
    parser.add_argument("--latitude", type=float, default=None, help="Default latitude")
    parser.add_argument("--longitude", type=float, default=None, help="Default longitude")
    parser.add_argument(
        "--coords-json",
        default=None,
        help="Optional JSON file mapping image filename -> {latitude, longitude}",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    folder = Path(args.folder).expanduser().resolve()
    if not folder.exists() or not folder.is_dir():
        raise FileNotFoundError(f"Folder not found: {folder}")

    coords_path = Path(args.coords_json).expanduser().resolve() if args.coords_json else None
    coords_map = load_coords_map(coords_path)

    result = run_batch_upload(
        api_base=args.api,
        folder=folder,
        default_lat=args.latitude,
        default_lon=args.longitude,
        coords_map=coords_map,
    )

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
