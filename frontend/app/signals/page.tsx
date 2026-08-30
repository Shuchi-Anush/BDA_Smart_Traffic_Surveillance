"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ChartCard, DataTable, EmptyState, ErrorState, LoadingState, PageContainer, SectionHeader, StatCard } from "@/components/ui";
import { fetchSignals } from "@/lib/traffic-api";
import type { SignalSummary } from "@/types/traffic";

export default function SignalsPage() {
  const [summary, setSummary] = useState<SignalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSignals() {
      try {
        setSummary(await fetchSignals());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load signal data.");
      } finally {
        setLoading(false);
      }
    }

    loadSignals();
  }, []);

  return (
    <DashboardShell title="Signals">
      <PageContainer>
        {loading ? <LoadingState message="Loading signal timing data…" /> : null}
        {!loading && error ? <ErrorState message={error} /> : null}

        {!loading && summary ? (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="Signal state" value={summary.observed_states.length ? summary.observed_states[0] : "n/a"} hint="current phase observation" tone="default" />
              <StatCard label="Signal files" value={String(summary.signal_files)} hint="intersection source files" tone="cyan" />
              <StatCard label="Timing records" value={String(summary.timing_records)} hint="timing rows processed" tone="amber" />
              <StatCard label="Health" value={summary.phase_count > 0 ? "READY" : "UNAVAILABLE"} hint="signal phase model" tone={summary.phase_count > 0 ? "emerald" : "default"} />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title="Signal composition" subtitle="Observed phase counts">
                <div className="space-y-3 text-sm text-slate-300">
                  {Object.entries(summary.phases).length ? (
                    Object.entries(summary.phases).map(([phase, count]) => (
                      <div key={phase} className="flex items-center justify-between border-b border-slate-800 pb-2 last:border-b-0 last:pb-0">
                        <span>{phase}</span>
                        <span className="font-medium text-white">{count}</span>
                      </div>
                    ))
                  ) : (
                    <EmptyState title="No signal phases available" description="The active dataset does not expose phase timing rows for the current window." />
                  )}
                </div>
              </ChartCard>

              <ChartCard title="Signal files" subtitle="Source files processed in the Kolkata dataset">
                <div className="space-y-3 text-sm text-slate-300">
                  {summary.files.length ? (
                    summary.files.map((file) => (
                      <div key={file.file} className="flex items-center justify-between border-b border-slate-800 pb-2 last:border-b-0 last:pb-0">
                        <span>{file.file}</span>
                        <span className="font-medium text-white">{file.rows}</span>
                      </div>
                    ))
                  ) : (
                    <EmptyState title="No timing files" description="No signal CSV files were matched from the Kolkata source bundle." />
                  )}
                </div>
              </ChartCard>
            </div>

            <div>
              <SectionHeader eyebrow="Signal contract" title="Timing and phase summary" description="Derived from the available intersection signal files." />
              <div className="mt-4">
                <DataTable
                  columns={[
                    { key: "file", label: "File" },
                    { key: "rows", label: "Rows" },
                  ]}
                  rows={summary.files}
                />
              </div>
            </div>
          </>
        ) : null}
      </PageContainer>
    </DashboardShell>
  );
}
