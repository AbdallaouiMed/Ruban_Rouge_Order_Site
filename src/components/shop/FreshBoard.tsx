"use client";

import { useLocale, useTranslations } from "next-intl";
import { Flame } from "lucide-react";
import { ProductCard } from "@/components/shop/ProductCard";
import { useCatalog } from "@/lib/demo/hooks";
import type { Locale } from "@/i18n/routing";

/** "Fresh from the oven today": driven by the availability flags the owners set in the admin. */
export function FreshBoard() {
  const t = useTranslations("fresh");
  const locale = useLocale() as Locale;
  const { products } = useCatalog();
  const fresh = products.filter((p) => p.freshToday && !p.soldOut);
  const soldOut = products.filter((p) => p.soldOut);

  return (
    <section aria-labelledby="fresh-title" className="grade-honey grain py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Flame aria-hidden="true" className="size-8 text-ribbon" />
          <h2 id="fresh-title" className="font-display text-(length:--text-3xl)">{t("title")}</h2>
        </div>
        <p className="mt-2 max-w-prose text-cocoa-soft">{t("subtitle")}</p>

        {fresh.length > 0 ? (
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {fresh.slice(0, 4).map((p) => (
              <li key={p.slug}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 rounded-md bg-flour p-6">{t("empty")}</p>
        )}

        {soldOut.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-2" aria-label={t("soldOutTitle")}>
            <span className="text-(length:--text-sm) font-semibold">{t("soldOutTitle")} :</span>
            {soldOut.map((p) => (
              <span key={p.slug} className="rounded-pill bg-cocoa px-3 py-1 text-(length:--text-sm) text-flour">
                {p.name[locale]}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
