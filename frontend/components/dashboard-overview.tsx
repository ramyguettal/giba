import {
  Activity,
  BookMarked,
  CircleAlert,
  FileCheck2,
  TrendingUp,
  Wrench,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dictionary } from "@/lib/i18n";
import { DashboardStats, IngestionJob, Locale } from "@/lib/types";
import { cn } from "@/lib/utils";

function confidenceStyle(level: string) {
  if (level === "high") return "text-[var(--success)] bg-[var(--success-soft)] border-[var(--success-border)]";
  if (level === "medium") return "text-[var(--warning)] bg-[var(--warning-soft)] border-[var(--warning-border)]";
  return "text-[var(--danger)] bg-[var(--danger-soft)] border-[var(--danger-border)]";
}

function jobStatusStyle(status: IngestionJob["status"]) {
  if (status === "completed") return "success" as const;
  if (status === "failed") return "destructive" as const;
  if (status === "processing") return "warning" as const;
  return "secondary" as const;
}

function formatRelative(dateStr: string, locale: Locale) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}

// ──────────────────────────────────────────────────────────────────────────────
// Stat card
// ──────────────────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  accentClass,
  trend,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
  trend?: string;
}) {
  return (
    <Card className="border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <CardContent className="p-0">
        <div className={cn("h-0.5 w-full", accentClass)} />
        <div className="p-4 flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-xs text-[var(--muted-foreground)] font-medium">{label}</p>
            <p className="text-2xl font-bold text-[var(--foreground)] leading-none">{value.toLocaleString()}</p>
            {trend && (
              <div className="flex items-center gap-1 text-[10px] text-[var(--success)]">
                <TrendingUp className="size-3" />
                {trend}
              </div>
            )}
          </div>
          <div className={cn("p-2 rounded-lg border", accentClass.replace("bg-", "bg-").includes("bg") ? "" : "border-[var(--border)] bg-[var(--muted)]")}>
            <Icon className={cn("size-4", "text-[var(--muted-foreground)]")} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Machine distribution bar
// ──────────────────────────────────────────────────────────────────────────────
function MachineDistribution({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (!total) return null;
  return (
    <div className="space-y-2 px-4 pb-4">
      {entries.map(([machine, count]) => {
        const pct = Math.round((count / total) * 100);
        return (
          <div key={machine} className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-mono font-medium text-[var(--foreground)]">{machine}</span>
              <span className="text-[var(--muted-foreground)]">{count} ({pct}%)</span>
            </div>
            <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--primary)] rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main dashboard
// ──────────────────────────────────────────────────────────────────────────────
export function DashboardOverview({
  stats,
  jobs,
  recentQueries,
  recentReports,
  locale,
  dictionary,
}: {
  stats: DashboardStats;
  jobs: IngestionJob[];
  recentQueries: Array<{ id: string; question: string; createdAt: string; confidenceLevel: string }>;
  recentReports: Array<{ id: string; machine_type: string; createdAt: string }>;
  locale: Locale;
  dictionary: Dictionary;
}) {
  const lowConfPct = stats.totalQueries
    ? Math.round((stats.lowConfidenceQueries / stats.totalQueries) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold">{dictionary.dashboard.title}</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{dictionary.dashboard.description}</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[var(--muted-foreground)] border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 rounded-lg">
          <Activity className="size-3 text-[var(--primary)]" />
          Live
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={dictionary.dashboard.cards.reports}
          value={stats.totalReports}
          icon={FileCheck2}
          accentClass="bg-[var(--primary)]"
        />
        <StatCard
          label={dictionary.dashboard.cards.queries}
          value={stats.totalQueries}
          icon={Activity}
          accentClass="bg-[var(--success)]"
        />
        <StatCard
          label={dictionary.dashboard.cards.lowConfidence}
          value={stats.lowConfidenceQueries}
          icon={CircleAlert}
          accentClass="bg-[var(--warning)]"
          trend={lowConfPct > 0 ? `${lowConfPct}% of queries` : undefined}
        />
        <StatCard
          label={dictionary.dashboard.cards.jobs}
          value={stats.activeJobs}
          icon={BookMarked}
          accentClass="bg-[var(--accent)]"
        />
      </div>

      {/* Main content */}
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        {/* Left: jobs + machine dist */}
        <div className="space-y-4">
          <Card className="border border-[var(--border)] bg-[var(--card)]">
            <CardHeader className="px-4 py-3 border-b border-[var(--border)]">
              <CardTitle className="flex items-center gap-2 text-xs font-semibold">
                <Wrench className="size-4 text-[var(--primary)]" />
                {dictionary.dashboard.recentJobs}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-[var(--border)]">
              {jobs.length === 0 ? (
                <p className="px-4 py-6 text-xs text-[var(--muted-foreground)] text-center">No jobs yet.</p>
              ) : (
                jobs.slice(0, 8).map((job) => (
                  <div key={job.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[var(--muted)]/50 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-[var(--foreground)] truncate">{job.title}</p>
                        <Badge variant={jobStatusStyle(job.status)} className="text-[10px] capitalize shrink-0">{job.status}</Badge>
                      </div>
                      <p className="text-[11px] text-[var(--muted-foreground)] truncate mt-0.5">{job.detail}</p>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <p className="text-[11px] font-mono text-[var(--muted-foreground)]">{job.machineType}</p>
                      <p className="text-[10px] text-[var(--muted-foreground)]">{formatRelative(job.createdAt, locale)}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {Object.keys(stats.reportsByMachine).length > 0 && (
            <Card className="border border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="px-4 py-3 border-b border-[var(--border)]">
                <CardTitle className="flex items-center gap-2 text-xs font-semibold">
                  <TrendingUp className="size-4 text-[var(--primary)]" />
                  Reports by machine
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 pb-0">
                <MachineDistribution data={stats.reportsByMachine} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: queries + reports */}
        <div className="space-y-4">
          <Card className="border border-[var(--border)] bg-[var(--card)]">
            <CardHeader className="px-4 py-3 border-b border-[var(--border)]">
              <CardTitle className="flex items-center gap-2 text-xs font-semibold">
                <Zap className="size-4 text-[var(--primary)]" />
                {dictionary.dashboard.recentQueries}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-[var(--border)]">
              {recentQueries.length === 0 ? (
                <p className="px-4 py-6 text-xs text-[var(--muted-foreground)] text-center">{dictionary.dashboard.noQueries}</p>
              ) : (
                recentQueries.slice(0, 6).map((q) => (
                  <div key={q.id} className="px-4 py-3 hover:bg-[var(--muted)]/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-[var(--foreground)] line-clamp-2 flex-1">{q.question}</p>
                      <span className={cn(
                        "shrink-0 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border",
                        confidenceStyle(q.confidenceLevel),
                      )}>
                        {q.confidenceLevel}
                      </span>
                    </div>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-1">{formatRelative(q.createdAt, locale)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border border-[var(--border)] bg-[var(--card)]">
            <CardHeader className="px-4 py-3 border-b border-[var(--border)]">
              <CardTitle className="flex items-center gap-2 text-xs font-semibold">
                <FileCheck2 className="size-4 text-[var(--primary)]" />
                {dictionary.dashboard.recentReports}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-[var(--border)]">
              {recentReports.length === 0 ? (
                <p className="px-4 py-6 text-xs text-[var(--muted-foreground)] text-center">{dictionary.dashboard.noReports}</p>
              ) : (
                recentReports.slice(0, 6).map((r) => (
                  <div key={r.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[var(--muted)]/50 transition-colors">
                    <p className="text-xs font-mono text-[var(--foreground)]">{r.id.slice(0, 8)}<span className="text-[var(--muted-foreground)]">…</span></p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono">{r.machine_type}</Badge>
                      <span className="text-[10px] text-[var(--muted-foreground)]">{formatRelative(r.createdAt, locale)}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
