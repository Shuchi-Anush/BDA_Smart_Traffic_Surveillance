import type { ReactNode } from "react";

export function PageContainer({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`space-y-6 ${className}`}>{children}</div>;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-cyan-300">{eyebrow}</p> : null}
        <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "cyan" | "amber" | "violet" | "emerald" | "red";
}) {
  const toneMap = {
    default: "border-slate-700 bg-slate-900/80 text-slate-100",
    cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-100",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-100",
    violet: "border-violet-500/30 bg-violet-500/10 text-violet-100",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
    red: "border-red-500/30 bg-red-500/10 text-red-100",
  };

  return (
    <div className={`rounded-xl border p-4 ${toneMap[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <span className="h-2.5 w-2.5 rounded-full bg-current/60" />
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function StatusBadge({ label, tone = "ok" }: { label: string; tone?: "ok" | "warn" | "error" | "neutral" }) {
  const toneMap = {
    ok: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    warn: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    error: "border-red-500/30 bg-red-500/10 text-red-200",
    neutral: "border-slate-700 bg-slate-800 text-slate-200",
  };

  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${toneMap[tone]}`}>{label}</span>;
}

export function MetricRow({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "cyan" | "amber" | "red" | "emerald" | "violet" }) {
  const toneMap = {
    default: "text-slate-200",
    cyan: "text-cyan-200",
    amber: "text-amber-200",
    red: "text-red-200",
    emerald: "text-emerald-200",
    violet: "text-violet-200",
  };

  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-800 py-2.5 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className={`font-medium ${toneMap[tone]}`}>{value}</span>
    </div>
  );
}

export function AlertItem({ title, detail, tone = "neutral" }: { title: string; detail: string; tone?: "neutral" | "warn" | "error" | "ok" }) {
  const toneMap = {
    neutral: "border-slate-700 bg-slate-900/80",
    warn: "border-amber-500/30 bg-amber-500/10",
    error: "border-red-500/30 bg-red-500/10",
    ok: "border-emerald-500/30 bg-emerald-500/10",
  };

  return (
    <div className={`rounded-xl border p-3 ${toneMap[tone]}`}>
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-1 text-xs text-slate-300">{detail}</p>
    </div>
  );
}

export function LoadingState({ message = "Loading operational data…" }: { message?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 text-sm text-slate-300">
      <div className="flex items-center gap-3">
        <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-400" />
        {message}
      </div>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{message}</div>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-5 text-sm text-slate-300">
      <p className="font-medium text-white">{title}</p>
      <p className="mt-2 text-slate-400">{description}</p>
    </div>
  );
}

export function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{title}</p>
          {subtitle ? <p className="text-xs text-slate-400">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

export function DataTable<T extends Record<string, string | number | undefined>>({
  columns,
  rows,
}: {
  columns: { key: keyof T; label: string }[];
  rows: T[];
}) {
  if (!rows.length) {
    return <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">No records available for the current window.</div>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-slate-300">
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} className="px-3 py-2 font-medium">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-t border-slate-800 bg-slate-950/30">
                {columns.map((column) => (
                  <td key={`${String(column.key)}-${index}`} className="px-3 py-2 text-slate-200">
                    {row[column.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
