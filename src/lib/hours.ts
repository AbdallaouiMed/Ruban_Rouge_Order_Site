import { bakery, type DayKey } from "@/data/bakery";

export const dayOrder: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const jsDay: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** Current wall-clock parts in the bakery's timezone. */
export function bakeryNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: bakery.timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = get("weekday").slice(0, 3).toLowerCase() as DayKey;
  return { day: (dayOrder.includes(day) ? day : jsDay[now.getDay()]) as DayKey, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export type Hours = Record<DayKey, { open: string; close: string } | null>;

export function isOpenNow(now = new Date(), hours: Hours = bakery.hours) {
  const { day, minutes } = bakeryNow(now);
  const w = hours[day];
  return !!w && minutes >= toMin(w.open) && minutes < toMin(w.close);
}

/** "06:30" -> "06h30" for fr, "6:30 AM" style left to Intl for others. */
export function formatTime(hhmm: string, locale: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(Date.UTC(2000, 0, 1, h, m));
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-FR" : "en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    numberingSystem: "latn",
  }).format(d);
}

export function dayLabel(day: DayKey, locale: string) {
  const ref = new Date(Date.UTC(2024, 0, dayOrder.indexOf(day) + 1)); // 2024-01-01 is a Monday
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : locale, { timeZone: "UTC", weekday: "long" }).format(ref);
}

/** True when every open day shares the same window (renders as one line). */
export function uniformHours(hours: Hours = bakery.hours) {
  const first = hours.mon;
  const same = first !== null && dayOrder.every((d) => hours[d]?.open === first.open && hours[d]?.close === first.close);
  return same ? first : null;
}
