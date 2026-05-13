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
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <Card className="w-full max-w-sm border border-[var(--border)] bg-[var(--card)] text-center">
        <CardContent className="p-6 space-y-4">
          <div className="mx-auto flex size-10 items-center justify-center border border-[var(--border)] bg-[var(--muted)] text-[var(--destructive)]">
            <ShieldAlert className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
              {dictionary.unauthorized.title}
            </p>
            <h1 className="text-sm font-semibold text-[var(--foreground)]">
              {dictionary.unauthorized.heading}
            </h1>
            <p className="text-xs text-[var(--muted-foreground)]">
              {dictionary.unauthorized.description}
            </p>
          </div>
          <Button asChild size="sm" className="text-xs">
            <Link href="/chat">{dictionary.unauthorized.cta}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
