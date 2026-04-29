import Link from "next/link";

import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";

export default async function UnauthorizedPage() {
  const locale = await getLocaleFromCookies();
  const dictionary = getDictionary(locale);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-page)] px-5">
      <div className="w-full max-w-xl rounded-[28px] border border-[var(--color-border)] bg-[var(--color-panel)] p-8 text-center shadow-[var(--shadow-panel)]">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
          {dictionary.unauthorized.title}
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-[var(--color-text-strong)]">
          {dictionary.unauthorized.heading}
        </h1>
        <p className="mt-4 text-sm leading-6 text-[var(--color-text-muted)]">
          {dictionary.unauthorized.description}
        </p>
        <Link
          href="/chat"
          className="mt-8 inline-flex rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white"
        >
          {dictionary.unauthorized.cta}
        </Link>
      </div>
    </div>
  );
}
