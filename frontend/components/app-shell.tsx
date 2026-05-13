"use client";

import Link from "next/link";
import {
  Activity,
  BookOpenText,
  Bot,
  LayoutDashboard,
  LogOut,
  Settings,
  ChevronRight,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r border-[var(--border)] bg-[var(--card)] flex flex-col shrink-0">
        <div className="flex items-center gap-3 px-4 h-14 border-b border-[var(--border)]">
          <div className="flex items-center justify-center size-8 bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold">
            <Activity className="size-4" />
          </div>
          <div className="text-xs font-semibold tracking-widest uppercase text-[var(--muted-foreground)]">
            GIBA
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
          <Avatar className="size-8">
            <AvatarFallback className="bg-[var(--secondary)] text-[var(--secondary-foreground)] text-[11px] font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[var(--foreground)] truncate">{user.name}</p>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              {dictionary.common.roleLabels[user.role]}
            </p>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems
            .filter((item) => !item.adminOnly || user.role === "admin")
            .map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-xs font-medium transition-colors border-l-2",
                        active
                          ? "border-l-[var(--primary)] text-[var(--foreground)] bg-[var(--secondary)]"
                          : "border-l-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]",
                      )}
                    >
                      <Icon className={cn("size-4 shrink-0", active && "text-[var(--primary)]")} />
                      <span>{item.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
        </nav>

        <div className="px-2 py-3 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
          >
            <LogOut className="size-4 shrink-0" />
            <span>{dictionary.common.signOut}</span>
            <ChevronRight className="size-3 ml-auto" />
          </button>
        </div>
      </aside>

      <main className="flex-1 min-h-screen">
        <div className="h-full p-4 lg:p-6">
          <div className="animate-in">{children}</div>
        </div>
      </main>
    </div>
  );
}
