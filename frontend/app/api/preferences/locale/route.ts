import { NextResponse } from "next/server";

import { isLocale, LOCALE_COOKIE } from "@/lib/i18n";
import { Locale } from "@/lib/types";

export async function POST(request: Request) {
  const payload = (await request.json()) as { locale?: Locale };

  if (!isLocale(payload.locale)) {
    return NextResponse.json({ error: "Invalid locale." }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(LOCALE_COOKIE, payload.locale, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });

  return response;
}
