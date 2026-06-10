import { NextResponse } from "next/server";
import { getAccessToken, getSessionUser } from "@/lib/auth/session";
import type { ReportListItem } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function mapReport(r: Record<string, unknown>): ReportListItem {
  return {
    id: String(r.id ?? ""),
    userId: String(r.user_id ?? ""),
    username: String(r.username ?? ""),
    machineType: String(r.machine_type ?? ""),
    problem: String(r.problem ?? ""),
    cause: String(r.cause ?? ""),
    solution: String(r.solution ?? ""),
    cleanProblem: String(r.clean_problem ?? ""),
    cleanCause: String(r.clean_cause ?? ""),
    cleanSolution: String(r.clean_solution ?? ""),
    source: String(r.source ?? "repairer"),
    isIndexed: Boolean(r.is_indexed),
    createdAt: String(r.created_at ?? ""),
  };
}

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const token = await getAccessToken();
  const res = await fetch(`${API_URL}/reports?limit=200`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return NextResponse.json({ error: body?.message ?? "Failed to load reports." }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({
    reports: (data.reports ?? []).map(mapReport),
    total: data.total ?? 0,
  });
}
