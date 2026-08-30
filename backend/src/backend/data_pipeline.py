from __future__ import annotations

import json
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import cv2
import pandas as pd


def project_root() -> Path:
    base = Path(__file__).resolve()
    for parent in (base.parents):
        candidate = parent / "data" / "raw"
        if candidate.exists():
            return parent
    return base.parents[2] if len(base.parents) > 2 else base.parent


def raw_data_root() -> Path:
    root = project_root()
    return root / "data" / "raw"


def file_size_bytes(path: Path | str) -> int:
    try:
        return Path(path).stat().st_size
    except OSError:
        return 0


def load_traffic_dataset(file_path: str | Path) -> pd.DataFrame:
    df = pd.read_csv(file_path)
    return canonicalize_traffic_dataset(df)


def canonicalize_traffic_dataset(df: pd.DataFrame) -> pd.DataFrame:
    cleaned = df.copy()
    cleaned.columns = [str(column).strip().lower() for column in cleaned.columns]

    if "timestamp" in cleaned.columns:
        cleaned["timestamp"] = pd.to_datetime(cleaned["timestamp"], errors="coerce")

    if "location_id" in cleaned.columns:
        cleaned["location_id"] = pd.to_numeric(cleaned["location_id"], errors="coerce").astype("Int64")

    if "traffic_volume" in cleaned.columns:
        cleaned["traffic_volume"] = pd.to_numeric(cleaned["traffic_volume"], errors="coerce").astype(float)

    if "avg_vehicle_speed" in cleaned.columns:
        cleaned["avg_vehicle_speed"] = pd.to_numeric(cleaned["avg_vehicle_speed"], errors="coerce").astype(float)

    if "weather_condition" in cleaned.columns:
        cleaned["weather_condition"] = cleaned["weather_condition"].replace({"": pd.NA, None: pd.NA}).astype("string")

    for column in cleaned.columns:
        if column not in {"timestamp", "location_id", "traffic_volume", "avg_vehicle_speed", "weather_condition"}:
            cleaned[column] = cleaned[column].replace({"": pd.NA, None: pd.NA})

    cleaned = cleaned.dropna(subset=[column for column in ["timestamp", "location_id", "traffic_volume"] if column in cleaned.columns], how="all")
    return cleaned.reset_index(drop=True)


def validate_traffic_dataset(df: pd.DataFrame) -> dict[str, Any]:
    missing_values = {
        column: int(df[column].isna().sum())
        for column in df.columns
        if df[column].isna().sum() > 0
    }
    duplicates = int(df.duplicated(subset=["timestamp", "location_id"] if {"timestamp", "location_id"}.issubset(df.columns) else None).sum()) if not df.empty else 0

    return {
        "row_count": int(len(df)),
        "columns": list(df.columns),
        "missing_values": missing_values,
        "duplicate_rows": duplicates,
        "has_required_fields": {"timestamp": "timestamp" in df.columns, "location_id": "location_id" in df.columns, "traffic_volume": "traffic_volume" in df.columns},
    }


def summarize_traffic_data(df: pd.DataFrame) -> dict[str, Any]:
    summary = {
        "row_count": int(len(df)),
        "avg_traffic_volume": float(df["traffic_volume"].mean()) if "traffic_volume" in df.columns else 0.0,
        "avg_vehicle_speed": float(df["avg_vehicle_speed"].mean()) if "avg_vehicle_speed" in df.columns else 0.0,
        "locations": int(df["location_id"].nunique()) if "location_id" in df.columns else 0,
        "weather_conditions": sorted(df["weather_condition"].dropna().unique().tolist()) if "weather_condition" in df.columns else [],
    }
    return summary


def detect_anomalies(df: pd.DataFrame) -> dict[str, Any]:
    if df.empty:
        return {"rows": 0, "max_traffic_volume": 0.0, "anomaly_threshold": 0.0, "anomalies": []}

    traffic = df["traffic_volume"] if "traffic_volume" in df.columns else pd.Series([0.0] * len(df))
    q1 = traffic.quantile(0.25)
    q3 = traffic.quantile(0.75)
    iqr = q3 - q1
    upper_bound = q3 + 1.5 * iqr
    anomaly_mask = traffic > upper_bound

    return {
        "rows": int(anomaly_mask.sum()),
        "max_traffic_volume": float(traffic.max()),
        "anomaly_threshold": float(upper_bound),
        "anomalies": df.loc[anomaly_mask].to_dict(orient="records"),
    }


