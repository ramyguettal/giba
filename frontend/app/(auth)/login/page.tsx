import { redirect } from "next/navigation";

import { AuthProviderShell } from "@/components/auth-provider-shell";
import { LoginForm } from "@/components/login-form";
import { getSessionUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";
import { getThemeFromCookies } from "@/lib/theme-server";

export default async function LoginPage() {
  const user = await getSessionUser();
  const locale = await getLocaleFromCookies();
  const theme = await getThemeFromCookies();

  if (user) {
    redirect("/chat");
  }

  return (
    <AuthProviderShell initialUser={null}>
      <LoginForm locale={locale} theme={theme} dictionary={getDictionary(locale)} />
    </AuthProviderShell>
  );
}
