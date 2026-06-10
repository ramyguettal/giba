"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="relative min-h-screen flex items-center justify-center bg-[var(--background)] p-4 overflow-hidden">
      {/* Ambient animated background */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="animate-blob absolute -top-32 -left-32 size-[28rem] rounded-full bg-[var(--primary)]/15 blur-3xl" />
        <div className="animate-blob-slow absolute -bottom-40 -right-24 size-[26rem] rounded-full bg-[var(--brand-red)]/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 75%)",
          }}
        />
      </div>

      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <LanguageSwitcher locale={locale} />
        <ThemeSwitcher theme={theme} dictionary={dictionary} />
      </div>

      <div className="relative w-full max-w-sm animate-scale-in">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/95 backdrop-blur shadow-[0_18px_50px_-18px_color-mix(in_oklab,var(--foreground)_28%,transparent)] overflow-hidden">
          {/* Brand stripe */}
          <div className="h-1 w-full bg-gradient-to-r from-[var(--primary)] via-[var(--primary)]/70 to-[var(--brand-red)]" />

          <div className="p-7 space-y-6">
            {/* Logo + heading */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="rounded-xl bg-white border border-[var(--border)] px-4 py-2.5 shadow-sm">
                  <Image src="/giba.png" alt="Groupe GIBA" width={132} height={74} priority className="object-contain" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <h1 className="text-lg font-bold tracking-tight text-[var(--foreground)]">
                  {dictionary.login.accessWorkspace}
                </h1>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {dictionary.login.accessDescription}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5 animate-slide-up" style={{ animationDelay: "60ms" }}>
                <Label className="text-xs font-medium">{dictionary.login.username}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[var(--muted-foreground)]" />
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    placeholder="your.username"
                    required
                    className="h-10 pl-9 text-sm rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1.5 animate-slide-up" style={{ animationDelay: "120ms" }}>
                <Label className="text-xs font-medium">{dictionary.login.password}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[var(--muted-foreground)]" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                    className="h-10 pl-9 pr-10 text-sm rounded-lg"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-[var(--destructive)]/30 bg-[var(--destructive)]/5 px-3 py-2 animate-slide-up">
                  <AlertCircle className="size-3.5 text-[var(--destructive)] mt-0.5 shrink-0" />
                  <p className="text-xs text-[var(--destructive)]">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={auth.loading}
                className="w-full h-10 text-sm rounded-lg gap-2 animate-slide-up transition-all hover:shadow-[0_8px_20px_-8px_var(--primary)]"
                style={{ animationDelay: "180ms" }}
              >
                {auth.loading
                  ? <><Loader2 className="size-4 animate-spin" /> {dictionary.login.signingIn}</>
                  : <>{dictionary.login.signIn} <ArrowRight className="size-4" /></>
                }
              </Button>
            </form>
          </div>
        </div>

        <p className="text-center text-[10px] text-[var(--muted-foreground)] mt-4 tracking-wide uppercase">
          Groupe GIBA · Maintenance AI
        </p>
      </div>
    </div>
  );
}
