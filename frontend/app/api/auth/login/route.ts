import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth/session";
import { loginUser } from "@/lib/mock-data";
import { LoginPayload } from "@/lib/types";

export async function POST(request: Request) {
  const payload = (await request.json()) as LoginPayload;
  const session = loginUser(payload);

  if (!session) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const response = NextResponse.json(session);
  response.cookies.set(SESSION_COOKIE, session.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  });

  return response;
}
