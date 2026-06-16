import os
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")


async def save_image(file: UploadFile, folder: str) -> str:
    extension = Path(file.filename or "").suffix.lower() or ".jpg"
    safe_folder = folder.strip("/\\") or "images"
    target_dir = Path(UPLOAD_DIR) / safe_folder
    target_dir.mkdir(parents=True, exist_ok=True)

    file_path = target_dir / f"{uuid4().hex}{extension}"
    file_path.write_bytes(await file.read())
    return str(file_path).replace("\\", "/")


def get_image_url(file_path: str) -> str:
    normalized = file_path.replace("\\", "/")
    upload_root = UPLOAD_DIR.replace("\\", "/").rstrip("/")
    if normalized.startswith(upload_root):
        normalized = normalized[len(upload_root):].lstrip("/")
    return f"/uploads/{normalized}"


def delete_image(file_path: str) -> bool:
    path = Path(file_path)
    if not path.exists() or not path.is_file():
        return False
    path.unlink()
    return True
