from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.data_pipeline import (
    detect_anomalies,
    generate_report_document,
    list_data_sources,
    load_traffic_dataset,
    raw_data_root,
    save_report_to_minio,
    summarize_incidents,
    summarize_map_data,
    summarize_signal_data,
    summarize_traffic_data,
    summarize_vehicle_data,
    summarize_video_data,
)
from backend.storage import StorageService, ensure_required_project_buckets


def resolve_dataset_path() -> Path:
    base_path = Path(__file__).resolve()
    for parent in base_path.parents:
        candidate = parent / "data" / "raw" / "smart_traffic_management_dataset.csv"
        if candidate.exists():
            return candidate
    return base_path.parents[2] / "data" / "raw" / "smart_traffic_management_dataset.csv"


storage_service = StorageService(
    endpoint=settings.minio_endpoint,
    access_key=settings.minio_access_key,
    secret_key=settings.minio_secret_key,
    secure=settings.minio_secure,
    bucket_name=settings.minio_bucket,
)

DATASET_PATH = resolve_dataset_path()


def ingest_available_sources() -> dict[str, Any]:
    raw_root = raw_data_root()
    expected = [
        raw_root / "smart_traffic_management_dataset.csv",
        raw_root / "iot_edge_computing_public_management.csv",
    ]
    zip_candidates = sorted(raw_root.rglob("*.zip"), key=lambda p: p.name.lower())
    if zip_candidates:
        expected.append(zip_candidates[0])
    video_candidates = sorted(raw_root.rglob("*.mp4"), key=lambda p: p.name.lower())
    if video_candidates:
        expected.append(video_candidates[0])

    ingested = []
    for path in expected:
        if not path.exists():
            continue
        object_name = f"raw/{path.name}"
        if storage_service.object_exists(object_name):
            ingested.append({"file": path.name, "object": object_name, "status": "already_present"})
            continue
        ok = storage_service.upload_file(object_name, path)
        ingested.append({"file": path.name, "object": object_name, "status": "uploaded" if ok else "failed"})
    return {"ingested": ingested, "count": len(ingested)}


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="Smart Traffic Surveillance API for ingestion, analytics, and dashboard services.",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    origin_list = [origin.strip() for origin in settings.allowed_origins.split(",") if origin.strip()]
    if settings.frontend_url not in origin_list:
        origin_list.append(settings.frontend_url)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/")
    async def root() -> dict[str, Any]:
        return {
            "service": settings.app_name,
            "environment": settings.app_env,
            "status": "ok",
            "docs": "/docs",
        }

    @app.get("/health")
    async def health() -> dict[str, Any]:
        minio_status = storage_service.health_check()
        return {
            "status": "ok" if minio_status["status"] == "ok" else "degraded",
            "service": settings.app_name,
            "environment": settings.app_env,
            "minio": minio_status,
        }

    @app.get("/ready")
    async def ready() -> dict[str, Any]:
        minio_status = storage_service.health_check()
        bucket_ready = storage_service.ensure_bucket()
        required_buckets = ensure_required_project_buckets(storage_service)
        ingestion = ingest_available_sources() if bucket_ready else {"ingested": [], "count": 0}
        return {
            "status": "ok" if minio_status["status"] == "ok" and bucket_ready else "degraded",
            "service": settings.app_name,
            "environment": settings.app_env,
            "minio": minio_status,
            "bucket_ready": bucket_ready,
            "required_buckets": required_buckets,
            "ingestion": ingestion,
        }

    @app.get(f"{settings.api_v1_prefix}/system/health")
    async def system_health() -> dict[str, Any]:
        return await health()

    @app.get(f"{settings.api_v1_prefix}/datasets")
    async def datasets() -> dict[str, Any]:
        files = [
            "smart_traffic_management_dataset.csv",
            "iot_edge_computing_public_management.csv",
            "Kolkata_Data_PMC_paper_TrafficCountEstimationUsingCrowdSourcedTrajectory-v0.1.zip",
            "DLR_UT_120230_120300.mp4",
        ]
        raw_root = raw_data_root()
        return {"datasets": files, "available": [file for file in files if (raw_root / file).exists()]}

    @app.get(f"{settings.api_v1_prefix}/data-sources")
    async def data_sources() -> dict[str, Any]:
        bucket_ready = storage_service.ensure_bucket()
        if bucket_ready:
            ingest_available_sources()
        sources = list_data_sources()
        return {"count": len(sources), "sources": sources}

    @app.get(f"{settings.api_v1_prefix}/storage/buckets")
    async def storage_buckets() -> dict[str, Any]:
        required_result = ensure_required_project_buckets(storage_service)
        buckets = storage_service.list_buckets()
        return {
            "count": len(buckets),
            "buckets": buckets,
            "required": ["cctv", "vehicle-images", "traffic-sensors", "gps-logs", "incident-reports"],
            "bootstrap": required_result,
        }

    @app.get(f"{settings.api_v1_prefix}/storage/objects")
    async def storage_objects(prefix: str = "", bucket: str | None = None) -> dict[str, Any]:
        target_bucket = bucket or settings.minio_bucket
        objects = storage_service.list_objects(prefix=prefix, bucket_name=target_bucket)
        return {
            "bucket": target_bucket,
            "prefix": prefix,
            "count": len(objects),
            "objects": objects,
        }

    @app.get(f"{settings.api_v1_prefix}/storage/object")
    async def storage_object(key: str | None = None, bucket: str | None = None) -> dict[str, Any]:
        if not key:
            return {"status": "error", "message": "A MinIO object key is required."}
        details = storage_service.get_object_metadata(key, bucket_name=bucket)
        return details

    @app.get(f"{settings.api_v1_prefix}/storage/retrieval")
    async def storage_retrieval(key: str | None = None, bucket: str | None = None) -> dict[str, Any]:
        if not key:
            return {"status": "error", "message": "A MinIO object key is required."}
        target_bucket = bucket or settings.minio_bucket
        details = storage_service.get_object(key, bucket_name=target_bucket)
        if details["status"] == "missing":
            return details
        return details

    @app.get(f"{settings.api_v1_prefix}/analytics/summary")
    async def analytics_summary() -> dict[str, Any]:
        df = load_traffic_dataset(DATASET_PATH)
        summary = summarize_traffic_data(df)
        return {
            "dataset": str(DATASET_PATH.name),
            "row_count": summary["row_count"],
            "avg_traffic_volume": round(summary["avg_traffic_volume"], 2),
            "avg_vehicle_speed": round(summary["avg_vehicle_speed"], 2),
            "locations": summary["locations"],
            "weather_conditions": summary["weather_conditions"],
            "status": "ok",
        }

    @app.get(f"{settings.api_v1_prefix}/analytics/trend")
    async def analytics_trend() -> dict[str, Any]:
        df = load_traffic_dataset(DATASET_PATH)
        if "timestamp" not in df.columns:
            return {"dataset": str(DATASET_PATH.name), "points": []}
        hourly = df.assign(hour=pd.to_datetime(df["timestamp"]).dt.hour).groupby("hour")["traffic_volume"].mean().to_dict()
        return {"dataset": str(DATASET_PATH.name), "points": [{"hour": str(key), "traffic_volume": round(float(value), 2)} for key, value in sorted(hourly.items())]}

    @app.get(f"{settings.api_v1_prefix}/analytics/anomalies")
    async def analytics_anomalies() -> dict[str, Any]:
        df = load_traffic_dataset(DATASET_PATH)
        return {
            "dataset": str(DATASET_PATH.name),
            **detect_anomalies(df),
        }

    @app.get(f"{settings.api_v1_prefix}/vehicles")
    async def vehicles() -> dict[str, Any]:
        return summarize_vehicle_data()

    @app.get(f"{settings.api_v1_prefix}/incidents")
    async def incidents() -> dict[str, Any]:
        return summarize_incidents()

    @app.get(f"{settings.api_v1_prefix}/signals")
    async def signals() -> dict[str, Any]:
        return summarize_signal_data()

    @app.get(f"{settings.api_v1_prefix}/map")
    async def map_data() -> dict[str, Any]:
        return summarize_map_data()

    @app.get(f"{settings.api_v1_prefix}/video")
    async def video_data() -> dict[str, Any]:
        return summarize_video_data()

    @app.get(f"{settings.api_v1_prefix}/reports")
    async def reports() -> dict[str, Any]:
        report = generate_report_document()
        storage_result = save_report_to_minio(storage_service)
        return {"current": report, "storage": storage_result}

    @app.get(f"{settings.api_v1_prefix}/analytics")
    async def analytics_overview() -> dict[str, Any]:
        df = load_traffic_dataset(DATASET_PATH)
        summary = summarize_traffic_data(df)
        anomalies = detect_anomalies(df)
        vehicles_summary = summarize_vehicle_data()
        incidents_summary = summarize_incidents()
        signal_summary = summarize_signal_data()
        video_summary = summarize_video_data()
        return {
            "traffic": summary,
            "anomalies": anomalies,
            "vehicles": vehicles_summary,
            "incidents": incidents_summary,
            "signals": signal_summary,
            "video": video_summary,
        }

    return app


app = create_app()


def main() -> None:
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=settings.debug,
    )


if __name__ == "__main__":
    main()
