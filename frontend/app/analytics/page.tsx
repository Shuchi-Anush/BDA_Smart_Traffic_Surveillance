"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ChartCard, EmptyState, ErrorState, LoadingState, PageContainer, SectionHeader, StatCard } from "@/components/ui";
import { fetchAnomalies, fetchSignals, fetchSummary, fetchVehicles } from "@/lib/traffic-api";
import type { ApiAnomalies, ApiSummary, SignalSummary, VehicleSummary } from "@/types/traffic";

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<ApiSummary | null>(null);
  const [anomalies, setAnomalies] = useState<ApiAnomalies | null>(null);
  const [vehicles, setVehicles] = useState<VehicleSummary | null>(null);
  const [signals, setSignals] = useState<SignalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const [summaryData, anomalyData, vehicleData, signalData] = await Promise.all([
          fetchSummary(),
          fetchAnomalies(),
          fetchVehicles(),
          fetchSignals(),
        ]);
        setSummary(summaryData);
        setAnomalies(anomalyData);
        setVehicles(vehicleData);
        setSignals(signalData);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load analytics data.");
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  return (
    <DashboardShell title="Analytics">
      <PageContainer>
        {loading ? <LoadingState message="Loading live analytics…" /> : null}
        {!loading && error ? <ErrorState message={error} /> : null}

        {!loading && summary && anomalies && vehicles && signals ? (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="Avg volume" value={`${summary.avg_traffic_volume.toFixed(1)}`} hint="veh/hr" tone="emerald" />
              <StatCard label="Avg speed" value={`${summary.avg_vehicle_speed.toFixed(1)} km/h`} hint="system mean" tone="cyan" />
              <StatCard label="Anomalies" value={String(anomalies.rows)} hint="data outliers" tone={anomalies.rows > 0 ? "amber" : "emerald"} />
              <StatCard label="Vehicles" value={vehicles.total_vehicles.toLocaleString()} hint="dataset-derived" tone="violet" />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title="Traffic trend analysis" subtitle="Current source window metrics">
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2"><span>Dataset rows</span><span className="font-medium text-white">{summary.row_count.toLocaleString()}</span></div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2"><span>Locations</span><span className="font-medium text-white">{summary.locations}</span></div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2"><span>Observed weather</span><span className="font-medium text-white">{summary.weather_conditions.join(", ") || "n/a"}</span></div>
                  <div className="flex items-center justify-between"><span>Signal files</span><span className="font-medium text-white">{signals.signal_files}</span></div>
                </div>
              </ChartCard>

              <ChartCard title="Predictive indicators" subtitle="Derived from live operational data">
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2"><span>Threshold</span><span className="font-medium text-white">{anomalies.anomaly_threshold.toFixed(1)}</span></div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2"><span>Peak traffic</span><span className="font-medium text-white">{anomalies.max_traffic_volume.toFixed(1)}</span></div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2"><span>Cars</span><span className="font-medium text-white">{vehicles.cars.toLocaleString()}</span></div>
                  <div className="flex items-center justify-between"><span>Signal phases</span><span className="font-medium text-white">{signals.phase_count}</span></div>
                </div>
              </ChartCard>
            </div>

            <div>
              <SectionHeader eyebrow="Current scope" title="Analytics layer" description="Real data-backed operational metrics from the active dataset and signal sources." />
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
                <ul className="list-disc space-y-2 pl-5">
                  <li>Traffic volume and mean speed are derived from the active traffic dataset.</li>
                  <li>Outlier detection is computed from the IQR threshold logic in the backend.</li>
                  <li>Vehicle totals are computed from structured counts available in the source data.</li>
                  <li>Signal timing metrics reflect the available Kolkata signal CSV sources.</li>
                </ul>
              </div>
            </div>
          </>
        ) : null}

        {!loading && !error && (!summary || !anomalies || !vehicles || !signals) ? (
          <EmptyState title="No live analytics payload" description="The backend analytics endpoints did not return a complete dataset for the current window." />
        ) : null}
      </PageContainer>
    </DashboardShell>
  );
}
