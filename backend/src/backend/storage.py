from __future__ import annotations

import io
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import pandas as pd
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

    def list_buckets(self) -> list[str]:
        try:
            return [bucket.name for bucket in self.client.list_buckets()]
        except Exception:
            return []

    def bucket_exists(self, bucket_name: str | None = None) -> bool:
        target_bucket = bucket_name or self.bucket_name
        try:
            return self.client.bucket_exists(target_bucket)
        except Exception:
            return False

    def ensure_bucket(self, bucket_name: str | None = None) -> bool:
        target_bucket = bucket_name or self.bucket_name
        try:
            if not self.bucket_exists(target_bucket):
                self.client.make_bucket(target_bucket, location="us-east-1")
            return True
        except Exception:
            return False

    def object_exists(self, object_name: str, bucket_name: str | None = None) -> bool:
        target_bucket = bucket_name or self.bucket_name
        try:
            self.client.stat_object(target_bucket, object_name)
            return True
        except Exception:
            return False

    def upload_bytes(
        self,
        object_name: str,
        data: bytes,
        content_type: str = "application/octet-stream",
        bucket_name: str | None = None,
        metadata: dict[str, str] | None = None,
    ) -> bool:
        target_bucket = bucket_name or self.bucket_name
        try:
            self.ensure_bucket(target_bucket)
            self.client.put_object(
                target_bucket,
                object_name,
                io.BytesIO(data),
                length=len(data),
                content_type=content_type,
                metadata=metadata or {},
            )
            return True
        except Exception:
            return False

    def upload_file(
        self,
        object_name: str,
        file_path: str | Path,
        content_type: str | None = None,
        bucket_name: str | None = None,
        metadata: dict[str, str] | None = None,
    ) -> bool:
        try:
            target_bucket = bucket_name or self.bucket_name
            self.ensure_bucket(target_bucket)
            path = Path(file_path)
            if not path.exists():
                return False
            mime_type = content_type or "application/octet-stream"
            self.client.fput_object(
                target_bucket,
                object_name,
                str(path),
                content_type=mime_type,
                metadata=metadata or {},
            )
            return True
        except Exception:
            return False

    def list_prefix(self, prefix: str = "", bucket_name: str | None = None) -> list[str]:
        target_bucket = bucket_name or self.bucket_name
        try:
            self.ensure_bucket(target_bucket)
            return [obj.object_name for obj in self.client.list_objects(target_bucket, prefix=prefix, recursive=True)]
        except Exception:
            return []

    def list_objects(self, prefix: str = "", bucket_name: str | None = None) -> list[dict[str, Any]]:
        target_bucket = bucket_name or self.bucket_name
        try:
            if not self.bucket_exists(target_bucket):
                return []
            objects: list[dict[str, Any]] = []
            for obj in self.client.list_objects(target_bucket, prefix=prefix, recursive=True):
                objects.append({
                    "key": obj.object_name,
                    "size": obj.size,
                    "last_modified": getattr(obj, "last_modified", None).isoformat() if getattr(obj, "last_modified", None) is not None else None,
                    "etag": getattr(obj, "etag", None),
                })
            return objects
        except Exception:
            return []

    def get_object_metadata(self, object_name: str, bucket_name: str | None = None) -> dict[str, Any]:
        target_bucket = bucket_name or self.bucket_name
        if not self.bucket_exists(target_bucket):
            return {
                "status": "missing",
                "key": object_name,
                "bucket": target_bucket,
                "error": "bucket does not exist",
            }
        try:
            obj = self.client.stat_object(target_bucket, object_name)
            object_meta = getattr(obj, "metadata", {}) or {}
            return {
                "status": "available",
                "key": object_name,
                "bucket": target_bucket,
                "size": obj.size,
                "etag": obj.etag,
                "last_modified": obj.last_modified.isoformat() if getattr(obj, "last_modified", None) is not None else None,
                "metadata": dict(object_meta),
            }
        except Exception as exc:
            return {
                "status": "missing",
                "key": object_name,
                "bucket": target_bucket,
                "error": str(exc),
            }

    def get_object(self, object_name: str, bucket_name: str | None = None) -> dict[str, Any]:
        target_bucket = bucket_name or self.bucket_name
        if not self.bucket_exists(target_bucket):
            return {
                "status": "missing",
                "key": object_name,
                "bucket": target_bucket,
                "error": "bucket does not exist",
            }
        try:
            obj = self.client.get_object(target_bucket, object_name)
            data = obj.read()
            response_headers = getattr(obj, "headers", {}) or {}
            metadata = getattr(obj, "metadata", {}) or {}
            return {
                "status": "available",
                "key": object_name,
                "bucket": target_bucket,
                "size": len(data),
                "content_type": response_headers.get("Content-Type", "application/octet-stream"),
                "preview": data[:600].decode("utf-8", errors="replace"),
                "metadata": dict(metadata),
            }
        except Exception as exc:
            return {
                "status": "missing",
                "key": object_name,
                "bucket": target_bucket,
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


REQUIRED_MINIO_BUCKETS = [
    "cctv",
    "vehicle-images",
    "traffic-sensors",
    "gps-logs",
    "incident-reports",
]


def ensure_required_project_buckets(storage_service: StorageService) -> dict[str, Any]:
    results: dict[str, Any] = {}

    for bucket_name in REQUIRED_MINIO_BUCKETS:
        exists = storage_service.ensure_bucket(bucket_name)
        results[bucket_name] = {"bucket": bucket_name, "exists": exists}

    raw_root = Path(__file__).resolve().parents[2] / "data" / "raw"
    if not raw_root.exists():
        raw_root = Path(__file__).resolve().parents[3] / "data" / "raw"

    if raw_root.exists():
        video_path = next((p for p in raw_root.rglob("*.mp4") if "DLR_UT_120230_120300" in p.name), None)
        vehicle_path = next((p for p in (Path(__file__).resolve().parents[2] / "data" / "derived" / "vehicle-images").rglob("*.jpg")), None)
        if vehicle_path is None:
            vehicle_path = next((p for p in (Path(__file__).resolve().parents[2] / "data" / "derived" / "vehicle-images").rglob("*.png")), None)
        sensor_path = next((p for p in raw_root.rglob("*.csv") if "Processed_Count_and_timining_data" in p.name), None)
        gps_path = next((p for p in raw_root.rglob("*.txt") if "GPS" in p.name or "LFdata" in str(p)), None)

        if video_path and not storage_service.object_exists("junction-01/DLR_UT_120230_120300.mp4", "cctv"):
            storage_service.upload_file(
                "junction-01/DLR_UT_120230_120300.mp4",
                video_path,
                content_type="video/mp4",
                bucket_name="cctv",
                metadata={
                    "camera-id": "CAM-01",
                    "junction-name": "junction-01",
                    "timestamp": "2024-01-01T00:00:00Z",
                    "traffic-density": "medium",
                },
            )
            results["cctv"]["video_object"] = "junction-01/DLR_UT_120230_120300.mp4"

        if vehicle_path and not storage_service.object_exists("representative/vehicle-01.jpg", "vehicle-images"):
            storage_service.upload_file(
                "representative/vehicle-01.jpg",
                vehicle_path,
                content_type="image/jpeg",
                bucket_name="vehicle-images",
                metadata={
                    "camera-id": "CAM-01",
                    "junction-name": "junction-01",
                    "vehicle-number": "DEMO-VEHICLE-01",
                    "timestamp": "2024-01-01T00:05:00Z",
                    "vehicle-type": "car",
                    "speed": "58.3",
                    "traffic-density": "medium",
                },
            )
            results["vehicle-images"]["vehicle_object"] = "representative/vehicle-01.jpg"

        sensor_csv_path = raw_root / "smart_traffic_management_dataset.csv"
        if sensor_csv_path.exists():
            sensor_payload = sensor_csv_path.read_bytes()[:20000]
            if not storage_service.object_exists("sensor-readings/smart_traffic_management_dataset.csv", "traffic-sensors"):
                storage_service.upload_bytes(
                    "sensor-readings/smart_traffic_management_dataset.csv",
                    sensor_payload,
                    content_type="text/csv",
                    bucket_name="traffic-sensors",
                    metadata={
                        "camera-id": "CAM-01",
                        "junction-name": "junction-01",
                        "timestamp": "2024-01-01T00:00:00Z",
                        "vehicle-type": "mixed",
                        "traffic-density": "medium",
                    },
                )
                results["traffic-sensors"]["sensor_object"] = "sensor-readings/smart_traffic_management_dataset.csv"
        elif sensor_path and not storage_service.object_exists(f"signal-readings/{sensor_path.name}", "traffic-sensors"):
            storage_service.upload_file(
                f"signal-readings/{sensor_path.name}",
                sensor_path,
                content_type="text/csv",
                bucket_name="traffic-sensors",
                metadata={
                    "camera-id": "CAM-01",
                    "junction-name": "junction-01",
                    "timestamp": "2024-01-01T00:00:00Z",
                    "traffic-density": "medium",
                },
            )
            results["traffic-sensors"]["sensor_object"] = f"signal-readings/{sensor_path.name}"

        if gps_path and not storage_service.object_exists(f"kolkata/{gps_path.name}", "gps-logs"):
            storage_service.upload_file(
                f"kolkata/{gps_path.name}",
                gps_path,
                content_type="text/plain",
                bucket_name="gps-logs",
                metadata={
                    "junction-name": "kolkata-leader-follower",
                    "timestamp": "2022-01-08T11:48:48Z",
                    "traffic-density": "medium",
                    "source": "kolkata-trajectory-sample",
                },
            )
            results["gps-logs"]["gps_object"] = f"kolkata/{gps_path.name}"

        violation_report = raw_root / "smart_traffic_management_dataset.csv"
        if violation_report.exists():
            df = pd.read_csv(violation_report)
            violation_rows = df[df["avg_vehicle_speed"] > 55].head(5)
            payload = {
                "report_type": "speed_violations",
                "generated_at": "2026-08-31T00:00:00Z",
                "violations": [
                    {
                        "timestamp": str(row["timestamp"]),
                        "location_id": int(row["location_id"]),
                        "vehicle_number": f"DEMO-VEHICLE-{int(index) + 1:02d}",
                        "vehicle_type": "car" if row.get("vehicle_count_cars", 0) > 0 else "mixed",
                        "speed_kmh": float(row["avg_vehicle_speed"]),
                        "speed_limit_kmh": 50.0,
                        "violation_status": "violation" if float(row["avg_vehicle_speed"]) > 50 else "review",
                        "severity": "high" if float(row["avg_vehicle_speed"]) > 65 else "medium",
                    }
                    for index, row in violation_rows.iterrows()
                ],
            }
            if not storage_service.object_exists("speed-violations/speed-violations-demo.json", "incident-reports"):
                storage_service.upload_bytes(
                    "speed-violations/speed-violations-demo.json",
                    json.dumps(payload, indent=2).encode("utf-8"),
                    content_type="application/json",
                    bucket_name="incident-reports",
                    metadata={
                        "camera-id": "CAM-01",
                        "junction-name": "junction-01",
                        "vehicle-number": "DEMO-VEHICLE-01",
                        "timestamp": "2024-01-01T00:00:00Z",
                        "vehicle-type": "car",
                        "speed": "58.3",
                        "traffic-density": "medium",
                    },
                )
                results["incident-reports"]["incident_object"] = "speed-violations/speed-violations-demo.json"

    return results
