import { NextResponse } from "next/server";

import { canAccessMachine, getAccessToken, getSessionUser } from "@/lib/auth/session";
import type { ChatAnswer, Citation, ConfidenceLevel } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function mapConfidence(score: number): ConfidenceLevel {
  if (score >= 0.7) return "high";
  if (score >= 0.4) return "medium";
  return "low";
}

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const payload = await request.json();

  if (payload.machine_type && !canAccessMachine(user, payload.machine_type)) {
    return NextResponse.json(
      { error: "You are not authorized to query this machine scope." },
      { status: 403 },
    );
  }

  const token = await getAccessToken();

  const backendPayload = {
    question: payload.question,
    machine_type: payload.machine_type || null,
    locale: payload.locale || null,
    top_k: payload.top_k ?? 5,
  };

  const backendRes = await fetch(`${API_URL}/chat/query`, {
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
      { error: body?.error?.message ?? body?.message ?? "Chat request failed." },
      { status: backendRes.status },
    );
  }

  const data = await backendRes.json();

  const citations: Citation[] = (data.citations ?? []).map((c: Record<string, unknown>) => ({
    id: String(c.chunk_id ?? ""),
    title: String(c.source ?? "Reference"),
    source: String(c.source ?? ""),
    machine_type: String(c.machine_type ?? ""),
    excerpt: String(c.snippet ?? "").slice(0, 400),
    score: Number(c.score ?? 0),
    section: c.section ? String(c.section) : undefined,
    page: c.page ? Number(c.page) : undefined,
  }));

  const answer: ChatAnswer = {
    answer: String(data.answer ?? ""),
    confidenceScore: Number(data.confidence ?? 0),
    confidenceLevel: mapConfidence(Number(data.confidence ?? 0)),
    citations,
    mode: String(data.mode ?? "answer") as "answer" | "clarify",
    clarificationQuestion:
      data.mode === "clarify" ? "Could you provide more detail about the issue?" : undefined,
  };

  return NextResponse.json(answer);
}
