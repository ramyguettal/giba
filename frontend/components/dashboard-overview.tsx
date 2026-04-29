import { Activity, BookMarked, CircleAlert, FileCheck2, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dictionary } from "@/lib/i18n";
import { DashboardStats, IngestionJob, Locale } from "@/lib/types";

function getConfidenceVariant(level: string) {
  if (level === "high") {
    return "success" as const;
  }

  if (level === "medium") {
    return "warning" as const;
  }

  return "destructive" as const;
}

function getJobVariant(status: IngestionJob["status"]) {
  if (status === "completed") {
    return "success" as const;
  }

  if (status === "failed") {
    return "destructive" as const;
  }

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
    {
      label: dictionary.dashboard.cards.reports,
      value: stats.totalReports,
      icon: FileCheck2,
    },
    {
      label: dictionary.dashboard.cards.queries,
      value: stats.totalQueries,
      icon: Activity,
    },
    {
      label: dictionary.dashboard.cards.lowConfidence,
      value: stats.lowConfidenceQueries,
      icon: CircleAlert,
    },
    {
      label: dictionary.dashboard.cards.jobs,
      value: stats.activeJobs,
      icon: BookMarked,
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-[var(--border)] bg-[var(--card)] shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl">{dictionary.dashboard.title}</CardTitle>
          <CardDescription className="max-w-3xl leading-6">
            {dictionary.dashboard.description}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.label} className="border-[var(--border)] bg-[var(--card)] shadow-none">
              <CardContent className="flex items-start justify-between p-5">
                <div>
                  <p className="text-sm font-medium text-[var(--muted-foreground)]">{card.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">{card.value}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-3">
                  <Icon className="size-5 text-[var(--primary)]" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.95fr)]">
        <Card className="border-[var(--border)] bg-[var(--card)] shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wrench className="size-5 text-[var(--primary)]" />
              {dictionary.dashboard.recentJobs}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-3xl border border-[var(--border)] bg-[var(--muted)] p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[var(--foreground)]">{job.title}</p>
                      <Badge variant={getJobVariant(job.status)} className="capitalize">
                        {job.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{job.detail}</p>
                  </div>
                  <div className="text-right text-xs text-[var(--muted-foreground)]">
                    <p>{job.machineType}</p>
                    <p className="mt-1 capitalize">{job.type}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-[var(--border)] bg-[var(--card)] shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">{dictionary.dashboard.recentQueries}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentQueries.length ? (
                recentQueries.map((query) => (
                  <div
                    key={query.id}
                    className="rounded-3xl border border-[var(--border)] bg-[var(--muted)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--foreground)]">{query.question}</p>
                      <Badge variant={getConfidenceVariant(query.confidenceLevel)} className="capitalize">
                        {query.confidenceLevel}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                      {new Date(query.createdAt).toLocaleString(locale)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--muted-foreground)]">{dictionary.dashboard.noQueries}</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-[var(--border)] bg-[var(--card)] shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">{dictionary.dashboard.recentReports}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentReports.length ? (
                recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-3xl border border-[var(--border)] bg-[var(--muted)] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--foreground)]">{report.id}</p>
                      <Badge variant="outline">{report.machine_type}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                      {new Date(report.createdAt).toLocaleString(locale)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--muted-foreground)]">{dictionary.dashboard.noReports}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
