import { NextResponse } from "next/server";

import { canAccessMachine, getAccessToken, getSessionUser } from "@/lib/auth/session";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const payload = await request.json();

  if (!canAccessMachine(user, payload.machine_type)) {
    return NextResponse.json(
      { error: "You are not authorized to submit reports for this machine." },
      { status: 403 },
    );
  }

  const token = await getAccessToken();

  const backendPayload = {
    problem: payload.problem,
    cause: payload.cause,
    solution: payload.solution,
    machine_type: payload.machine_type,
    clean_problem: payload.clean_problem,
    clean_cause: payload.clean_cause,
    clean_solution: payload.clean_solution,
    locale: payload.locale || null,
  };

  const backendRes = await fetch(`${API_URL}/reports/commit`, {
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
      { error: body?.error?.message ?? body?.message ?? "Commit failed." },
      { status: backendRes.status },
    );
  }

  const data = await backendRes.json();

  return NextResponse.json(
    {
      id: data.report_id,
      machine_type: payload.machine_type,
    },
    { status: 201 },
  );
}
