"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ChartCard, EmptyState, ErrorState, LoadingState, PageContainer, SectionHeader, StatCard } from "@/components/ui";
import { fetchVideoData } from "@/lib/traffic-api";
import type { VideoSummary } from "@/types/traffic";

export default function VideoPage() {
  const [summary, setSummary] = useState<VideoSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVideo() {
      try {
        setSummary(await fetchVideoData());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load video pipeline data.");
      } finally {
        setLoading(false);
      }
    }

    loadVideo();
  }, []);

  return (
    <DashboardShell title="Video Surveillance">
      <PageContainer>
        {loading ? <LoadingState message="Loading video analytics…" /> : null}
        {!loading && error ? <ErrorState message={error} /> : null}

        {!loading && summary ? (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="Cameras" value="1" hint="configured feed" tone="default" />
              <StatCard label="Streams" value="1" hint="active source" tone="cyan" />
              <StatCard label="Detections" value={String(summary.baseline_vehicle_count)} hint="OpenCV baseline" tone="amber" />
              <StatCard label="Latency" value={`${summary.duration_seconds || 0}s`} hint="video window" tone="emerald" />
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <ChartCard title="Live camera view" subtitle={summary.video_file}>
                <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/50 p-4 text-center text-sm text-slate-300">
                  OpenCV baseline pipeline processed a sample video feed with {summary.frame_count} frames at {summary.fps.toFixed(2)} FPS. The current implementation is a baseline motion-detection pass rather than a full streaming visualizer.
                </div>
              </ChartCard>

              <ChartCard title="Operator actions" subtitle="Current CV baseline output">
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2"><span>Status</span><span className="font-medium text-white">{summary.status}</span></div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2"><span>Method</span><span className="font-medium text-white">{summary.method}</span></div>
                  <div className="flex items-center justify-between"><span>Sample frames</span><span className="font-medium text-white">{summary.sample_count}</span></div>
                </div>
              </ChartCard>
            </div>

            <div>
              <SectionHeader eyebrow="Pipeline status" title="FFmpeg / OpenCV readiness" description="Current baseline pipeline state for the available surveillance file." />
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
                <p>{summary.processed_result}</p>
              </div>
            </div>
          </>
        ) : null}
      </PageContainer>
    </DashboardShell>
  );
}
