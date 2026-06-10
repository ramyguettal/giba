import type { ThemeMode } from "./types";

export const THEME_COOKIE = "giba_theme";
export const DEFAULT_THEME: ThemeMode = "dark";

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark";
}
