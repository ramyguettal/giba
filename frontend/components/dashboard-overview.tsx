import { Activity, FileCheck2, CircleAlert, BookMarked, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dictionary } from "@/lib/i18n";
import { DashboardStats, IngestionJob, Locale } from "@/lib/types";

function getJobVariant(status: IngestionJob["status"]) {
  if (status === "completed") return "success" as const;
  if (status === "failed") return "destructive" as const;
  return "warning" as const;
}

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
  const cards = [
    { label: dictionary.dashboard.cards.reports, value: stats.totalReports, icon: FileCheck2 },
    { label: dictionary.dashboard.cards.queries, value: stats.totalQueries, icon: Activity },
    { label: dictionary.dashboard.cards.lowConfidence, value: stats.lowConfidenceQueries, icon: CircleAlert },
    { label: dictionary.dashboard.cards.jobs, value: stats.activeJobs, icon: BookMarked },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-lg font-semibold">{dictionary.dashboard.title}</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{dictionary.dashboard.description}</p>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border border-[var(--border)] bg-[var(--card)]">
              <CardContent className="p-4 flex items-start justify-between">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">{card.label}</p>
                  <p className="text-xl font-semibold text-[var(--foreground)] mt-1">{card.value}</p>
                </div>
                <div className="border border-[var(--border)] bg-[var(--muted)] p-2">
                  <Icon className="size-4 text-[var(--primary)]" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.95fr]">
        <Card className="border border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="px-4 py-3 border-b border-[var(--border)]">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold">
              <Wrench className="size-4 text-[var(--primary)]" />
              {dictionary.dashboard.recentJobs}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-[var(--border)]">
            {jobs.map((job) => (
              <div key={job.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-[var(--foreground)] truncate">{job.title}</p>
                    <Badge variant={getJobVariant(job.status)} className="text-[10px] capitalize">{job.status}</Badge>
                  </div>
                  <p className="text-[11px] text-[var(--muted-foreground)] truncate mt-0.5">{job.detail}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] text-[var(--muted-foreground)]">{job.machineType}</p>
                  <p className="text-[11px] text-[var(--muted-foreground)] capitalize">{job.type}</p>
                </div>
              </div>
            ))}
            {jobs.length === 0 && (
              <p className="px-4 py-6 text-xs text-[var(--muted-foreground)] text-center">No jobs yet.</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border border-[var(--border)] bg-[var(--card)]">
            <CardHeader className="px-4 py-3 border-b border-[var(--border)]">
              <CardTitle className="text-xs font-semibold">{dictionary.dashboard.recentQueries}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-[var(--border)]">
              {recentQueries.map((q) => (
                <div key={q.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-[var(--foreground)] truncate">{q.question}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-[10px] capitalize">{q.confidenceLevel}</Badge>
                    <span className="text-[11px] text-[var(--muted-foreground)]">
                      {new Date(q.createdAt).toLocaleString(locale)}
                    </span>
                  </div>
                </div>
              ))}
              {recentQueries.length === 0 && (
                <p className="px-4 py-6 text-xs text-[var(--muted-foreground)] text-center">{dictionary.dashboard.noQueries}</p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-[var(--border)] bg-[var(--card)]">
            <CardHeader className="px-4 py-3 border-b border-[var(--border)]">
              <CardTitle className="text-xs font-semibold">{dictionary.dashboard.recentReports}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-[var(--border)]">
              {recentReports.map((r) => (
                <div key={r.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-mono text-[var(--foreground)]">{r.id.slice(0, 8)}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{r.machine_type}</Badge>
                    <span className="text-[11px] text-[var(--muted-foreground)]">
                      {new Date(r.createdAt).toLocaleString(locale)}
                    </span>
                  </div>
                </div>
              ))}
              {recentReports.length === 0 && (
                <p className="px-4 py-6 text-xs text-[var(--muted-foreground)] text-center">{dictionary.dashboard.noReports}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
