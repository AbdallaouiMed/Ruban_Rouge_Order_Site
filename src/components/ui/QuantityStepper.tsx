"use client";

import { useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";

export function QuantityStepper({ value, onChange, min = 1, max = 99, label }: { value: number; onChange: (n: number) => void; min?: number; max?: number; label: string }) {
  const t = useTranslations("common");
  const btn =
    "inline-flex size-11 items-center justify-center rounded-pill bg-butter text-garnet transition-colors hover:bg-[#ecd3a3] disabled:opacity-40 disabled:pointer-events-none";
  return (
    <div role="group" aria-label={label} className="inline-flex items-center gap-1">
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={t("decrease")}>
        <Minus aria-hidden="true" className="size-4" />
      </button>
      <span aria-live="polite" className="min-w-8 text-center font-semibold tabular-nums">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={t("increase")}>
        <Plus aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