def _source_metadata_entry(name: str, source_type: str, path: Path | None, signature: dict[str, Any] | None = None) -> dict[str, Any]:
    actual_path = path if path is not None else None
    size = file_size_bytes(actual_path) if actual_path else 0
    schema = signature or {}
    return {
        "name": name,
        "type": source_type,
        "status": "available" if actual_path and actual_path.exists() else "missing",
        "file": actual_path.name if actual_path else "n/a",
        "object": f"raw/{actual_path.name}" if actual_path else "n/a",
        "size_bytes": size,
        "row_count": int(schema.get("row_count", 0)) if schema else 0,
        "frame_count": int(schema.get("frame_count", 0)) if schema else 0,
        "storage_location": f"minio://traffic-data/raw/{actual_path.name}" if actual_path else "n/a",
        "ingestion_status": "ready" if actual_path and actual_path.exists() else "missing",
        "last_processed": datetime.now(timezone.utc).isoformat(),
        "schema_summary": schema.get("schema", []) if schema else [],
    }


def _signal_csv_files() -> list[Path]:
    root = raw_data_root()
    candidates: list[Path] = []
    for match in root.rglob("*.csv"):
        if "Signal" in match.name or "signal" in match.name.lower() or "Traffic_Count" in match.parts:
            candidates.append(match)
    return sorted(set(candidates))


def list_data_sources() -> list[dict[str, Any]]:
    raw_root = raw_data_root()
    smart_path = raw_root / "smart_traffic_management_dataset.csv"
    iot_path = raw_root / "iot_edge_computing_public_management.csv"
    kolkata_zip = next((p for p in sorted(raw_root.rglob("*.zip")) if "kolkata" in p.as_posix().lower() or "trafficcount" in p.name.lower()), None)
    video_path = raw_root / "DLR_UT_120230_120300.mp4"

    smart_df = load_traffic_dataset(smart_path) if smart_path.exists() else pd.DataFrame()
    iot_df = pd.read_csv(iot_path) if iot_path.exists() else pd.DataFrame()
    signal_files = _signal_csv_files()
    signal_rows = 0
    signal_phase_values: set[str] = set()
    if signal_files:
        for signal_file in signal_files:
            try:
                signal_df = pd.read_csv(signal_file)
                signal_rows += len(signal_df)
                if "Phase" in signal_df.columns:
                    signal_phase_values.update(str(value).strip() for value in signal_df["Phase"].dropna().tolist())
            except Exception:
                continue

    video_capture = cv2.VideoCapture(str(video_path)) if video_path.exists() else None
    frame_count = int(video_capture.get(cv2.CAP_PROP_FRAME_COUNT)) if video_capture is not None else 0
    if video_capture is not None:
        video_capture.release()

    entries = [
        _source_metadata_entry(
            "Smart traffic management dataset",
            "CSV",
            smart_path,
            {"row_count": int(len(smart_df)), "schema": list(smart_df.columns) if not smart_df.empty else []},
        ),
        _source_metadata_entry(
            "IoT traffic dataset",
            "CSV",
            iot_path,
            {"row_count": int(len(iot_df)), "schema": list(iot_df.columns) if not iot_df.empty else []},
        ),
        _source_metadata_entry(
            "Kolkata intersection signal dataset",
            "ZIP + signal CSV",
            kolkata_zip,
            {"row_count": signal_rows, "frame_count": len(signal_files), "schema": sorted(signal_phase_values) or ["Phase", "Start", "Duration", "End"]},
        ),
        _source_metadata_entry(
            "DLR surveillance video",
            "MP4",
            video_path,
            {"frame_count": frame_count, "schema": ["video_stream", "fps", "frame_count", "baseline_vehicle_count"]},
        ),
    ]
    return entries


