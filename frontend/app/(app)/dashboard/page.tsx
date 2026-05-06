import { redirect } from "next/navigation";

import { DashboardOverview } from "@/components/dashboard-overview";
import { getSessionUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";
import {
  getDashboardStats,
  getRecentQueries,
  getRecentReports,
  listIngestionJobs,
} from "@/lib/mock-data";

export default async function DashboardPage() {
  const user = await getSessionUser();
  const locale = await getLocaleFromCookies();

  if (!user) {
    return null;
  }

  if (user.role !== "admin") {
    redirect("/unauthorized");
  }

  return (
    <DashboardOverview
      stats={getDashboardStats()}
      jobs={listIngestionJobs().slice(0, 5)}
      recentQueries={getRecentQueries()}
      recentReports={getRecentReports()}
      locale={locale}
      dictionary={getDictionary(locale)}
    />
  );
}
