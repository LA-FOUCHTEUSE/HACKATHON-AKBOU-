import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en", "ar"],
  defaultLocale: "fr",
  localePrefix: "always",
  // Every URL already carries its locale, so the middleware never needs to guess
  // one from Accept-Language or a stored cookie. Without this, the middleware
  // set a Set-Cookie on every response, which stops Next from caching the
  // landing page (a Set-Cookie header makes a response non-cacheable).
  localeCookie: false,
});

export type AppLocale = (typeof routing.locales)[number];

export function directionFor(locale: string): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}
