"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ChartCard, DataTable, EmptyState, ErrorState, LoadingState, PageContainer, SectionHeader, StatCard } from "@/components/ui";
import { fetchVehicles } from "@/lib/traffic-api";
import type { VehicleSummary } from "@/types/traffic";

export default function VehiclesPage() {
  const [summary, setSummary] = useState<VehicleSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVehicles() {
      try {
        setSummary(await fetchVehicles());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load vehicle data.");
      } finally {
        setLoading(false);
      }
    }

    loadVehicles();
  }, []);

  const locationEntries = Object.entries(summary?.location_distribution ?? {});
  const timeEntries = Object.entries(summary?.time_distribution ?? {});

  return (
    <DashboardShell title="Vehicles">
      <PageContainer>
        {loading ? <LoadingState message="Loading vehicle analytics…" /> : null}
        {!loading && error ? <ErrorState message={error} /> : null}

        {!loading && summary ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <StatCard label="Total vehicles" value={summary.total_vehicles.toLocaleString()} hint="current dataset window" tone="default" />
              <StatCard label="Cars" value={summary.cars.toLocaleString()} hint="vehicle class count" tone="cyan" />
              <StatCard label="Trucks" value={summary.trucks.toLocaleString()} hint="vehicle class count" tone="amber" />
              <StatCard label="Bikes" value={summary.bikes.toLocaleString()} hint="vehicle class count" tone="violet" />
              <StatCard label="Locations" value={String(locationEntries.length)} hint="monitored sites" tone="emerald" />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title="Vehicle distribution" subtitle="By monitored location">
                <div className="space-y-3">
                  {locationEntries.length ? (
                    locationEntries.map(([location, value]) => (
                      <div key={location} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span>Location {location}</span>
                          <span>{value}</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                          <div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.min(100, (value / Math.max(...locationEntries.map(([, counter]) => counter), 1)) * 100)}%` }} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState title="No location distribution available" description="The current vehicle model has no location-level distribution values." />
                  )}
                </div>
              </ChartCard>

              <ChartCard title="Time distribution" subtitle="Hourly profile from source timestamps">
                <div className="space-y-3">
                  {timeEntries.length ? (
                    timeEntries.map(([hour, count]) => (
                      <div key={hour} className="flex items-center justify-between border-b border-slate-800 pb-2 text-sm text-slate-300 last:border-b-0 last:pb-0">
                        <span>Hour {hour}</span>
                        <span className="font-medium text-white">{count}</span>
                      </div>
                    ))
                  ) : (
                    <EmptyState title="No hourly distribution data" description="The current dataset window does not expose a valid time profile." />
                  )}
                </div>
              </ChartCard>
            </div>

            <div>
              <SectionHeader eyebrow="Live source" title="Vehicle data contract" description="Real vehicle counts derived from the active traffic dataset." />
              <div className="mt-4">
                <DataTable
                  columns={[
                    { key: "source", label: "Source" },
                    { key: "cars", label: "Cars" },
                    { key: "trucks", label: "Trucks" },
                    { key: "bikes", label: "Bikes" },
                    { key: "total_vehicles", label: "Total" },
                  ]}
                  rows={[
                    {
                      source: summary.source,
                      cars: summary.cars,
                      trucks: summary.trucks,
                      bikes: summary.bikes,
                      total_vehicles: summary.total_vehicles,
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
