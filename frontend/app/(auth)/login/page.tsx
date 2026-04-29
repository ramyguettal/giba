import { redirect } from "next/navigation";

import { AuthProviderShell } from "@/components/auth-provider-shell";
import { LoginForm } from "@/components/login-form";
import { getSessionUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";

export default async function LoginPage() {
  const user = await getSessionUser();
  const locale = await getLocaleFromCookies();

  if (user) {
    redirect("/chat");
  }

  return (
    <AuthProviderShell initialUser={null}>
      <LoginForm locale={locale} dictionary={getDictionary(locale)} />
    </AuthProviderShell>
  );
}
