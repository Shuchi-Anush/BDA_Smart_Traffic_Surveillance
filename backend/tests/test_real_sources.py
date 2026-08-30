from backend.data_pipeline import (
    list_data_sources,
    summarize_video_data,
    summarize_vehicle_data,
    summarize_signal_data,
    summarize_incidents,
)


def test_list_data_sources_has_four_real_sources():
    sources = list_data_sources()
    assert len(sources) == 4
    names = {item["name"] for item in sources}
    assert {"Smart traffic management dataset", "IoT traffic dataset", "Kolkata intersection signal dataset", "DLR surveillance video"}.issubset(names)


def test_vehicle_summary_is_based_on_real_structured_fields():
    summary = summarize_vehicle_data()
    assert summary["total_vehicles"] > 0
    assert summary["cars"] > 0
    assert summary["trucks"] > 0
    assert summary["bikes"] > 0


def test_incident_summary_and_signal_summary_are_real():
    incident_summary = summarize_incidents()
    signal_summary = summarize_signal_data()
    assert "total_incidents" in incident_summary
    assert signal_summary["phase_count"] >= 1
    assert signal_summary["signal_files"] >= 1


def test_video_summary_run_on_real_mp4_baseline():
    summary = summarize_video_data()
    assert summary["status"] in {"baseline", "missing"}
    assert summary["video_file"] == "DLR_UT_120230_120300.mp4"
    assert summary["frame_count"] > 0
    assert summary["fps"] > 0
