"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { DashboardOverview } from "@/components/dashboard-overview";
import { Dictionary } from "@/lib/i18n";
import { DashboardStats, IngestionJob, Locale } from "@/lib/types";

export function DashboardClient({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    totalQueries: 0,
    lowConfidenceQueries: 0,
    activeJobs: 0,
    reportsByMachine: {},
    recentActivity: [],
  });
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [recentQueries, setRecentQueries] = useState<
    Array<{ id: string; question: string; createdAt: string; confidenceLevel: string }>
  >([]);
  const [recentReports, setRecentReports] = useState<
    Array<{ id: string; machine_type: string; createdAt: string }>
  >([]);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        return res.json();
      })
      .then((data) => {
        setStats(data.stats);
        setJobs(data.jobs);
        setRecentQueries(data.recentQueries);
        setRecentReports(data.recentReports);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] py-12 justify-center">
        <Loader2 className="size-4 animate-spin text-[var(--primary)]" />
        Loading dashboard…
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-[var(--destructive)]/30 bg-[var(--destructive)]/5 px-4 py-3 text-sm text-[var(--destructive)] rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <DashboardOverview
      stats={stats}
      jobs={jobs}
      recentQueries={recentQueries}
      recentReports={recentReports}
      locale={locale}
      dictionary={dictionary}
    />
  );
}
