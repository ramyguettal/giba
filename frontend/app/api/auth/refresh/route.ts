import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth/session";
import { refreshSession } from "@/lib/mock-data";

export async function POST(request: Request) {
  const token = request.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.split("=")[1];

  const session = refreshSession(token ?? "");

  if (!session) {
    return NextResponse.json({ error: "No active session to refresh." }, { status: 401 });
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
