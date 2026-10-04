"use client";

import { useLocale, useTranslations } from "next-intl";
import { ShoppingBag } from "lucide-react";
import type { Bundle } from "@/data/demo";
import { buttonClasses } from "@/components/ui/Button";
import { PastryArt } from "@/components/ui/PastryArt";
import { Photo } from "@/components/ui/Photo";
import { useBundlePrice, useCatalog } from "@/lib/demo/hooks";
import { useCart, useUi } from "@/lib/demo/store";
import { formatMad } from "@/lib/format";
import type { Locale } from "@/i18n/routing";

/** A curated occasion bundle: contents, live price, and one-tap add to cart. */
export function BundleCard({ bundle }: { bundle: Bundle }) {
  const t = useTranslations("occasions");
  const locale = useLocale() as Locale;
  const { products } = useCatalog();
  const price = useBundlePrice(bundle);
  const add = useCart((s) => s.add);
  const setCartOpen = useUi((s) => s.setCartOpen);
  const unavailable = bundle.items.some((i) => products.find((p) => p.slug === i.slug)?.soldOut);
  const cover = products.find((p) => p.slug === bundle.items[0]?.slug)?.image ?? null;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-md bg-white shadow-soft">
      <div className="pattern-zellige relative grid aspect-[16/9] place-items-center overflow-hidden bg-butter">
        {cover ? <Photo src={cover} sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" /> : <PastryArt kind={bundle.items[0]?.slug ?? "cake"} className="h-28" />}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-display text-(length:--text-xl)">{bundle.name[locale]}</h3>
        <p className="text-cocoa-soft">{bundle.desc[locale]}</p>
        <ul className="text-(length:--text-sm)">
          {bundle.items.map((i) => (
            <li key={i.slug}>
              {i.qty} × {products.find((p) => p.slug === i.slug)?.name[locale] ?? i.slug}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <p className="font-semibold text-ribbon">{price !== null ? formatMad(price, locale) : "—"}</p>
          <button
            type="button"
            disabled={price === null || unavailable}
            onClick={() => {
              add({ kind: "bundle", bundleId: bundle.id, qty: 1 });
              setCartOpen(true);
            }}
            className={buttonClasses("primary", "min-h-11 px-4 text-(length:--text-sm)")}
          >
            <ShoppingBag aria-hidden="true" className="size-4" />
            {unavailable ? t("unavailable") : t("addBundle")}
          </button>
        </div>
      </div>
    </article>
  );
}
