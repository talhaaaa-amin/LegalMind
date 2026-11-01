import os
from pathlib import Path

from dotenv import load_dotenv

SERVICE_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(SERVICE_ROOT / ".env")


def _path_from_env(name: str, default: str) -> Path:
    value = os.getenv(name, default)
    path = Path(value)
    return path if path.is_absolute() else (SERVICE_ROOT / path).resolve()


PORT = int(os.getenv("PORT", "8000"))
STORAGE_DIR = _path_from_env("STORAGE_DIR", "../../apps/api/storage/private")
SHARED_DB_PATH = _path_from_env("SHARED_DB_PATH", "../../apps/api/storage/db.json")
