"use client";

import { useState } from "react";
import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { languageNames } from "@/lib/i18n";
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
    <div className="inline-flex items-center border border-[var(--border)] bg-[var(--muted)]">
      <div className="px-2 text-[var(--muted-foreground)]">
        <Languages className="size-3" />
      </div>
      {Object.entries(languageNames).map(([code, label]) => {
        const active = locale === code;
        return (
          <Button
            key={code}
            variant={active ? "default" : "ghost"}
            size="sm"
            onClick={() => changeLanguage(code as Locale)}
            disabled={pending}
            className="h-7 px-2 text-[11px] rounded-none"
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
