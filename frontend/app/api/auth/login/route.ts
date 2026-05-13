import { NextResponse } from "next/server";

import { REFRESH_COOKIE, SESSION_COOKIE } from "@/lib/auth/session";
import type { LoginPayload, User } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function POST(request: Request) {
  const payload = (await request.json()) as LoginPayload;

  const authRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!authRes.ok) {
    const body = await authRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: body?.error?.message ?? body?.message ?? "Invalid credentials." },
      { status: authRes.status },
    );
  }

  const tokens = (await authRes.json()) as {
    access_token: string;
    refresh_token: string;
  };

  const meRes = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!meRes.ok) {
    return NextResponse.json({ error: "Failed to fetch user profile." }, { status: 502 });
  }

  const me = (await meRes.json()) as {
    id: string;
    username: string;
    role: string;
    allowed_machines: string[];
  };

  const user: User = {
    id: me.id,
    name: me.username,
    role: me.role as User["role"],
    allowedMachineTypes: me.allowed_machines,
  };

  const response = NextResponse.json({ user, accessToken: tokens.access_token });

  response.cookies.set(SESSION_COOKIE, tokens.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  response.cookies.set(REFRESH_COOKIE, tokens.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return response;
}
