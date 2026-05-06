import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { AuthProviderShell } from "@/components/auth-provider-shell";
import { getSessionUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();
  const locale = await getLocaleFromCookies();

  if (!user) {
    redirect("/login");
  }

  return (
    <AuthProviderShell initialUser={user}>
      <AppShell user={user} dictionary={getDictionary(locale)}>
        {children}
      </AppShell>
    </AuthProviderShell>
  );
}
