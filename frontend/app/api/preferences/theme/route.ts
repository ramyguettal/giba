import { NextResponse } from "next/server";

import { isThemeMode, THEME_COOKIE } from "@/lib/theme";
import { ThemeMode } from "@/lib/types";

export async function POST(request: Request) {
  const payload = (await request.json()) as { theme?: ThemeMode };

  if (!isThemeMode(payload.theme)) {
    return NextResponse.json({ error: "Invalid theme." }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(THEME_COOKIE, payload.theme, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });

  return response;
}
