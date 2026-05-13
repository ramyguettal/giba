"use client";

import { Globe2, Palette } from "lucide-react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dictionary } from "@/lib/i18n";
import { Locale, ThemeMode, User } from "@/lib/types";

export function SettingsPanel({
  user,
  locale,
  theme,
  dictionary,
}: {
  user: User;
  locale: Locale;
  theme: ThemeMode;
  dictionary: Dictionary;
}) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-lg font-semibold">{dictionary.settings.title}</h1>
        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{dictionary.settings.description}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="px-4 py-3 border-b border-[var(--border)]">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold">
              <Palette className="size-4 text-[var(--primary)]" />
              {dictionary.settings.appearance}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ThemeSwitcher theme={theme} dictionary={dictionary} />
          </CardContent>
        </Card>

        <Card className="border border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="px-4 py-3 border-b border-[var(--border)]">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold">
              <Globe2 className="size-4 text-[var(--primary)]" />
              {dictionary.settings.language}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <LanguageSwitcher locale={locale} />
          </CardContent>
        </Card>
      </div>

      <Card className="border border-[var(--border)] bg-[var(--card)]">
        <CardHeader className="px-4 py-3 border-b border-[var(--border)]">
          <CardTitle className="text-xs font-semibold">{dictionary.settings.account}</CardTitle>
          <CardDescription className="text-[11px]">
            {user.name} - {dictionary.common.roleLabels[user.role]}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
