import { hasLocale, type Formats } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import fr from "../messages/fr.json";

type Messages = { [key: string]: string | Messages };

// Missing keys in en/ar fall back to French instead of failing.
function deepMerge(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = out[key];
    out[key] =
      typeof value === "object" && typeof current === "object" ? deepMerge(current, value) : value;
  }
  return out;
}

// Algeria uses Western digits, including in Arabic text.
export const formats = {
  number: {
    dzd: { style: "currency", currency: "DZD", maximumFractionDigits: 0, numberingSystem: "latn" },
    integer: { maximumFractionDigits: 0, numberingSystem: "latn" },
  },
  dateTime: {
    short: { day: "numeric", month: "short", year: "numeric", numberingSystem: "latn" },
    long: {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      numberingSystem: "latn",
    },
    time: { hour: "2-digit", minute: "2-digit", numberingSystem: "latn" },
  },
} satisfies Formats;

export const TIME_ZONE = "Africa/Algiers";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const messages =
    locale === "fr"
      ? fr
      : deepMerge(fr as Messages, (await import(`../messages/${locale}.json`)).default as Messages);

  return { locale, messages, timeZone: TIME_ZONE, formats };
});
