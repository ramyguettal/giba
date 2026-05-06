import { NextResponse } from "next/server";

import { canAccessMachine, getSessionUser } from "@/lib/auth/session";
import { answerQuery } from "@/lib/mock-data";
import { ChatQueryPayload } from "@/lib/types";

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const payload = (await request.json()) as ChatQueryPayload;

  if (payload.machine_type && !canAccessMachine(user, payload.machine_type)) {
    return NextResponse.json(
      { error: "You are not authorized to query this machine scope." },
      { status: 403 },
    );
  }

  return NextResponse.json(
    answerQuery(user, payload.question, payload.machine_type, payload.locale),
  );
}
