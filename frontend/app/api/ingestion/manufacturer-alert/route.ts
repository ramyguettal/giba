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

  const payload = (await request.json()) as {
    title: string;
    machineType: string;
    detail: string;
  };

  if (!canAccessMachine(user, payload.machineType)) {
    return NextResponse.json({ error: "Machine scope is not allowed." }, { status: 403 });
  }

  return NextResponse.json(
    createIngestionJob({
      type: "manufacturer-alert",
      machineType: payload.machineType,
      title: payload.title,
      detail: payload.detail,
    }),
  );
}
