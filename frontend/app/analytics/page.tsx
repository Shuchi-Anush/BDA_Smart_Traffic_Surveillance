"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ChartCard, EmptyState, PageContainer, SectionHeader, StatCard } from "@/components/ui";

export default function AnalyticsPage() {
  return (
    <DashboardShell title="Analytics">
      <PageContainer>
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Model health" value="READY" hint="Data pipeline active" tone="emerald" />
          <StatCard label="Anomaly score" value="—" hint="Awaiting richer analytics" tone="default" />
          <StatCard label="Forecast" value="—" hint="No forecast model" tone="cyan" />
          <StatCard label="Accuracy" value="—" hint="Pending validation" tone="amber" />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard title="Traffic trend analysis" subtitle="Prepared for forecast and operational trend views">
            <EmptyState title="No trend model output" description="This section will present seasonal patterns, real-time flow, and anomaly relative to historical baselines." />
          </ChartCard>

          <ChartCard title="Predictive indicators" subtitle="Prepared for signal and CV forecasting">
            <EmptyState title="No predictive alerting yet" description="Future analytics will include queueing, incident risk, and travel-time estimates generated from operational telemetry." />
          </ChartCard>
        </div>

        <div>
          <SectionHeader eyebrow="Current scope" title="Analytics layer" description="The current backend exposes summary and anomaly endpoints; future analytics will build from canonical operational events." />
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
            <ul className="list-disc space-y-2 pl-5">
              <li>Flow forecasting and saturation risk</li>
              <li>Queue estimation and incident likelihood</li>
              <li>Weather and volume correlation analysis</li>
              <li>Signal timing optimization opportunities</li>
            </ul>
          </div>
        </div>
      </PageContainer>
    </DashboardShell>
  );
}
