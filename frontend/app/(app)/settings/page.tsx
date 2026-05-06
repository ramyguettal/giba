import { SettingsPanel } from "@/components/settings-panel";
import { getSessionUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";
import { getThemeFromCookies } from "@/lib/theme-server";

export default async function SettingsPage() {
  const user = await getSessionUser();
  const locale = await getLocaleFromCookies();
  const theme = await getThemeFromCookies();

  if (!user) {
    return null;
  }

  return (
    <SettingsPanel
      user={user}
      locale={locale}
      theme={theme}
      dictionary={getDictionary(locale)}
    />
  );
}
