"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertItem, ChartCard, EmptyState, ErrorState, LoadingState, MetricRow, PageContainer, SectionHeader, StatCard, StatusBadge } from "@/components/ui";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { fetchAnomalies, fetchHealth, fetchIncidents, fetchReady, fetchSummary, fetchVehicles } from "@/lib/traffic-api";
import type { ApiAnomalies, ApiSummary, HealthResponse, IncidentSummary, ReadyResponse, VehicleSummary } from "@/types/traffic";

export default function HomePage() {
  const [summary, setSummary] = useState<ApiSummary | null>(null);
  const [anomalies, setAnomalies] = useState<ApiAnomalies | null>(null);
  const [vehicles, setVehicles] = useState<VehicleSummary | null>(null);
  const [incidents, setIncidents] = useState<IncidentSummary | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [ready, setReady] = useState<ReadyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [summaryData, anomalyData, vehicleData, incidentData, healthData, readyData] = await Promise.all([
          fetchSummary(),
          fetchAnomalies(),
          fetchVehicles(),
          fetchIncidents(),
          fetchHealth(),
          fetchReady(),
        ]);

        if (!active) return;

        setSummary(summaryData);
        setAnomalies(anomalyData);
        setVehicles(vehicleData);
        setIncidents(incidentData);
        setHealth(healthData);
        setReady(readyData);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Unable to load operational data.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const statusTone = useMemo(() => {
    if (!ready || !health) return "neutral";
    if (ready.status === "ok" && health.status === "ok") return "ok";
    if (ready.status === "degraded" || health.status === "degraded") return "warn";
    return "error";
  }, [health, ready]);

  return (
    <DashboardShell title="Overview">
      <PageContainer>
        {loading ? <LoadingState message="Loading traffic operations overview…" /> : null}

        {!loading && error ? <ErrorState message={error} /> : null}

        {!loading && !error && summary && anomalies && vehicles && incidents && health && ready ? (
          <>
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-cyan-300">System status</p>
                    <h3 className="mt-2 text-lg font-semibold text-white">Operations overview</h3>
                  </div>
                  <StatusBadge label={ready.status.toUpperCase()} tone={statusTone} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <StatCard label="Traffic Volume" value={`${summary.avg_traffic_volume.toFixed(1)}`} hint="avg veh/hr" tone="cyan" />
                  <StatCard label="Average Speed" value={`${summary.avg_vehicle_speed.toFixed(1)} km/h`} hint="network mean" tone="violet" />
                  <StatCard label="Anomalies" value={String(anomalies.rows)} hint={anomalies.rows === 0 ? "No anomalies detected" : "Flagged records"} tone={anomalies.rows === 0 ? "emerald" : "amber"} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <StatCard label="Active Incidents" value={String(incidents.total_incidents)} hint="current incident window" tone="red" />
                  <StatCard label="Monitored Locations" value={String(summary.locations)} hint="signalized intersections" tone="emerald" />
                  <StatCard label="Vehicle Count" value={vehicles.total_vehicles.toLocaleString()} hint="dataset-derived vehicles" tone="default" />
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-400">Current conditions</p>
                    <h3 className="mt-2 text-lg font-semibold text-white">Live context</h3>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <MetricRow label="Dataset" value={summary.dataset} />
                  <MetricRow label="Weather" value={summary.weather_conditions.join(", ") || "—"} />
                  <MetricRow label="System" value={health.service} />
                  <MetricRow label="MinIO" value={health.minio.status.toUpperCase()} tone={health.minio.status === "ok" ? "emerald" : "amber"} />
                  <MetricRow label="Bucket" value={health.minio.bucket} />
                  <MetricRow label="API status" value={ready.bucket_ready ? "READY" : "DEGRADED"} tone={ready.bucket_ready ? "emerald" : "amber"} />
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <ChartCard title="Traffic profile" subtitle="Current operational state">
                <div className="space-y-3">
                  <MetricRow label="Dataset rows" value={summary.row_count.toLocaleString()} />
                  <MetricRow label="Avg speed" value={`${summary.avg_vehicle_speed.toFixed(1)} km/h`} />
                  <MetricRow label="Traffic variation" value={`${summary.avg_traffic_volume.toFixed(1)} veh/hr`} />
                  <MetricRow label="Weather window" value={summary.weather_conditions.length ? summary.weather_conditions.join(", ") : "No weather signal"} />
                </div>
              </ChartCard>

              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <SectionHeader eyebrow="Alerts" title="Active alerts" />
                <div className="mt-4 space-y-3">
                  {anomalies.rows > 0 ? (
                    <AlertItem title="Traffic anomaly detected" detail={`${anomalies.rows} records exceed threshold ${anomalies.anomaly_threshold.toFixed(1)}`} tone="warn" />
                  ) : (
                    <AlertItem title="No anomalies detected" detail="No anomalies detected in the current dataset/window." tone="ok" />
                  )}
                  <AlertItem title="Data pipeline" detail={ready.bucket_ready ? "Pipeline and source health are operational." : "Pipeline health is degraded."} tone={ready.bucket_ready ? "ok" : "warn"} />
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title="Operations summary" subtitle="Current dataset snapshot">
                <div className="space-y-3">
                  <MetricRow label="Traffic volume" value={`${summary.avg_traffic_volume.toFixed(1)} veh/hr`} tone="cyan" />
                  <MetricRow label="Average speed" value={`${summary.avg_vehicle_speed.toFixed(1)} km/h`} tone="violet" />
                  <MetricRow label="Location count" value={String(summary.locations)} tone="emerald" />
                  <MetricRow label="Dataset" value={summary.dataset} />
                </div>
              </ChartCard>

              <ChartCard title="Anomaly context" subtitle="Current threshold and detection window">
                <div className="space-y-3">
                  <MetricRow label="Observed max" value={String(anomalies.max_traffic_volume.toFixed(1))} tone="amber" />
                  <MetricRow label="Threshold" value={String(anomalies.anomaly_threshold.toFixed(1))} tone="red" />
                  <MetricRow label="Flagged rows" value={String(anomalies.rows)} tone={anomalies.rows > 0 ? "red" : "emerald"} />
                  <MetricRow label="Method" value="IQR upper bound" />
                </div>
              </ChartCard>
            </div>
          </>
        ) : null}

        {!loading && !error && (!summary || !anomalies || !vehicles || !incidents || !health || !ready) ? (
          <EmptyState title="No operational feed available" description="The system is currently unable to populate overview data from the backend API." />
        ) : null}
      </PageContainer>
    </DashboardShell>
  );
}
