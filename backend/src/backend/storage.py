from __future__ import annotations

import io
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from minio import Minio


@dataclass
class StorageService:
    endpoint: str
    access_key: str
    secret_key: str
    secure: bool
    bucket_name: str
    client: Minio = field(init=False)

    def __post_init__(self) -> None:
        self.client = Minio(
            self.endpoint,
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=self.secure,
        )

    def ensure_bucket(self) -> bool:
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name, location="us-east-1")
            return True
        except Exception:
            return False

    def object_exists(self, object_name: str) -> bool:
        try:
            self.client.stat_object(self.bucket_name, object_name)
            return True
        except Exception:
            return False

    def upload_bytes(self, object_name: str, data: bytes, content_type: str = "application/octet-stream") -> bool:
        try:
            self.ensure_bucket()
            self.client.put_object(
                self.bucket_name,
                object_name,
                io.BytesIO(data),
                length=len(data),
                content_type=content_type,
            )
            return True
        except Exception:
            return False

    def upload_file(self, object_name: str, file_path: str | Path, content_type: str | None = None) -> bool:
        try:
            self.ensure_bucket()
            path = Path(file_path)
            if not path.exists():
                return False
            mime_type = content_type or "application/octet-stream"
            self.client.fput_object(
                self.bucket_name,
                object_name,
                str(path),
                content_type=mime_type,
            )
            return True
        except Exception:
            return False

    def list_prefix(self, prefix: str = "") -> list[str]:
        try:
            self.ensure_bucket()
            return [obj.object_name for obj in self.client.list_objects(self.bucket_name, prefix=prefix, recursive=True)]
        except Exception:
            return []

    def list_objects(self, prefix: str = "") -> list[dict[str, Any]]:
        try:
            self.ensure_bucket()
            objects: list[dict[str, Any]] = []
            for obj in self.client.list_objects(self.bucket_name, prefix=prefix, recursive=True):
                objects.append({
                    "key": obj.object_name,
                    "size": obj.size,
                    "last_modified": getattr(obj, "last_modified", None).isoformat() if getattr(obj, "last_modified", None) is not None else None,
                    "etag": getattr(obj, "etag", None),
                })
            return objects
        except Exception:
            return []

    def get_object_metadata(self, object_name: str) -> dict[str, Any]:
        try:
            obj = self.client.stat_object(self.bucket_name, object_name)
            return {
                "status": "available",
                "key": object_name,
                "bucket": self.bucket_name,
                "size": obj.size,
                "etag": obj.etag,
                "last_modified": obj.last_modified.isoformat() if getattr(obj, "last_modified", None) is not None else None,
            }
        except Exception as exc:
            return {
                "status": "missing",
                "key": object_name,
                "bucket": self.bucket_name,
                "error": str(exc),
            }

    def get_object(self, object_name: str) -> dict[str, Any]:
        try:
            obj = self.client.get_object(self.bucket_name, object_name)
            data = obj.read()
            return {
                "status": "available",
                "key": object_name,
                "bucket": self.bucket_name,
                "size": len(data),
                "content_type": obj.headers.get("Content-Type", "application/octet-stream") if hasattr(obj, "headers") else "application/octet-stream",
                "preview": data[:600].decode("utf-8", errors="replace"),
            }
        except Exception as exc:
            return {
                "status": "missing",
                "key": object_name,
                "bucket": self.bucket_name,
                "error": str(exc),
            }

    def health_check(self) -> dict[str, Any]:
        try:
            self.client.list_buckets()
            return {
                "status": "ok",
                "endpoint": self.endpoint,
                "bucket": self.bucket_name,
                "secure": self.secure,
            }
        except Exception as exc:  # pragma: no cover - runtime dependency check
            return {
                "status": "error",
                "endpoint": self.endpoint,
                "bucket": self.bucket_name,
                "secure": self.secure,
                "error": str(exc),
            }

    def is_ready(self) -> bool:
        return self.health_check().get("status") == "ok" and self.ensure_bucket()
