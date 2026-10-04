"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { isOpenNow } from "@/lib/hours";
import { useSettings } from "@/lib/demo/hooks";

/** Live open/closed badge. Computed after mount so static pages never show a stale status. */
export function OpenStatus({ className = "" }: { className?: string }) {
  const t = useTranslations("common");
  const { hours } = useSettings();
  const [open, setOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const update = () => setOpen(isOpenNow(new Date(), hours));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [hours]);

  if (open === null) return <span className={`inline-block h-7 w-32 rounded-pill bg-butter ${className}`} aria-hidden="true" />;
  return (
    <span
      role="status"
      className={`inline-flex items-center gap-2 rounded-pill px-3 py-1 text-(length:--text-sm) font-semibold ${open ? "bg-success text-white" : "bg-cocoa text-flour"} ${className}`}
    >
      <span aria-hidden="true" className={`size-2 rounded-full ${open ? "bg-white" : "bg-saffron"}`} />
      {open ? t("openNow") : t("closedNow")}
    </span>
  );
}
