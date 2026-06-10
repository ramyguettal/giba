import { cookies } from "next/headers";

import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "./i18n";
import type { Locale } from "./types";

/** Read the persisted locale from cookies (server components / route handlers). */
export async function getLocaleFromCookies(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
