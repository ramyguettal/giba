"use client";

import Link from "next/link";
import { Activity, BookOpenText, Bot, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Locale, User } from "@/lib/types";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

export function AppShell({
  user,
  locale,
  dictionary,
  children,
}: {
  user: User;
  locale: Locale;
  dictionary: Dictionary;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();

  const navItems: NavItem[] = [
    { href: "/chat", label: dictionary.shell.nav.chat, icon: Bot },
    { href: "/knowledge", label: dictionary.shell.nav.knowledge, icon: BookOpenText, adminOnly: true },
    { href: "/dashboard", label: dictionary.shell.nav.dashboard, icon: LayoutDashboard, adminOnly: true },
  ];

  async function handleLogout() {
    await auth.logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(31,78,121,0.08),_transparent_32%),_var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1680px] flex-col gap-5 px-4 py-4 lg:flex-row lg:px-6 lg:py-6">
        <aside className="w-full lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-80 lg:self-start">
          <Card className="h-full overflow-hidden border-white/70 bg-[color-mix(in_oklab,var(--card),white_18%)] backdrop-blur">
            <CardContent className="flex h-full flex-col gap-6 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm">
                      <Activity className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
                        GIBA
                      </p>
                      <h1 className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                        {dictionary.shell.product}
                      </h1>
                    </div>
                  </div>
                </div>
                <ShieldCheck className="mt-1 size-5 text-[var(--primary)]" />
              </div>

              <Card className="border-[var(--border)] bg-[var(--muted)]/60 shadow-none">
                <CardContent className="space-y-3 p-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{user.name}</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {dictionary.common.roleLabels[user.role]}
                    </p>
                  </div>
                  <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--background)]/80 p-3 text-xs leading-5 text-[var(--muted-foreground)]">
                    <span className="font-semibold text-[var(--foreground)]">{dictionary.shell.scope}:</span>{" "}
                    {user.allowedMachineTypes.join(", ")}
                  </div>
                </CardContent>
              </Card>

              <nav className="space-y-2">
                {navItems
                  .filter((item) => !item.adminOnly || user.role === "admin")
                  .map((item) => {
                    const active = pathname === item.href;
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
                          active
                            ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                            : "border-transparent text-[var(--muted-foreground)] hover:border-[var(--border)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
                        )}
                      >
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
              </nav>

              <div className="mt-auto space-y-3 pt-4">
                <LanguageSwitcher locale={locale} />
                <Button type="button" variant="outline" className="w-full justify-start" onClick={handleLogout}>
                  <LogOut className="size-4" />
                  {dictionary.common.signOut}
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col gap-5">
          <Card className="border-white/70 bg-[color-mix(in_oklab,var(--card),white_20%)] shadow-sm backdrop-blur">
            <CardContent className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {dictionary.shell.workspaceTitle}
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {dictionary.shell.workspaceDescription}
                </p>
              </div>
              <div className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
                Role-aware UI
              </div>
            </CardContent>
          </Card>

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
