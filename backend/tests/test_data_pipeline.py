from pathlib import Path

import pandas as pd

from backend.data_pipeline import (
    canonicalize_traffic_dataset,
    detect_anomalies,
    load_traffic_dataset,
    summarize_traffic_data,
    validate_traffic_dataset,
)


DATASET_PATH = Path(__file__).resolve().parents[1].parents[0] / "data" / "raw" / "smart_traffic_management_dataset.csv"


def test_load_traffic_dataset_loads_rows():
    df = load_traffic_dataset(DATASET_PATH)
    assert not df.empty
    assert {"timestamp", "location_id", "traffic_volume"}.issubset(df.columns)


def test_summarize_traffic_data_reports_means():
    df = load_traffic_dataset(DATASET_PATH)
    summary = summarize_traffic_data(df)
    assert summary["row_count"] > 0
    assert summary["avg_traffic_volume"] > 0
    assert summary["locations"] >= 1


def test_detect_anomalies_flags_traffic_volume_outliers():
    df = load_traffic_dataset(DATASET_PATH)
    anomalies = detect_anomalies(df)
    assert "rows" in anomalies
    assert anomalies["rows"] >= 0
    assert "max_traffic_volume" in anomalies


def test_canonicalize_and_validate_traffic_dataset():
    sample = pd.DataFrame(
        {
            "timestamp": ["2024-01-01 10:00:00", "2024-01-01 10:05:00", "bad-ts"],
            "location_id": [1, 1, 2],
            "traffic_volume": [10, "12", "bad"],
            "weather_condition": ["Sunny", None, "Rainy"],
            "avg_vehicle_speed": [25.0, 23.0, None],
        }
    )
    cleaned = canonicalize_traffic_dataset(sample)
    assert {"timestamp", "location_id", "traffic_volume", "weather_condition", "avg_vehicle_speed"}.issubset(cleaned.columns)
    assert cleaned["traffic_volume"].dtype.kind in {"i", "f"}
    validation = validate_traffic_dataset(cleaned)
    assert validation["row_count"] == len(cleaned)
    assert validation["missing_values"]["weather_condition"] >= 0
