import { NextResponse } from "next/server";

import { getAccessToken, getSessionUser } from "@/lib/auth/session";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const payload = (await request.json()) as {
    cleanFields: { clean_problem: string; clean_cause: string; clean_solution: string };
    instruction: string;
    locale?: string;
  };

  const token = await getAccessToken();

  const backendPayload = {
    clean_problem: payload.cleanFields.clean_problem,
    clean_cause: payload.cleanFields.clean_cause,
    clean_solution: payload.cleanFields.clean_solution,
    instruction: payload.instruction,
    locale: payload.locale || null,
  };

  const backendRes = await fetch(`${API_URL}/reports/modify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(backendPayload),
  });

  if (!backendRes.ok) {
    const body = await backendRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: body?.error?.message ?? body?.message ?? "Modification failed." },
      { status: backendRes.status },
    );
  }

  const data = await backendRes.json();
  return NextResponse.json(data);
}