def summarize_vehicle_data() -> dict[str, Any]:
    smart_path = raw_data_root() / "smart_traffic_management_dataset.csv"
    if not smart_path.exists():
        return {"source": "smart_traffic_management_dataset.csv", "cars": 0, "trucks": 0, "bikes": 0, "total_vehicles": 0, "location_distribution": {}, "time_distribution": {}, "structured_count": True}

    df = load_traffic_dataset(smart_path)
    cars = int(df["vehicle_count_cars"].sum()) if "vehicle_count_cars" in df.columns else 0
    trucks = int(df["vehicle_count_trucks"].sum()) if "vehicle_count_trucks" in df.columns else 0
    bikes = int(df["vehicle_count_bikes"].sum()) if "vehicle_count_bikes" in df.columns else 0
    total_vehicles = cars + trucks + bikes

    location_distribution = (
        df.groupby("location_id")["traffic_volume"].sum().astype(int).to_dict() if "location_id" in df.columns else {}
    )
    time_distribution = {}
    if "timestamp" in df.columns:
        time_distribution = df.assign(hour=pd.to_datetime(df["timestamp"]).dt.hour).groupby("hour").size().astype(int).to_dict()

    return {
        "source": smart_path.name,
        "cars": cars,
        "trucks": trucks,
        "bikes": bikes,
        "total_vehicles": total_vehicles,
        "location_distribution": {str(key): value for key, value in location_distribution.items()},
        "time_distribution": {str(key): value for key, value in time_distribution.items()},
        "structured_count": True,
    }


def summarize_incidents() -> dict[str, Any]:
    smart_path = raw_data_root() / "smart_traffic_management_dataset.csv"
    iot_path = raw_data_root() / "iot_edge_computing_public_management.csv"
    incident_rows = []

    if smart_path.exists():
        smart_df = load_traffic_dataset(smart_path)
        smart_incidents = smart_df[smart_df.get("accident_reported", 0) == 1]
        for row in smart_incidents.to_dict(orient="records"):
            incident_rows.append(
                {
                    "source": "smart_traffic_management_dataset.csv",
                    "location_id": row.get("location_id"),
                    "timestamp": row.get("timestamp"),
                    "incident_type": "accident_reported",
                    "severity": "high" if row.get("accident_reported") == 1 else "low",
                    "status": "reported",
                }
            )

    if iot_path.exists():
        iot_df = pd.read_csv(iot_path)
        iot_df = iot_df.rename(columns={"incident_report": "incident_report"})
        for row in iot_df[iot_df["incident_report"].notna()].to_dict(orient="records"):
            incident_rows.append(
                {
                    "source": "iot_edge_computing_public_management.csv",
                    "location": row.get("sensor_id"),
                    "timestamp": row.get("timestamp"),
                    "incident_type": row.get("event_type") or row.get("incident_report"),
                    "severity": "medium" if row.get("accident_hotspot") == 1 else "low",
                    "status": "reported",
                }
            )

    return {
        "total_incidents": len(incident_rows),
        "records": incident_rows[:50],
        "incident_types": sorted({item["incident_type"] for item in incident_rows if item.get("incident_type")}),
        "source_count": 2,
        "has_current_window_incidents": len(incident_rows) > 0,
    }


def summarize_signal_data() -> dict[str, Any]:
    signal_files = _signal_csv_files()
    records: list[dict[str, Any]] = []
    phase_counts: dict[str, int] = {}
    total_rows = 0
    for signal_file in signal_files:
        try:
            df = pd.read_csv(signal_file)
            total_rows += len(df)
            if "Phase" in df.columns:
                for phase in df["Phase"].dropna().astype(str):
                    phase_counts[phase] = phase_counts.get(phase, 0) + 1
            records.append({"file": signal_file.name, "rows": len(df)})
        except Exception:
            continue

    return {
        "source": "Kolkata intersection signal dataset",
        "signal_files": len(signal_files),
        "phase_count": len(phase_counts),
        "timing_records": total_rows,
        "phases": phase_counts,
        "files": records[:10],
        "observed_states": sorted(phase_counts.keys()),
    }


