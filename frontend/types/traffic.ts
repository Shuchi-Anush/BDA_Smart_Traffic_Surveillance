export type ApiSummary = {
  dataset: string;
  row_count: number;
  avg_traffic_volume: number;
  avg_vehicle_speed: number;
  locations: number;
  weather_conditions: string[];
  status: string;
};

export type AnomalyRecord = Record<string, unknown>;

export type ApiAnomalies = {
  dataset: string;
  rows: number;
  max_traffic_volume: number;
  anomaly_threshold: number;
  anomalies: AnomalyRecord[];
};

export type MinioStatus = {
  status: string;
  endpoint: string;
  bucket: string;
  secure: boolean;
  error?: string;
};

export type HealthResponse = {
  status: string;
  service: string;
  environment: string;
  minio: MinioStatus;
};

export type ReadyResponse = HealthResponse & {
  bucket_ready: boolean;
};

export type DatasetResponse = {
  datasets: string[];
  available: string[];
};

export type DataSourceItem = {
  name: string;
  type: string;
  status: string;
  file: string;
  object: string;
  size_bytes: number;
  row_count: number;
  frame_count: number;
  storage_location: string;
  ingestion_status: string;
  last_processed: string;
  schema_summary: string[];
};

export type DataSourceResponse = {
  count: number;
  sources: DataSourceItem[];
};

export type VehicleSummary = {
  source: string;
  cars: number;
  trucks: number;
  bikes: number;
  total_vehicles: number;
  location_distribution: Record<string, number>;
  time_distribution: Record<string, number>;
  structured_count: boolean;
};

export type IncidentRecord = {
  source?: string;
  location_id?: string | number;
  location?: string;
  timestamp?: string;
  incident_type?: string;
  severity?: string;
  status?: string;
  confidence?: number;
};

export type IncidentSummary = {
  total_incidents: number;
  records: IncidentRecord[];
  incident_types: string[];
  source_count: number;
  has_current_window_incidents: boolean;
};

export type SignalSummary = {
  source: string;
  signal_files: number;
  phase_count: number;
  timing_records: number;
  phases: Record<string, number>;
  files: { file: string; rows: number }[];
  observed_states: string[];
};

export type MapSummary = {
  points: Array<{
    sensor_id?: string | number;
    latitude: number;
    longitude: number;
    event_type?: string;
    timestamp?: string;
  }>;
  location_count: number;
  status: string;
};

export type VideoSummary = {
  status: string;
  method: string;
  video_file: string;
  frame_count: number;
  fps: number;
  duration_seconds: number;
  sample_count: number;
  baseline_vehicle_count: number;
  processed_result: string;
};

export type ReportStorage = {
  status: string;
  artifact: string;
  report: Record<string, unknown>;
};

export type ReportResponse = {
  current: Record<string, unknown>;
  storage: ReportStorage;
};

export type AppStatus = "ONLINE" | "DEGRADED" | "OFFLINE" | "NOT CONFIGURED";
