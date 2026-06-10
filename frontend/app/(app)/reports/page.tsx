import { redirect } from "next/navigation";

import { ReportsAdmin } from "@/components/reports-admin";
import { getSessionUser } from "@/lib/auth/session";

export default async function ReportsPage() {
  const user = await getSessionUser();

  if (!user) return null;
  if (user.role !== "admin") redirect("/unauthorized");

  return (
    <div className="max-w-5xl mx-auto">
      <ReportsAdmin />
    </div>
  );
}
