"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bot,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings,
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
    { href: "/dashboard", label: dictionary.shell.nav.dashboard, icon: LayoutDashboard, adminOnly: true },
    { href: "/reports", label: dictionary.shell.nav.reports, icon: ClipboardList, adminOnly: true },
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

  const isChat = pathname === "/chat" || pathname.startsWith("/chat/");

  return (
    <div className="h-screen flex bg-[var(--background)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 border-r border-[var(--border)] bg-[var(--card)] flex flex-col shrink-0 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-[var(--border)]">
          <div className="flex items-center justify-center w-12 h-8 rounded-lg bg-white border border-[var(--border)] overflow-hidden shrink-0">
            <Image src="/giba.png" alt="Groupe GIBA" width={44} height={26} className="object-contain" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-[var(--foreground)]">GIBA</span>
            <p className="text-[10px] text-[var(--muted-foreground)] leading-none">Maintenance AI</p>
          </div>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
          <Avatar className="size-8">
            <AvatarFallback className="bg-[var(--primary)]/10 text-[var(--primary)] text-[11px] font-semibold border border-[var(--primary)]/20">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[var(--foreground)] truncate">{user.name}</p>
            <p className="text-[10px] text-[var(--muted-foreground)]">
              {dictionary.common.roleLabels[user.role]}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems
            .filter((item) => !item.adminOnly || user.role === "admin")
            .map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-lg transition-all duration-150",
                        active
                          ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20"
                          : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]",
                      )}
                    >
                      <Icon className={cn("size-4 shrink-0", active && "text-[var(--primary)]")} />
                      <span>{item.label}</span>
                      {active && (
                        <div className="ml-auto size-1.5 rounded-full bg-[var(--primary)]" />
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
        </nav>

        {/* Machine scope badge */}
        {user.allowedMachineTypes.length > 0 && (
          <div className="px-4 py-2 border-t border-[var(--border)]">
            <p className="text-[9px] uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">Authorized</p>
            <div className="flex flex-wrap gap-1">
              {user.allowedMachineTypes.map((m) => (
                <span key={m} className="text-[10px] font-mono bg-[var(--muted)] border border-[var(--border)] px-1.5 py-0.5 rounded text-[var(--foreground)]">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="px-2 py-3 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/5 rounded-lg transition-all duration-150"
          >
            <LogOut className="size-4 shrink-0" />
            <span>{dictionary.common.signOut}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={cn("flex-1 h-screen", isChat ? "overflow-hidden" : "overflow-y-auto")}>
        <div className={cn("h-full animate-in", !isChat && "p-5 lg:p-6")}>
          {children}
        </div>
      </main>
    </div>
  );
}
