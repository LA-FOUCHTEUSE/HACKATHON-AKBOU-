import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing, directionFor } from "@/i18n/routing";
import { formats, TIME_ZONE } from "@/i18n/request";
import { fontVariables } from "@/fonts";
import "../globals.css";

// Every page reads the session cookie and/or the database: never prerender at build time.
export const dynamic = "force-dynamic";

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
