"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ChartCard, DataTable, EmptyState, ErrorState, LoadingState, PageContainer, SectionHeader, StatCard } from "@/components/ui";
import { fetchDataSources, fetchHealth, fetchReady } from "@/lib/traffic-api";
import type { DataSourceResponse, HealthResponse, ReadyResponse } from "@/types/traffic";

export default function SystemPage() {
  const [sources, setSources] = useState<DataSourceResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [ready, setReady] = useState<ReadyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSystem() {
      try {
        const [sourceData, healthData, readyData] = await Promise.all([fetchDataSources(), fetchHealth(), fetchReady()]);
        setSources(sourceData);
        setHealth(healthData);
        setReady(readyData);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load system health.");
      } finally {
        setLoading(false);
      }
    }

    loadSystem();
  }, []);

  return (
    <DashboardShell title="System">
      <PageContainer>
        {loading ? <LoadingState message="Loading system health…" /> : null}
        {!loading && error ? <ErrorState message={error} /> : null}

        {!loading && health && ready && sources ? (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="API" value={health.status.toUpperCase()} hint="backend reachability" tone={health.status === "ok" ? "emerald" : "amber"} />
              <StatCard label="MinIO" value={health.minio.status.toUpperCase()} hint="object store status" tone={health.minio.status === "ok" ? "cyan" : "default"} />
              <StatCard label="Dataset" value={String(sources.count)} hint="source files available" tone="amber" />
              <StatCard label="Bucket" value={ready.bucket_ready ? "READY" : "DEGRADED"} hint="storage readiness" tone={ready.bucket_ready ? "emerald" : "default"} />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title="Data sources" subtitle="Primary source inventory from the backend">
                <div className="space-y-3 text-sm text-slate-300">
                  {sources.sources.map((source) => (
                    <div key={source.name} className="flex items-center justify-between border-b border-slate-800 pb-2 last:border-b-0 last:pb-0">
                      <span>{source.name}</span>
                      <span className="font-medium text-white">{source.status}</span>
                    </div>
                  ))}
                </div>
              </ChartCard>

              <ChartCard title="Pipeline" subtitle="Operational system components">
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2"><span>Ingestion</span><span className="font-medium text-white">{ready.bucket_ready ? "Active" : "Degraded"}</span></div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2"><span>Validation</span><span className="font-medium text-white">Active</span></div>
                  <div className="flex items-center justify-between"><span>OpenCV feed</span><span className="font-medium text-white">Baseline</span></div>
                </div>
              </ChartCard>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <SectionHeader eyebrow="Health" title="System health" description="Current backend readiness and service state." />
                <div className="mt-4 text-sm text-slate-300">
                  <ul className="list-disc space-y-2 pl-5">
                    <li>Service: {health.service}</li>
                    <li>Environment: {health.environment}</li>
                    <li>MinIO endpoint: {health.minio.endpoint}</li>
                    <li>Bucket: {health.minio.bucket}</li>
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <SectionHeader eyebrow="Inventory" title="Source details" description="Available storage metadata for each active source." />
                <div className="mt-4">
                  <DataTable
                    columns={[
                      { key: "name", label: "Source" },
                      { key: "type", label: "Type" },
                      { key: "status", label: "Status" },
                    ]}
                    rows={sources.sources.map((source) => ({ name: source.name, type: source.type, status: source.status }))}
                  />
                </div>
              </div>
            </div>
          </>
        ) : null}
      </PageContainer>
    </DashboardShell>
  );
}
