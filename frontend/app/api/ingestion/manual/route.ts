import { NextResponse } from "next/server";

import { canAccessMachine, getSessionUser } from "@/lib/auth/session";
import { createIngestionJob } from "@/lib/mock-data";

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const formData = await request.formData();
  const title = String(formData.get("title") || "");
  const machineType = String(formData.get("machineType") || "");
  const detail = String(formData.get("detail") || "");
  const file = formData.get("file");

  if (!canAccessMachine(user, machineType)) {
    return NextResponse.json({ error: "Machine scope is not allowed." }, { status: 403 });
  }

  const job = createIngestionJob({
    type: "manual",
    machineType,
    title,
    detail: `${detail || "Manual queued for indexing."}${file ? " File attached." : ""}`,
  });

  return NextResponse.json(job);
}
