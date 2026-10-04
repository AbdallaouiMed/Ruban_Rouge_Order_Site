import { describe, expect, it } from "vitest";
import { formatTime, isOpenNow, uniformHours } from "@/lib/hours";

// Africa/Casablanca is UTC+1 year-round since 2018 (except during Ramadan, when it is UTC+0).
// 2026-01-15 is a Thursday and outside Ramadan.
const at = (utc: string) => new Date(`2026-01-15T${utc}:00Z`);

describe("opening hours", () => {
  it("is open mid-morning and closed before opening", () => {
    expect(isOpenNow(at("09:00"))).toBe(true); // 10:00 local
    expect(isOpenNow(at("05:00"))).toBe(false); // 06:00 local, opens 06:30
  });

  it("treats the opening minute as open and the closing minute as closed", () => {
    expect(isOpenNow(at("05:30"))).toBe(true); // 06:30 local
    expect(isOpenNow(at("21:29"))).toBe(true); // 22:29 local
    expect(isOpenNow(at("21:30"))).toBe(false); // 22:30 local
  });

  it("reports uniform hours while every day is the same", () => {
    expect(uniformHours()).toEqual({ open: "06:30", close: "22:30" });
  });

  it("formats times with Latin digits in every locale", () => {
    expect(formatTime("06:30", "fr")).toMatch(/^06[:h]30$/);
    expect(formatTime("22:30", "ar")).toMatch(/^22:30$/);
    expect(formatTime("22:30", "en")).toBe("22:30");
  });
});
