"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSettings } from "@/lib/demo/hooks";
import { dayLabel, dayOrder, formatTime, uniformHours } from "@/lib/hours";

/** Opening hours from the live settings (the admin can change them). One line when every day matches. */
export function LiveHours({ variant = "list" }: { variant?: "list" | "compact" }) {
  const locale = useLocale();
  const tc = useTranslations("common");
  const { hours } = useSettings();
  const same = uniformHours(hours);
  const range = (w: { open: string; close: string }) => (
    <span dir="ltr">
      {formatTime(w.open, locale)} – {formatTime(w.close, locale)}
    </span>
  );

  if (same) {
    return variant === "compact" ? (
      <>
        {tc("everyDay")}
        <br />
        {range(same)}
      </>
    ) : (
      <p>
        {tc("everyDay")} · {range(same)}
      </p>
    );
  }
  return (
    <ul>
      {dayOrder.map((d) => (
        <li key={d} className="flex justify-between gap-4">
          <span>{dayLabel(d, locale)}</span>
          {hours[d] ? range(hours[d]!) : <span>{tc("closed")}</span>}
        </li>
      ))}
    </ul>
  );
}
