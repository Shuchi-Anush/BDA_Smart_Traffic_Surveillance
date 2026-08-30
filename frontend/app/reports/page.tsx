"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ChartCard, DataTable, ErrorState, LoadingState, PageContainer, SectionHeader, StatCard } from "@/components/ui";
import { fetchReports } from "@/lib/traffic-api";
import type { ReportResponse } from "@/types/traffic";

export default function ReportsPage() {
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReports() {
      try {
        setReport(await fetchReports());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load reports data.");
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  const currentReport = report?.current as Record<string, unknown> | undefined;
  const storageStatus = (currentReport?.storage_status as Record<string, unknown>) ?? {};

  return (
    <DashboardShell title="Reports">
      <PageContainer>
        {loading ? <LoadingState message="Generating operations report…" /> : null}
        {!loading && error ? <ErrorState message={error} /> : null}

        {!loading && report ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard label="Generated" value={report.storage.status === "generated" ? "1" : "0"} hint="current period" tone="cyan" />
              <StatCard label="Artifact" value={report.storage.artifact.split("/").pop() ?? "n/a"} hint="MinIO report object" tone="amber" />
              <StatCard label="Sources" value={String((currentReport?.source_count as number) ?? 0)} hint="records in report" tone="emerald" />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title="Operational report queue" subtitle="Current generated summary">
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2"><span>Report type</span><span className="font-medium text-white">{String(currentReport?.report_type ?? "n/a")}</span></div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2"><span>Generated at</span><span className="font-medium text-white">{String(currentReport?.generated_at ?? "n/a")}</span></div>
                  <div className="flex items-center justify-between"><span>Bucket</span><span className="font-medium text-white">{String(storageStatus.bucket ?? "n/a")}</span></div>
                </div>
              </ChartCard>

              <ChartCard title="Distribution" subtitle="Operational snapshot">
                <div className="space-y-3 text-sm text-slate-300">
                  {Array.isArray((currentReport?.source_status as Record<string, string>) ?? null) ? null : (
                    Object.entries((currentReport?.source_status as Record<string, string>) ?? {}).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between border-b border-slate-800 pb-2 last:border-b-0 last:pb-0">
                        <span>{key}</span>
                        <span className="font-medium text-white">{String(value)}</span>
                      </div>
                    ))
                  )}
                </div>
              </ChartCard>
            </div>

            <div>
              <SectionHeader eyebrow="Report artifact" title="Generated content" description="Operational report stored in the MinIO report namespace." />
              <div className="mt-4">
                <DataTable
                  columns={[
                    { key: "artifact", label: "Artifact" },
                    { key: "status", label: "Status" },
                    { key: "bucket", label: "Bucket" },
                  ]}
                  rows={[
                    {
                      artifact: report.storage.artifact,
                      status: report.storage.status,
                      bucket: String(storageStatus.bucket ?? "traffic-data"),
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
