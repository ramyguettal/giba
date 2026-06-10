import { NextResponse } from "next/server";
import { getAccessToken, getSessionUser } from "@/lib/auth/session";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function DELETE(_req: Request, { params }: { params: Promise<{ reportId: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { reportId } = await params;
  const token = await getAccessToken();

  const res = await fetch(`${API_URL}/reports/${reportId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    return NextResponse.json({ error: body?.message ?? "Delete failed." }, { status: res.status });
  }

  return NextResponse.json({ ok: true });
}
