"use client";

import { useState } from "react";
import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { languageNames } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Locale } from "@/lib/types";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function changeLanguage(nextLocale: Locale) {
    setPending(true);

    try {
      await fetch("/api/preferences/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: nextLocale }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] p-1 shadow-sm">
      <div className="flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
        <Languages className="size-3.5" />
        <span className="hidden sm:inline">Lang</span>
      </div>
      {Object.entries(languageNames).map(([code, label]) => {
        const active = locale === code;

        return (
          <Button
            key={code}
            type="button"
            size="sm"
            variant={active ? "default" : "ghost"}
            onClick={() => changeLanguage(code as Locale)}
            disabled={pending}
            className={cn("h-8 px-2.5 text-xs", !active && "text-[var(--muted-foreground)]")}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
