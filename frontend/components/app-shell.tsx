"use client";

import Link from "next/link";
import {
  Activity,
  BookOpenText,
  Bot,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { User } from "@/lib/types";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

export function AppShell({
  user,
  dictionary,
  children,
}: {
  user: User;
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
    { href: "/settings", label: dictionary.shell.nav.settings, icon: Settings },
  ];

  async function handleLogout() {
    await auth.logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="min-h-screen lg:pl-76">
        <aside className="w-full border-b border-[var(--border)] bg-[var(--card)] lg:fixed lg:inset-y-0 lg:left-0 lg:w-76 lg:border-b-0 lg:border-r">
          <div className="h-full overflow-y-auto px-4 py-4 lg:px-5 lg:py-6">
            <div className="flex min-h-full flex-col">
              <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--muted)] text-[var(--primary)]">
                    <Activity className="size-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                      GIBA
                    </p>
                    <h1 className="mt-1 text-base font-semibold text-[var(--foreground)]">
                      {dictionary.shell.product}
                    </h1>
                  </div>
                </div>
                <ShieldCheck className="mt-1 size-5 text-[var(--primary)]" />
              </div>

              <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3">
                <p className="text-sm font-semibold text-[var(--foreground)]">{user.name}</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {dictionary.common.roleLabels[user.role]}
                </p>
                <p className="mt-3 text-xs leading-5 text-[var(--muted-foreground)]">
                  <span className="font-semibold text-[var(--foreground)]">{dictionary.shell.scope}:</span>{" "}
                  {user.allowedMachineTypes.join(", ")}
                </p>
              </div>

              <nav className="mt-5 space-y-1.5">
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
                          "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "border-[var(--primary)] bg-[var(--secondary)] text-[var(--foreground)]"
                            : "border-transparent text-[var(--muted-foreground)] hover:border-[var(--border)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
                        )}
                      >
                        <Icon className={cn("size-4", active && "text-[var(--primary)]")} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
              </nav>

              <div className="mt-auto space-y-2 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleLogout}
                >
                  <LogOut className="size-4" />
                  {dictionary.common.signOut}
                </Button>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-h-screen px-4 py-4 lg:px-6 lg:py-6">
          <div className="flex min-h-[calc(100vh-3rem)] flex-col gap-5">
            <main className="flex-1">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
