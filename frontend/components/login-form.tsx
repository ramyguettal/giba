"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Activity } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Dictionary } from "@/lib/i18n";
import { Locale, ThemeMode } from "@/lib/types";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LanguageSwitcher } from "@/components/language-switcher";

export function LoginForm({
  locale,
  theme,
  dictionary,
}: {
  locale: Locale;
  theme: ThemeMode;
  dictionary: Dictionary;
}) {
  const auth = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await auth.login({ username, password });
      router.push("/chat");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Sign in failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageSwitcher locale={locale} />
        <ThemeSwitcher theme={theme} dictionary={dictionary} />
      </div>

      <Card className="w-full max-w-sm border border-[var(--border)] bg-[var(--card)]">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center size-8 bg-[var(--primary)] text-[var(--primary-foreground)]">
                <Activity className="size-4" />
              </div>
              <span className="text-xs font-semibold tracking-widest uppercase text-[var(--muted-foreground)]">
                GIBA
              </span>
            </div>
            <h1 className="text-base font-semibold text-[var(--foreground)]">
              {dictionary.login.accessWorkspace}
            </h1>
            <p className="text-xs text-[var(--muted-foreground)]">
              {dictionary.login.accessDescription}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{dictionary.login.username}</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{dictionary.login.password}</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            {error && (
              <div className="border border-[var(--destructive)]/30 bg-[var(--destructive)]/5 px-3 py-2 text-xs text-[var(--destructive)]">
                {error}
              </div>
            )}
            <Button type="submit" disabled={auth.loading} className="w-full h-9 text-xs">
              {auth.loading ? dictionary.login.signingIn : dictionary.login.signIn}
              <ArrowRight className="size-3.5 ml-1.5" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
