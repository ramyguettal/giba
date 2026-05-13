import { NextResponse } from "next/server";

import { canAccessMachine, getAccessToken, getSessionUser } from "@/lib/auth/session";
import type { IngestionJob } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function mapJob(data: Record<string, unknown>): IngestionJob {
  return {
    id: String(data.job_id ?? ""),
    status: (data.status as IngestionJob["status"]) ?? "queued",
    type: (data.job_type as IngestionJob["type"]) ?? "manufacturer-alert",
    machineType: String(data.machine_type ?? ""),
    title: String(data.title ?? ""),
    detail: String(data.detail ?? ""),
    error: data.error ? String(data.error) : undefined,
    createdAt: new Date().toISOString(),
  };
}

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

  const token = await getAccessToken();
  const idempotencyKey = crypto.randomUUID();

  const backendPayload = {
    title: payload.title,
    machine_type: payload.machineType,
    detail: payload.detail,
  };

  const backendRes = await fetch(`${API_URL}/ingestion/manufacturer-alert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(backendPayload),
  });

  if (!backendRes.ok) {
    const body = await backendRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: body?.error?.message ?? body?.message ?? "Ingestion request failed." },
      { status: backendRes.status },
    );
  }

  const data = await backendRes.json();
  return NextResponse.json(mapJob(data));
}
