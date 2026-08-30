"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ChartCard, EmptyState, ErrorState, LoadingState, MetricRow, PageContainer, SectionHeader, StatCard } from "@/components/ui";
import { fetchAnomalies } from "@/lib/traffic-api";
import type { ApiAnomalies } from "@/types/traffic";

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<ApiAnomalies | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnomalies() {
      try {
        setAnomalies(await fetchAnomalies());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load anomaly model.");
      } finally {
        setLoading(false);
      }
    }

    loadAnomalies();
  }, []);

  return (
    <DashboardShell title="Anomalies">
      <PageContainer>
        {loading ? <LoadingState message="Loading anomaly analysis…" /> : null}
        {!loading && error ? <ErrorState message={error} /> : null}

        {!loading && anomalies ? (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="Status" value={anomalies.rows === 0 ? "Clear" : "Detected"} hint="Current dataset window" tone={anomalies.rows === 0 ? "emerald" : "amber"} />
              <StatCard label="Threshold" value={anomalies.anomaly_threshold.toFixed(1)} hint="IQR upper bound" tone="red" />
              <StatCard label="Observed max" value={anomalies.max_traffic_volume.toFixed(1)} hint="peak volume" tone="amber" />
              <StatCard label="Flagged rows" value={String(anomalies.rows)} hint={anomalies.rows === 0 ? "No anomalies detected" : "Records beyond threshold"} tone={anomalies.rows === 0 ? "emerald" : "red"} />
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <ChartCard title="Anomaly status" subtitle="Current result">
                {anomalies.rows === 0 ? (
                  <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                    No anomalies detected in the current dataset/window.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <MetricRow label="Method" value="IQR upper-bound detector" />
                    <MetricRow label="Threshold" value={anomalies.anomaly_threshold.toFixed(1)} tone="red" />
                    <MetricRow label="Observed max" value={anomalies.max_traffic_volume.toFixed(1)} tone="amber" />
                    <MetricRow label="Flagged records" value={String(anomalies.rows)} tone="red" />
                  </div>
                )}
              </ChartCard>

              <ChartCard title="Methodology" subtitle="Operational explanation">
                <div className="space-y-3 text-sm text-slate-300">
                  <p>The anomaly detector evaluates traffic volume using the interquartile range method.</p>
                  <p>Threshold = Q3 + 1.5 × IQR, where Q3 is the 75th percentile and IQR = Q3 − Q1.</p>
                  <p>Records above this threshold are treated as outliers for the current dataset window.</p>
                </div>
              </ChartCard>
            </div>

            <div>
              <SectionHeader eyebrow="Context" title="Operational context" description="Prepared for location-aware and time-aware anomaly models." />
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
                <p className="mb-3">Current dataset: {anomalies.dataset}</p>
                <p>
                  {anomalies.rows === 0
                    ? "No anomaly rows are currently present in the source window, so the system remains in a normal traffic state for the active dataset."
                    : "Anomaly rows are present and should be reviewed for location, time, weather, and signal-state context before operator action is assigned."}
                </p>
              </div>
            </div>
          </>
        ) : null}

        {!loading && !error && !anomalies ? <EmptyState title="No anomaly model output" description="The backend anomaly endpoint was unavailable or returned no data for the current window." /> : null}
      </PageContainer>
    </DashboardShell>
  );
}
