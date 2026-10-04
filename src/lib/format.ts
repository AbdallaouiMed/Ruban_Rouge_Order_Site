import type { Locale } from "@/i18n/routing";

/** "+212535510010" -> "+212 5 35 51 00 10" */
export const displayPhone = (e164: string) => e164.replace(/^\+212(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/, "+212 $1 $2 $3 $4 $5");

export const intlLocale: Record<Locale, string> = { fr: "fr-MA", en: "en-GB", ar: "ar-MA" };

/** Price in MAD with Latin digits in every locale (matches shop signage). */
export function formatMad(amount: number, locale: Locale) {
  const n = new Intl.NumberFormat(intlLocale[locale], { numberingSystem: "latn", maximumFractionDigits: 2 }).format(amount);
  return locale === "ar" ? `${n} د.م.` : `${n} DH`;
}

/** Parse the bakery's local wall-clock strings ("YYYY-MM-DD" or "YYYY-MM-DDTHH:mm") without any timezone shift. */
function wallDate(value: string) {
  const [d, t = "00:00"] = value.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const [h, min] = t.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, day, h, min));
}

const dateOpts = (o: Intl.DateTimeFormatOptions, locale: Locale) => new Intl.DateTimeFormat(intlLocale[locale], { timeZone: "UTC", numberingSystem: "latn", ...o });

/** "samedi 4 octobre" */
export const formatDay = (value: string, locale: Locale) => dateOpts({ weekday: "long", day: "numeric", month: "long" }, locale).format(wallDate(value));

/** "sam. 4" for compact day chips */
export const formatDayShort = (value: string, locale: Locale) => ({
  weekday: dateOpts({ weekday: "short" }, locale).format(wallDate(value)),
  day: dateOpts({ day: "numeric" }, locale).format(wallDate(value)),
});

/** "samedi 4 octobre, 10:30" */
export const formatSlot = (value: string, locale: Locale) =>
  `${formatDay(value, locale)}, ${dateOpts({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" }, locale).format(wallDate(value))}`;

export const formatDateTime = (iso: string, locale: Locale) =>
  new Intl.DateTimeFormat(intlLocale[locale], { timeZone: "Africa/Casablanca", numberingSystem: "latn", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));
