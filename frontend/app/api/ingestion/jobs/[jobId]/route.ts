import { NextResponse } from "next/server";

import { getAccessToken, getSessionUser } from "@/lib/auth/session";
import type { IngestionJob } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function mapJob(data: Record<string, unknown>): IngestionJob {
  return {
    id: String(data.job_id ?? ""),
    status: (data.status as IngestionJob["status"]) ?? "queued",
    type: (data.job_type as IngestionJob["type"]) ?? "manual",
    machineType: String(data.machine_type ?? ""),
    title: String(data.title ?? ""),
    detail: String(data.detail ?? ""),
    error: data.error ? String(data.error) : undefined,
    createdAt: new Date().toISOString(),
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { jobId } = await context.params;
  const token = await getAccessToken();

  const backendRes = await fetch(`${API_URL}/ingestion/jobs/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!backendRes.ok) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const data = await backendRes.json();
  return NextResponse.json(mapJob(data));
}
