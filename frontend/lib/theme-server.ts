import { cookies } from "next/headers";

import { DEFAULT_THEME, THEME_COOKIE, isThemeMode } from "./theme";
import type { ThemeMode } from "./types";

/** Read the persisted theme from cookies (server components / route handlers). */
export async function getThemeFromCookies(): Promise<ThemeMode> {
  const store = await cookies();
  const value = store.get(THEME_COOKIE)?.value;
  return isThemeMode(value) ? value : DEFAULT_THEME;
}
