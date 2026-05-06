import { redirect } from "next/navigation";

import { KnowledgeAdmin } from "@/components/knowledge-admin";
import { getSessionUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";
import { listIngestionJobs } from "@/lib/mock-data";

export default async function KnowledgePage() {
  const user = await getSessionUser();
  const locale = await getLocaleFromCookies();

  if (!user) {
    return null;
  }

  if (user.role !== "admin") {
    redirect("/unauthorized");
  }

  return (
    <KnowledgeAdmin
      user={user}
      locale={locale}
      dictionary={getDictionary(locale)}
      initialJobs={listIngestionJobs()}
    />
  );
}
