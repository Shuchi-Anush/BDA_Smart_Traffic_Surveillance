"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ChartCard, DataTable, EmptyState, ErrorState, LoadingState, PageContainer, SectionHeader, StatCard } from "@/components/ui";
import { fetchMapData } from "@/lib/traffic-api";
import type { MapSummary } from "@/types/traffic";

export default function MapPage() {
  const [summary, setSummary] = useState<MapSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMap() {
      try {
        setSummary(await fetchMapData());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load map data.");
      } finally {
        setLoading(false);
      }
    }

    loadMap();
  }, []);

  return (
    <DashboardShell title="Map">
      <PageContainer>
        {loading ? <LoadingState message="Loading geospatial telemetry…" /> : null}
        {!loading && error ? <ErrorState message={error} /> : null}

        {!loading && summary ? (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="Intersections" value={String(summary.location_count)} hint="unique sensor positions" tone="default" />
              <StatCard label="Points" value={String(summary.points.length)} hint="geospatial samples" tone="cyan" />
              <StatCard label="Incident zones" value="0" hint="no active alerts" tone="amber" />
              <StatCard label="Map health" value={summary.status === "real-data" ? "READY" : "UNAVAILABLE"} hint="data availability" tone={summary.status === "real-data" ? "emerald" : "default"} />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title="Live map" subtitle="Observed sensor coordinates">
                <div className="space-y-3">
                  {summary.points.length ? (
                    summary.points.slice(0, 6).map((point, index) => (
                      <div key={`${point.sensor_id ?? index}`} className="flex items-center justify-between border-b border-slate-800 pb-2 text-sm text-slate-300 last:border-b-0 last:pb-0">
                        <span>{point.sensor_id ?? "Sensor"}</span>
                        <span>{point.latitude.toFixed(3)}, {point.longitude.toFixed(3)}</span>
                      </div>
                    ))
                  ) : (
                    <EmptyState title="No geospatial points" description="The active dataset does not contain valid latitude/longitude records." />
                  )}
                </div>
              </ChartCard>

              <ChartCard title="Route and corridor view" subtitle="Current point inventory">
                <div className="space-y-3 text-sm text-slate-300">
                  {summary.points.length ? (
                    summary.points.slice(0, 5).map((point, index) => (
                      <div key={`${point.sensor_id ?? index}-meta`} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                        <p className="font-medium text-white">{point.sensor_id ?? "Sensor"}</p>
                        <p className="mt-1 text-xs text-slate-400">{point.event_type ?? "telemetry"} • {point.timestamp ?? "n/a"}</p>
                      </div>
                    ))
                  ) : (
                    <EmptyState title="No route context" description="No sensor data points are currently available for corridor tracing." />
                  )}
                </div>
              </ChartCard>
            </div>

            <div>
              <SectionHeader eyebrow="Coordinates" title="Map data contract" description="Current geospatial coordinates from the backend source." />
              <div className="mt-4">
                <DataTable
                  columns={[
                    { key: "sensor_id", label: "Sensor" },
                    { key: "latitude", label: "Latitude" },
                    { key: "longitude", label: "Longitude" },
                    { key: "event_type", label: "Event" },
                  ]}
                  rows={summary.points.slice(0, 10).map((point) => ({
                    sensor_id: point.sensor_id ?? "n/a",
                    latitude: point.latitude.toFixed(3),
                    longitude: point.longitude.toFixed(3),
                    event_type: point.event_type ?? "telemetry",
                  }))}
                />
              </div>
            </div>
          </>
        ) : null}
      </PageContainer>
    </DashboardShell>
  );
}
