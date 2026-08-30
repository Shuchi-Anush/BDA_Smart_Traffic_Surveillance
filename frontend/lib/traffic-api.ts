import type {
  ApiAnomalies,
  ApiSummary,
  DataSourceResponse,
  DatasetResponse,
  HealthResponse,
  IncidentSummary,
  MapSummary,
  ReadyResponse,
  ReportResponse,
  SignalSummary,
  VehicleSummary,
  VideoSummary,
} from "@/types/traffic";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Request failed for ${path}: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchSummary(): Promise<ApiSummary> {
  return fetchJson<ApiSummary>("/api/v1/analytics/summary");
}

export async function fetchAnomalies(): Promise<ApiAnomalies> {
  return fetchJson<ApiAnomalies>("/api/v1/analytics/anomalies");
}

export async function fetchHealth(): Promise<HealthResponse> {
  return fetchJson<HealthResponse>("/health");
}

export async function fetchReady(): Promise<ReadyResponse> {
  return fetchJson<ReadyResponse>("/ready");
}

export async function fetchDatasets(): Promise<DatasetResponse> {
  return fetchJson<DatasetResponse>("/api/v1/datasets");
}

export async function fetchDataSources(): Promise<DataSourceResponse> {
  return fetchJson<DataSourceResponse>("/api/v1/data-sources");
}

export async function fetchVehicles(): Promise<VehicleSummary> {
  return fetchJson<VehicleSummary>("/api/v1/vehicles");
}

export async function fetchIncidents(): Promise<IncidentSummary> {
  return fetchJson<IncidentSummary>("/api/v1/incidents");
}

export async function fetchSignals(): Promise<SignalSummary> {
  return fetchJson<SignalSummary>("/api/v1/signals");
}

export async function fetchMapData(): Promise<MapSummary> {
  return fetchJson<MapSummary>("/api/v1/map");
}

export async function fetchVideoData(): Promise<VideoSummary> {
  return fetchJson<VideoSummary>("/api/v1/video");
}

export async function fetchReports(): Promise<ReportResponse> {
  return fetchJson<ReportResponse>("/api/v1/reports");
}