def summarize_map_data() -> dict[str, Any]:
    iot_path = raw_data_root() / "iot_edge_computing_public_management.csv"
    if not iot_path.exists():
        return {"points": [], "location_count": 0, "status": "unavailable"}

    df = pd.read_csv(iot_path)
    points = []
    for row in df[["sensor_id", "latitude", "longitude", "event_type", "timestamp"]].dropna(subset=["latitude", "longitude"]).to_dict(orient="records"):
        points.append({
            "sensor_id": row.get("sensor_id"),
            "latitude": float(row.get("latitude")),
            "longitude": float(row.get("longitude")),
            "event_type": row.get("event_type"),
            "timestamp": row.get("timestamp"),
        })
    return {
        "points": points[:25],
        "location_count": len({(p["latitude"], p["longitude"]) for p in points}),
        "status": "real-data",
    }


def summarize_video_data() -> dict[str, Any]:
    video_path = raw_data_root() / "DLR_UT_120230_120300.mp4"
    if not video_path.exists():
        return {"status": "missing", "frame_count": 0, "sample_count": 0, "baseline_vehicle_count": 0, "method": "none"}

    capture = cv2.VideoCapture(str(video_path))
    total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT)) if capture.isOpened() else 0
    fps = float(capture.get(cv2.CAP_PROP_FPS)) if capture.isOpened() else 0.0
    duration = round(total_frames / fps, 2) if fps else 0.0
    sample_interval = max(1, total_frames // 12)
    background_subtractor = cv2.createBackgroundSubtractorMOG2(history=500, varThreshold=25, detectShadows=False)
    sampled_count = 0
    detected_objects = 0
    sample_index = 0

    while capture.isOpened():
        ok, frame = capture.read()
        if not ok:
            break
        if sample_index % sample_interval == 0:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            gray = cv2.GaussianBlur(gray, (5, 5), 0)
            foreground = background_subtractor.apply(gray)
            foreground_mask = (foreground > 200).astype("uint8")
            num_labels, _, _, _ = cv2.connectedComponentsWithStats(foreground_mask, connectivity=8)
            detected_objects += max(0, num_labels - 1)
            sampled_count += 1
        sample_index += 1
    capture.release()

    baseline_vehicle_count = int(round(detected_objects / max(1, sampled_count))) if sampled_count else 0

    return {
        "status": "baseline",
        "method": "OpenCV background-subtraction baseline",
        "video_file": video_path.name,
        "frame_count": total_frames,
        "fps": fps,
        "duration_seconds": duration,
        "sample_count": sampled_count,
        "baseline_vehicle_count": baseline_vehicle_count,
        "processed_result": "baseline detection derived from sampled frames",
    }


def generate_report_document() -> dict[str, Any]:
    source_summary = list_data_sources()
    traffic_summary = summarize_traffic_data(load_traffic_dataset(raw_data_root() / "smart_traffic_management_dataset.csv"))
    vehicle_summary = summarize_vehicle_data()
    anomaly_summary = detect_anomalies(load_traffic_dataset(raw_data_root() / "smart_traffic_management_dataset.csv"))
    incident_summary = summarize_incidents()
    signal_summary = summarize_signal_data()
    video_summary = summarize_video_data()
    report = {
        "report_type": "traffic_operations",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_count": len(source_summary),
        "source_status": {item["name"]: item["status"] for item in source_summary},
        "traffic_summary": traffic_summary,
        "vehicle_summary": vehicle_summary,
        "anomalies": anomaly_summary,
        "incidents": incident_summary,
        "signals": signal_summary,
        "video": video_summary,
        "storage_status": {"bucket": "traffic-data", "prefixes": ["raw/", "curated/", "processed/", "artifacts/", "reports/"]},
    }
    return report


def save_report_to_minio(storage_service: Any) -> dict[str, Any]:
    payload = generate_report_document()
    report_name = f"reports/traffic-operations-report-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}.json"
    payload_bytes = json.dumps(payload, default=str, indent=2).encode("utf-8")
    ok = storage_service.upload_bytes(report_name, payload_bytes, content_type="application/json")
    return {"status": "generated" if ok else "failed", "artifact": report_name, "report": payload}
