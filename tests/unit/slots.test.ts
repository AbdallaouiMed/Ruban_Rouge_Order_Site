import { describe, expect, it } from "vitest";
import { bakery } from "@/data/bakery";
import { buildSlots, isValidSlot, wallClock, type WallClock } from "@/lib/slots";

// 2026-01-15 is a Thursday.
const at = (minutes: number, d = 15): WallClock => ({ y: 2026, m: 1, d, minutes });
const hm = (h: number, m = 0) => h * 60 + m;
const base = { hours: bakery.hours, slotMinutes: 30 };

describe("buildSlots", () => {
  it("starts at least `lead` minutes from now and stops so the slot ends by closing time", () => {
    const days = buildSlots({ ...base, now: at(hm(10)), leadMinutes: 60 });
    const today = days[0];
    expect(today.date).toBe("2026-01-15");
    expect(today.day).toBe("thu");
    expect(today.slots[0].time).toBe("11:00");
    expect(today.slots.at(-1)!.time).toBe("22:00"); // 22:00 to 22:30
    expect(today.slots.some((s) => s.time === "22:30")).toBe(false);
  });

  it("offers a slot exactly at the lead boundary", () => {
    const today = buildSlots({ ...base, now: at(hm(10)), leadMinutes: 60 })[0];
    expect(today.slots.some((s) => s.time === "11:00")).toBe(true);
    expect(today.slots.some((s) => s.time === "10:30")).toBe(false);
  });

  it("moves to tomorrow when nothing is left today", () => {
    const days = buildSlots({ ...base, now: at(hm(21, 45)), leadMinutes: 60 });
    expect(days[0].date).toBe("2026-01-16");
    expect(days[0].slots[0].time).toBe("06:30");
  });

  it("carries a long lead time past midnight", () => {
    const days = buildSlots({ ...base, now: at(hm(23, 30)), leadMinutes: 600 });
    expect(days[0].date).toBe("2026-01-16");
    expect(days[0].slots[0].time).toBe("09:30");
  });

  it("skips closed days", () => {
    const hours = { ...bakery.hours, fri: null };
    const days = buildSlots({ ...base, hours, now: at(hm(8)), leadMinutes: 0 });
    expect(days.map((d) => d.day)).not.toContain("fri");
    expect(days.some((d) => d.date === "2026-01-16")).toBe(false);
  });

  it("returns nothing when the shop is closed every day", () => {
    const closed = { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null };
    expect(buildSlots({ ...base, hours: closed, now: at(hm(8)), leadMinutes: 0 })).toEqual([]);
  });

  it("covers 7 days by default and respects slot length", () => {
    const days = buildSlots({ hours: bakery.hours, slotMinutes: 60, now: at(hm(5)), leadMinutes: 0 });
    expect(days).toHaveLength(7);
    expect(days[1].slots[0].time).toBe("06:30");
    expect(days[1].slots[1].time).toBe("07:30");
  });

  it("validates a chosen slot against the offered ones", () => {
    const days = buildSlots({ ...base, now: at(hm(10)), leadMinutes: 60 });
    expect(isValidSlot("2026-01-15T11:00", days)).toBe(true);
    expect(isValidSlot("2026-01-15T10:00", days)).toBe(false); // inside the lead time
    expect(isValidSlot("2026-01-15T23:00", days)).toBe(false); // after closing
    expect(isValidSlot(undefined, days)).toBe(false);
  });
});

describe("wallClock", () => {
  it("reads the bakery's local time, not the machine's", () => {
    // 2026-01-15 12:00 UTC is 13:00 in Casablanca (UTC+1, outside Ramadan)
    const wc = wallClock(new Date("2026-01-15T12:00:00Z"));
    expect(wc).toMatchObject({ y: 2026, m: 1, d: 15, minutes: hm(13) });
  });
});
