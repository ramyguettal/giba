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
    <div className="space-y-6">
      <Card className="border-[var(--border)] bg-[var(--card)] shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl">{dictionary.settings.title}</CardTitle>
          <CardDescription>{dictionary.settings.description}</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-[var(--border)] bg-[var(--card)] shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="size-5 text-[var(--primary)]" />
              {dictionary.settings.appearance}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ThemeSwitcher theme={theme} dictionary={dictionary} />
          </CardContent>
        </Card>

        <Card className="border-[var(--border)] bg-[var(--card)] shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe2 className="size-5 text-[var(--primary)]" />
              {dictionary.settings.language}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LanguageSwitcher locale={locale} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-[var(--border)] bg-[var(--card)] shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">{dictionary.settings.account}</CardTitle>
          <CardDescription>
            {user.name} - {dictionary.common.roleLabels[user.role]}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
