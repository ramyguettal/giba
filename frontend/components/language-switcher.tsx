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
    <div className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--background)] p-1">
      <div className="px-1.5 text-[var(--muted-foreground)]">
        <Languages className="size-3.5" />
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
            className={cn("h-7 px-2 text-[11px]", !active && "text-[var(--muted-foreground)]")}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
