import { NextResponse } from "next/server";

import { canAccessMachine, getSessionUser } from "@/lib/auth/session";
import { commitReport } from "@/lib/mock-data";
import { CommitReportPayload } from "@/lib/types";

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const payload = (await request.json()) as CommitReportPayload;

  if (!canAccessMachine(user, payload.machine_type)) {
    return NextResponse.json(
      { error: "You are not authorized to submit reports for this machine." },
      { status: 403 },
    );
  }

  return NextResponse.json(commitReport(user, payload));
}
