import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { REFRESH_COOKIE, SESSION_COOKIE, getSessionUser } from "@/lib/auth/session";
import type { User } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "No active session to refresh." }, { status: 401 });
  }

  const authRes = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!authRes.ok) {
    const body = await authRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: body?.error?.message ?? body?.message ?? "Session expired." },
      { status: authRes.status },
    );
  }

  const tokens = (await authRes.json()) as {
    access_token: string;
    refresh_token: string;
  };

  const user: User | null = await getSessionUser();

  const response = NextResponse.json({
    user: user ?? { id: "", name: "", role: "repairer", allowedMachineTypes: [] },
    accessToken: tokens.access_token,
  });

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
