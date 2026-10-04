import { bakery, type DayKey, type OpeningWindow } from "@/data/bakery";
import { dayOrder } from "@/lib/hours";

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const pad = (n: number) => String(n).padStart(2, "0");

/** The bakery's wall clock (Africa/Casablanca) at an instant. */
export interface WallClock {
  y: number;
  m: number;
  d: number;
  minutes: number;
}

export function wallClock(now = new Date()): WallClock {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: bakery.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month"), d: get("day"), minutes: get("hour") * 60 + get("minute") };
}

export interface SlotDay {
  /** YYYY-MM-DD */
  date: string;
  day: DayKey;
  slots: { value: string; time: string }[];
}

/**
 * Pickup/delivery slots for the next `days` days. A slot is offered only when the shop is open for its
 * whole length and it starts at least `leadMinutes` from now. Days with no slot are omitted.
 */
export function buildSlots(opts: {
  now: WallClock;
  hours: Record<DayKey, OpeningWindow | null>;
  leadMinutes: number;
  slotMinutes: number;
  days?: number;
}): SlotDay[] {
  const { now, hours, leadMinutes, slotMinutes, days = 7 } = opts;
  const earliestAbs = now.minutes + leadMinutes; // minutes since today 00:00 (may exceed 1440)
  const out: SlotDay[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(Date.UTC(now.y, now.m - 1, now.d + i));
    const day = dayOrder[(date.getUTCDay() + 6) % 7]; // Monday-first
    const window = hours[day];
    if (!window) continue;
    const open = toMin(window.open);
    const close = toMin(window.close);
    const slots: SlotDay["slots"] = [];
    for (let start = open; start + slotMinutes <= close; start += slotMinutes) {
      if (i * 1440 + start >= earliestAbs) {
        slots.push({ value: `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${hhmm(start)}`, time: hhmm(start) });
      }
    }
    if (slots.length) out.push({ date: slots[0].value.slice(0, 10), day, slots });
  }
  return out;
}

/** True when `value` is one of the currently offered slots (server-side re-check). */
export const isValidSlot = (value: string | undefined, slotDays: SlotDay[]) =>
  !!value && slotDays.some((d) => d.slots.some((s) => s.value === value));
