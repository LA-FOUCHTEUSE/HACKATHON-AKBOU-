import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing, directionFor } from "@/i18n/routing";
import { formats, TIME_ZONE } from "@/i18n/request";
import { fontVariables } from "@/fonts";
import "../globals.css";

// The layout itself reads no cookie and no database row, so it can be served from
// cache. Pages that read the session (everything under the (app) route group) set
// their own `dynamic = "force-dynamic"` — this used to force that on the landing
// page too, which has no user-specific data and paid for a database round trip
// it never needed.

// Without this, Next treats `[locale]` as an open-ended dynamic segment and never
// prerenders it, even for pages under it with no per-request data.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app" });
  return { title: `${t("name")} - ${t("tagline")}`, description: t("tagline") };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <html lang={locale} dir={directionFor(locale)}>
      <body className={`${fontVariables} min-h-dvh font-sans`}>
        <NextIntlClientProvider timeZone={TIME_ZONE} formats={formats}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
