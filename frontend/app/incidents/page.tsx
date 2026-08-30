"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DataTable, EmptyState, ErrorState, LoadingState, PageContainer, SectionHeader, StatCard } from "@/components/ui";
import { fetchIncidents } from "@/lib/traffic-api";
import type { IncidentSummary } from "@/types/traffic";

export default function IncidentsPage() {
  const [summary, setSummary] = useState<IncidentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadIncidents() {
      try {
        setSummary(await fetchIncidents());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load incident data.");
      } finally {
        setLoading(false);
      }
    }

    loadIncidents();
  }, []);

  const criticalCount = summary?.records.filter((row) => row.severity === "high").length ?? 0;
  const highCount = summary?.records.filter((row) => row.severity === "medium").length ?? 0;

  return (
    <DashboardShell title="Incidents">
      <PageContainer>
        {loading ? <LoadingState message="Loading incident feed…" /> : null}
        {!loading && error ? <ErrorState message={error} /> : null}

        {!loading && summary ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard label="Critical" value={String(criticalCount)} hint="High-severity alerts" tone="red" />
              <StatCard label="High" value={String(highCount)} hint="Escalation pending" tone="amber" />
              <StatCard label="Open" value={String(summary.total_incidents)} hint="Current incident queue" tone="default" />
            </div>

            <div>
              <SectionHeader eyebrow="Operational workflow" title="Incident queue" description="Incident records currently available from the backend dataset." />
              <div className="mt-4">
                <DataTable
                  columns={[
                    { key: "severity", label: "Severity" },
                    { key: "incident_type", label: "Incident type" },
                    { key: "location", label: "Location" },
                    { key: "timestamp", label: "Timestamp" },
                    { key: "status", label: "Status" },
                    { key: "source", label: "Source" },
                  ]}
                  rows={summary.records.map((row) => ({
                    severity: row.severity ?? "low",
                    incident_type: row.incident_type ?? "n/a",
                    location: row.location ?? row.location_id ?? "n/a",
                    timestamp: row.timestamp ?? "n/a",
                    status: row.status ?? "reported",
                    source: row.source ?? "dataset",
                  }))}
                />
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <SectionHeader eyebrow="Detail" title="Incident summary" description="Derived from the active data window" />
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2"><span>Total incidents</span><span className="font-medium text-white">{summary.total_incidents}</span></div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2"><span>Incident types</span><span className="font-medium text-white">{summary.incident_types.join(", ") || "none"}</span></div>
                  <div className="flex items-center justify-between"><span>Source count</span><span className="font-medium text-white">{summary.source_count}</span></div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <SectionHeader eyebrow="Evidence" title="Dataset status" description="Available signal sources" />
                <div className="mt-4">
                  {summary.records.length ? (
                    <div className="space-y-3 text-sm text-slate-300">
                      {summary.records.slice(0, 3).map((record, index) => (
                        <div key={`${record.incident_type}-${index}`} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                          <p className="font-medium text-white">{record.incident_type}</p>
                          <p className="mt-1 text-xs text-slate-400">{record.location ?? record.location_id} • {record.timestamp}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="No current incidents" description="The current data window does not include active incident records to display." />
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </PageContainer>
    </DashboardShell>
  );
}
