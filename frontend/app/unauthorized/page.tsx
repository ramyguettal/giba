import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";

export default async function UnauthorizedPage() {
  const locale = await getLocaleFromCookies();
  const dictionary = getDictionary(locale);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-page)] px-5">
      <Card className="w-full max-w-xl border-white/70 bg-[var(--card)]/95 text-center shadow-[var(--shadow-panel)]">
        <CardContent className="p-8">
          <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-[var(--danger-soft)] text-[var(--destructive)]">
            <ShieldAlert className="size-6" />
          </div>
          <p className="mt-5 text-sm font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
            {dictionary.unauthorized.title}
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-[var(--foreground)]">
            {dictionary.unauthorized.heading}
          </h1>
          <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
            {dictionary.unauthorized.description}
          </p>
          <Button asChild className="mt-8 rounded-xl px-5">
            <Link href="/chat">{dictionary.unauthorized.cta}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
