"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Bot, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Dictionary } from "@/lib/i18n";
import { Locale } from "@/lib/types";

const demoAccounts = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "repairer", password: "repair123", role: "repairer" },
  { username: "supervisor", password: "super123", role: "supervisor" },
] as const;

export function LoginForm({ locale, dictionary }: { locale: Locale; dictionary: Dictionary }) {
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
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : dictionary.login.unableToSignIn);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(31,78,121,0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(46,107,79,0.09),_transparent_26%),var(--background)]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1680px] gap-6 px-4 py-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-6 lg:py-8">
        <section className="hidden lg:flex">
          <Card className="w-full border-white/70 bg-[color-mix(in_oklab,var(--card),white_20%)] shadow-xl backdrop-blur">
            <CardContent className="flex h-full flex-col justify-between p-10 xl:p-12">
              <div>
                <div className="inline-flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--background)]/80 px-4 py-2 text-sm font-medium text-[var(--muted-foreground)]">
                  <Bot className="size-4 text-[var(--primary)]" />
                  {dictionary.login.platform}
                </div>
                <h1 className="mt-8 max-w-2xl text-5xl font-semibold leading-[1.05] tracking-tight text-[var(--foreground)]">
                  {dictionary.login.heroTitle}
                </h1>
                <p className="mt-6 max-w-xl text-base leading-8 text-[var(--muted-foreground)]">
                  {dictionary.login.heroDescription}
                </p>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <Card className="border-[var(--border)] bg-[var(--background)]/80 shadow-none">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="size-4 text-[var(--primary)]" />
                      {dictionary.login.repairWorkflowTitle}
                    </CardTitle>
                    <CardDescription>{dictionary.login.repairWorkflowDescription}</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="border-[var(--border)] bg-[var(--background)]/80 shadow-none">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ShieldCheck className="size-4 text-[var(--success)]" />
                      {dictionary.login.roleAccessTitle}
                    </CardTitle>
                    <CardDescription>{dictionary.login.roleAccessDescription}</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="flex items-center justify-center">
          <Card className="w-full max-w-xl border-white/70 bg-[color-mix(in_oklab,var(--card),white_22%)] shadow-xl backdrop-blur">
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm">
                    <KeyRound className="size-5" />
                  </div>
                  <CardTitle className="mt-5 text-3xl">{dictionary.login.accessWorkspace}</CardTitle>
                  <CardDescription className="mt-2 max-w-md leading-6">
                    {dictionary.login.accessDescription}
                  </CardDescription>
                </div>
                <LanguageSwitcher locale={locale} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label>{dictionary.login.username}</Label>
                  <Input value={username} onChange={(event) => setUsername(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{dictionary.login.password}</Label>
                  <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
                </div>
                {error ? (
                  <div className="rounded-lg border border-[var(--danger-border)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--destructive)]">
                    {error}
                  </div>
                ) : null}
                <Button type="submit" disabled={auth.loading} className="w-full">
                  {auth.loading ? dictionary.login.signingIn : dictionary.login.signIn}
                  <ArrowRight className="size-4" />
                </Button>
              </form>

              <Card className="border-[var(--border)] bg-[var(--muted)]/50 shadow-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">{dictionary.login.demoAccounts}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {demoAccounts.map((account) => (
                    <button
                      key={account.username}
                      type="button"
                      onClick={() => {
                        setUsername(account.username);
                        setPassword(account.password);
                      }}
                      className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-left transition-colors hover:border-[var(--ring)] hover:bg-[var(--accent)]"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          {dictionary.common.roleLabels[account.role]}
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{account.username}</p>
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)]">{account.password}</span>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
