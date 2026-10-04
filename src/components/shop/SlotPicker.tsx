"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSettings } from "@/lib/demo/hooks";
import { buildSlots, wallClock } from "@/lib/slots";
import { formatDay, formatDayShort } from "@/lib/format";
import type { Locale } from "@/i18n/routing";

/** Day chips + time grid. Slots respect the live opening hours, slot length and lead time. */
export function SlotPicker({ value, onChange, legend }: { value: string; onChange: (slot: string) => void; legend: string }) {
  const t = useTranslations("checkout");
  const locale = useLocale() as Locale;
  const settings = useSettings();
  const [now, setNow] = useState<Date | null>(null);
  const [pickedDay, setPickedDay] = useState<string | null>(null);

  // Client-only clock: server and first client render match (a skeleton), then slots appear.
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const days = useMemo(
    () => (now ? buildSlots({ now: wallClock(now), hours: settings.hours, leadMinutes: settings.leadMinutes, slotMinutes: settings.slotMinutes }) : []),
    [now, settings.hours, settings.leadMinutes, settings.slotMinutes],
  );

  if (!now) return <div className="h-40 animate-pulse rounded-md bg-butter" aria-hidden="true" />;
  if (days.length === 0)
    return (
      <p role="alert" className="rounded-md bg-butter p-4 font-semibold">
        {t("noSlots")}
      </p>
    );

  const wc = wallClock(now);
  const todayUtc = Date.UTC(wc.y, wc.m - 1, wc.d);
  const chipLabel = (date: string) => {
    const diff = Math.round((Date.parse(`${date}T00:00:00Z`) - todayUtc) / 86_400_000);
    if (diff === 0) return t("today");
    if (diff === 1) return t("tomorrow");
    return formatDayShort(date, locale).weekday;
  };

  const activeDate = value ? value.slice(0, 10) : (pickedDay ?? days[0].date);
  const active = days.find((d) => d.date === activeDate) ?? days[0];

  return (
    <fieldset className="space-y-3">
      <legend className="font-semibold">{legend}</legend>
      <div role="group" aria-label={t("pickDay")} className="flex gap-2 overflow-x-auto pb-1">
        {days.map((d) => {
          const selected = d.date === active.date;
          return (
            <button
              key={d.date}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setPickedDay(d.date);
                if (value && !value.startsWith(d.date)) onChange("");
              }}
              className={`flex min-h-16 min-w-20 shrink-0 flex-col items-center justify-center rounded-md px-3 text-(length:--text-sm) font-semibold transition-colors ${selected ? "bg-cocoa text-flour" : "bg-butter text-cocoa hover:bg-[#ecd3a3]"}`}
            >
              <span>{chipLabel(d.date)}</span>
              <span className="font-display text-(length:--text-xl)">{formatDayShort(d.date, locale).day}</span>
            </button>
          );
        })}
      </div>
      <p className="text-(length:--text-sm) text-cocoa-soft">{formatDay(active.date, locale)}</p>
      <div role="group" aria-label={t("pickTime")} className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {active.slots.map((s) => (
          <button
            key={s.value}
            type="button"
            aria-pressed={value === s.value}
            onClick={() => onChange(s.value)}
            className={`min-h-11 rounded-pill px-2 text-(length:--text-sm) font-semibold tabular-nums transition-colors ${value === s.value ? "bg-ribbon text-white" : "bg-white text-cocoa ring-1 ring-cocoa/20 hover:bg-butter"}`}
          >
            <span dir="ltr">{s.time}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
