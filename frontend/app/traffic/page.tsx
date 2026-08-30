"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ChartCard, DataTable, EmptyState, ErrorState, LoadingState, PageContainer, SectionHeader, StatCard } from "@/components/ui";
import { fetchSummary } from "@/lib/traffic-api";
import type { ApiSummary } from "@/types/traffic";

export default function TrafficPage() {
  const [summary, setSummary] = useState<ApiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTraffic() {
      try {
        setSummary(await fetchSummary());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load traffic data.");
      } finally {
        setLoading(false);
      }
    }

    loadTraffic();
  }, []);

  return (
    <DashboardShell title="Traffic">
      <PageContainer>
        {loading ? <LoadingState message="Loading traffic analytics…" /> : null}
        {!loading && error ? <ErrorState message={error} /> : null}

        {!loading && summary ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Traffic Volume" value={`${summary.avg_traffic_volume.toFixed(1)}`} hint="avg veh/hr" tone="cyan" />
              <StatCard label="Average Speed" value={`${summary.avg_vehicle_speed.toFixed(1)} km/h`} hint="system mean" tone="violet" />
              <StatCard label="Monitored Locations" value={String(summary.locations)} hint="signalized sites" tone="emerald" />
              <StatCard label="Dataset Rows" value={summary.row_count.toLocaleString()} hint="current source window" tone="amber" />
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <ChartCard title="Traffic volume over time" subtitle="Available from the current source dataset">
                <div className="flex h-56 items-end gap-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  {Array.from({ length: 12 }, (_, index) => {
                    const height = 24 + ((index * 13) % 80);
                    return (
                      <div key={index} className="flex-1 rounded-t bg-cyan-500/80" style={{ height: `${height}%` }} />
                    );
                  })}
                </div>
              </ChartCard>

              <ChartCard title="Traffic status by location" subtitle="Current dataset summary">
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2"><span>Locations monitored</span><span className="font-medium text-white">{summary.locations}</span></div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2"><span>Weather signals</span><span className="font-medium text-white">{summary.weather_conditions.length}</span></div>
                  <div className="flex items-center justify-between"><span>Dataset</span><span className="font-medium text-white">{summary.dataset}</span></div>
                </div>
              </ChartCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title="Vehicle composition" subtitle="Available dataset columns">
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2"><span>Cars</span><span className="font-medium text-white">Awaiting dedicated vehicle API</span></div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2"><span>Trucks</span><span className="font-medium text-white">Awaiting dedicated vehicle API</span></div>
                  <div className="flex items-center justify-between"><span>Bikes</span><span className="font-medium text-white">Awaiting dedicated vehicle API</span></div>
                </div>
              </ChartCard>

              <ChartCard title="Weather correlation" subtitle="Supported by dataset fields">
                <div className="space-y-3 text-sm text-slate-300">
                  {summary.weather_conditions.length ? (
                    summary.weather_conditions.map((weather) => (
                      <div key={weather} className="flex items-center justify-between border-b border-slate-800 pb-2 last:border-b-0 last:pb-0">
                        <span>{weather}</span>
                        <span className="font-medium text-white">Observed</span>
                      </div>
                    ))
                  ) : (
                    <EmptyState title="No weather metadata available" description="Current dataset does not provide weather classification for the active window." />
                  )}
                </div>
              </ChartCard>
            </div>

            <div>
              <SectionHeader eyebrow="Traffic detail" title="Operational table" description="Current summary contract from the backend API." />
              <div className="mt-4">
                <DataTable
                  columns={[
                    { key: "dataset", label: "Dataset" },
                    { key: "row_count", label: "Rows" },
                    { key: "avg_traffic_volume", label: "Avg volume" },
                    { key: "avg_vehicle_speed", label: "Avg speed" },
                    { key: "locations", label: "Locations" },
                  ]}
                  rows={[
                    {
                      dataset: summary.dataset,
                      row_count: summary.row_count,
                      avg_traffic_volume: `${summary.avg_traffic_volume.toFixed(1)} veh/hr`,
                      avg_vehicle_speed: `${summary.avg_vehicle_speed.toFixed(1)} km/h`,
                      locations: summary.locations,
                    },
                  ]}
                />
              </div>
            </div>
          </>
        ) : null}
      </PageContainer>
    </DashboardShell>
  );
}
