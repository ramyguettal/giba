import type { Metadata } from "next";

import { isRtlLocale } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";

import "./globals.css";

export const metadata: Metadata = {
  title: "GIBA Maintenance Assistant",
  description: "Role-based maintenance chatbot and knowledge workspace for GIBA.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocaleFromCookies();

  return (
    <html lang={locale} dir={isRtlLocale(locale) ? "rtl" : "ltr"} className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
