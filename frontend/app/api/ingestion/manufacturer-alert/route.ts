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
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const contentType = request.headers.get("content-type") ?? "";
  let title = "", machineType = "", detail = "";
  let file: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    title = String(form.get("title") ?? "");
    machineType = String(form.get("machineType") ?? "");
    detail = String(form.get("detail") ?? "");
    const f = form.get("file");
    if (f instanceof File && f.size > 0) file = f;
  } else {
    const body = await request.json() as { title: string; machineType: string; detail: string };
    title = body.title ?? "";
    machineType = body.machineType ?? "";
    detail = body.detail ?? "";
  }

  if (!canAccessMachine(user, machineType)) {
    return NextResponse.json({ error: "Machine scope is not allowed." }, { status: 403 });
  }

  const token = await getAccessToken();
  const idempotencyKey = crypto.randomUUID();

  const backendForm = new FormData();
  backendForm.append("title", title);
  backendForm.append("machine_type", machineType);
  backendForm.append("detail", detail);
  if (file) backendForm.append("file", file);

  const backendRes = await fetch(`${API_URL}/ingestion/manufacturer-alert`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Idempotency-Key": idempotencyKey },
    body: backendForm,
  });

  if (!backendRes.ok) {
    const body = await backendRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: body?.error?.message ?? body?.message ?? "Ingestion request failed." },
      { status: backendRes.status },
    );
  }

  return NextResponse.json(mapJob(await backendRes.json()));
}
