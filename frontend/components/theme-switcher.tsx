"use client";

import { Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dictionary } from "@/lib/i18n";
import { ThemeMode } from "@/lib/types";

export function ThemeSwitcher({
  theme,
  dictionary,
}: {
  theme: ThemeMode;
  dictionary: Pick<Dictionary, "common">;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function changeTheme(nextTheme: ThemeMode) {
    setPending(true);
    try {
      await fetch("/api/preferences/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: nextTheme }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="inline-flex items-center border border-[var(--border)] bg-[var(--muted)]">
      <Button
        variant={theme === "light" ? "default" : "ghost"}
        size="sm"
        onClick={() => changeTheme("light")}
        disabled={pending}
        className="h-7 px-2 text-[11px] rounded-none"
      >
        <Sun className="size-3 mr-1" />
        {dictionary.common.light}
      </Button>
      <Button
        variant={theme === "dark" ? "default" : "ghost"}
        size="sm"
        onClick={() => changeTheme("dark")}
        disabled={pending}
        className="h-7 px-2 text-[11px] rounded-none"
      >
        <Moon className="size-3 mr-1" />
        {dictionary.common.dark}
      </Button>
    </div>
  );
}
