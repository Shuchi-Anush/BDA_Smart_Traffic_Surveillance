from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class Provenance(BaseModel):
    source: str | None = None
    source_file: str | None = None
    timestamp: datetime | None = None
    schema_version: str = "1.0"
    pipeline_version: str = "1.0"
    processing_timestamp: datetime | None = None


class DataSource(BaseModel):
    name: str
    source_type: str
    path: str | None = None
    status: str = "unknown"
    provenance: Provenance = Field(default_factory=Provenance)


class Location(BaseModel):
    location_id: str | int | None = None
    latitude: float | None = None
    longitude: float | None = None
    junction_name: str | None = None
    source: str | None = None
    provenance: Provenance = Field(default_factory=Provenance)


class TrafficEvent(BaseModel):
    event_id: str | None = None
    location_id: str | int | None = None
    timestamp: datetime | None = None
    traffic_volume: float | None = None
    avg_vehicle_speed: float | None = None
    weather_condition: str | None = None
    source: str | None = None
    provenance: Provenance = Field(default_factory=Provenance)


class VehicleObservation(BaseModel):
    vehicle_id: str | None = None
    vehicle_type: str | None = None
    speed_kmh: float | None = None
    location_id: str | int | None = None
    timestamp: datetime | None = None
    source: str | None = None
    provenance: Provenance = Field(default_factory=Provenance)


class TrajectoryPoint(BaseModel):
    trajectory_id: str | None = None
    timestamp: datetime | None = None
    latitude: float | None = None
    longitude: float | None = None
    speed_kmh: float | None = None
    source: str | None = None
    provenance: Provenance = Field(default_factory=Provenance)


class SignalPhase(BaseModel):
    phase_id: str | None = None
    junction_id: str | int | None = None
    phase_name: str | None = None
    green_duration_seconds: int | None = None
    red_duration_seconds: int | None = None
    cycle_length_seconds: int | None = None
    source: str | None = None
    provenance: Provenance = Field(default_factory=Provenance)


class VehicleDetection(BaseModel):
    detection_id: str | None = None
    frame_index: int | None = None
    vehicle_type: str | None = None
    confidence: float | None = None
    bounding_box: dict[str, Any] | None = None
    source: str | None = None
    provenance: Provenance = Field(default_factory=Provenance)


class Incident(BaseModel):
    incident_id: str | None = None
    type: str | None = None
    severity: str | None = None
    timestamp: datetime | None = None
    location: str | int | None = None
    source: str | None = None
    description: str | None = None
    evidence_reference: str | None = None
    status: str = "open"
    provenance: Provenance = Field(default_factory=Provenance)


class Violation(BaseModel):
    violation_id: str | None = None
    vehicle_id: str | None = None
    violation_type: str | None = None
    observed_speed_kmh: float | None = None
    threshold_kmh: float | None = None
    timestamp: datetime | None = None
    source: str | None = None
    provenance: Provenance = Field(default_factory=Provenance)


class VideoFrame(BaseModel):
    frame_index: int | None = None
    source_video: str | None = None
    timestamp: datetime | None = None
    object_count: int | None = None
    annotation_path: str | None = None
    provenance: Provenance = Field(default_factory=Provenance)


class ObjectMetadata(BaseModel):
    object_key: str
    bucket: str = "traffic-data"
    content_type: str | None = None
    size_bytes: int | None = None
    source: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class Report(BaseModel):
    report_id: str | None = None
    report_type: str | None = None
    generated_at: datetime | None = None
    source_count: int | None = None
    summary: dict[str, Any] = Field(default_factory=dict)
    provenance: Provenance = Field(default_factory=Provenance)
