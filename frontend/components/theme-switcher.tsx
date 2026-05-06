"use client";

import { Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dictionary } from "@/lib/i18n";
import { ThemeMode } from "@/lib/types";
import { cn } from "@/lib/utils";

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
    <div className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--background)] p-1">
      <div className="px-1.5 text-[var(--muted-foreground)]">
        {theme === "dark" ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
      </div>

      <Button
        type="button"
        size="sm"
        variant={theme === "light" ? "default" : "ghost"}
        onClick={() => changeTheme("light")}
        disabled={pending}
        className={cn("h-7 px-2 text-[11px]", theme !== "light" && "text-[var(--muted-foreground)]")}
      >
        {dictionary.common.light}
      </Button>

      <Button
        type="button"
        size="sm"
        variant={theme === "dark" ? "default" : "ghost"}
        onClick={() => changeTheme("dark")}
        disabled={pending}
        className={cn("h-7 px-2 text-[11px]", theme !== "dark" && "text-[var(--muted-foreground)]")}
      >
        {dictionary.common.dark}
      </Button>
    </div>
  );
}
