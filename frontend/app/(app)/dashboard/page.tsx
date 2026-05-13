import { redirect } from "next/navigation";
import type { DashboardStats, IngestionJob } from "@/lib/types";

import { DashboardOverview } from "@/components/dashboard-overview";
import { getSessionUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";

export default async function DashboardPage() {
  const user = await getSessionUser();
  const locale = await getLocaleFromCookies();

  if (!user) {
    return null;
  }

  if (user.role !== "admin") {
    redirect("/unauthorized");
  }

  const stats: DashboardStats = {
    totalReports: 0,
    totalQueries: 0,
    lowConfidenceQueries: 0,
    activeJobs: 0,
    reportsByMachine: {},
    recentActivity: [],
  };

  const jobs: IngestionJob[] = [];

  const recentQueries: Array<{
    id: string;
    question: string;
    createdAt: string;
    confidenceLevel: string;
  }> = [];

  const recentReports: Array<{
    id: string;
    machine_type: string;
    createdAt: string;
  }> = [];

  return (
    <DashboardOverview
      stats={stats}
      jobs={jobs}
      recentQueries={recentQueries}
      recentReports={recentReports}
      locale={locale}
      dictionary={getDictionary(locale)}
    />
  );
}
