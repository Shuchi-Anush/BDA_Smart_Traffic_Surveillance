"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navigationGroups = [
  {
    title: "Operations",
    items: [
      { label: "Overview", href: "/" },
      { label: "Traffic", href: "/traffic" },
      { label: "Vehicles", href: "/vehicles" },
      { label: "Incidents", href: "/incidents" },
      { label: "Anomalies", href: "/anomalies" },
      { label: "Signals", href: "/signals" },
      { label: "Map", href: "/map" },
      { label: "Video Surveillance", href: "/video" },
      { label: "Analytics", href: "/analytics" },
      { label: "Reports", href: "/reports" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Data Sources", href: "/system#data-sources" },
      { label: "Pipeline", href: "/system#pipeline" },
      { label: "System Health", href: "/system#health" },
      { label: "Settings", href: "/system#settings" },
    ],
  },
];

export function DashboardShell({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [lastUpdated, setLastUpdated] = useState<string>("--:--");

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  }, [pathname]);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-800 bg-slate-950/95 lg:block">
          <div className="flex h-full flex-col px-4 py-5">
            <div className="mb-8 flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.26em] text-cyan-300">Traffic Ops</p>
                <h1 className="mt-2 text-lg font-semibold text-white">Smart Traffic</h1>
              </div>
              <div className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-200">ONLINE</div>
            </div>

            <nav className="space-y-6">
              {navigationGroups.map((group) => (
                <div key={group.title}>
                  <p className="px-2 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">{group.title}</p>
                  <div className="mt-2 space-y-1">
                    {group.items.map((item) => {
                      const href = item.href;
                      const isActive = pathname === href || (href !== "/" && pathname.startsWith(href.replace(/#.*$/, "")));

                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          className={`flex items-center rounded-lg px-3 py-2 text-sm transition ${
                            isActive ? "border border-cyan-500/30 bg-cyan-500/10 text-cyan-100" : "text-slate-300 hover:bg-slate-900 hover:text-white"
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        <div className="flex-1">
          <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-xs font-semibold text-cyan-200 lg:hidden">
                  TO
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-400">Operations Console</p>
                  <h2 className="text-lg font-semibold text-white">{title}</h2>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  System OK
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-slate-300">Updated {lastUpdated}</span>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-200 transition hover:border-cyan-500/40 hover:text-white"
                >
                  Refresh
                </button>
                <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-[11px] font-medium text-white">OP</span>
                  <span className="text-sm text-slate-200">Operator</span>
                </div>
              </div>
            </div>
          </header>

          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
