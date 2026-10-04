"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ShoppingBag } from "lucide-react";
import { PastryArt } from "@/components/ui/PastryArt";
import { Photo } from "@/components/ui/Photo";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { buttonClasses } from "@/components/ui/Button";
import { isOrderable, type Product } from "@/lib/catalog";
import { useLiveProduct } from "@/lib/demo/hooks";
import { useCart, useUi } from "@/lib/demo/store";
import { formatMad } from "@/lib/format";
import type { Locale } from "@/i18n/routing";

/** Product photo (admin upload or illustration) with availability badges. */
export function ProductImage({ product: seed }: { product: Product }) {
  const product = useLiveProduct(seed);
  const locale = useLocale() as Locale;
  const t = useTranslations("common");
  return (
    <div className="pattern-zellige relative aspect-[4/3] overflow-hidden rounded-md bg-butter shadow-lift ring-1 ring-cocoa/5">
      {product.image ? (
        <Photo src={product.image} alt={product.name[locale]} sizes="(min-width:768px) 50vw, 100vw" priority />
      ) : (
        <div className="grid size-full place-items-center">
          <PastryArt kind={product.slug} className="h-4/5 w-4/5" />
        </div>
      )}
      {product.freshToday && !product.soldOut && <span className="absolute start-3 top-3 rounded-pill bg-saffron px-3 py-1 text-(length:--text-sm) font-bold text-cocoa">{t("freshToday")}</span>}
      {product.soldOut && <span className="absolute start-3 top-3 rounded-pill bg-cocoa px-3 py-1 text-(length:--text-sm) font-bold text-flour">{t("soldOut")}</span>}
    </div>
  );
}

/** Live price, quantity, note and add-to-cart. */
export function ProductBuyPanel({ product: seed }: { product: Product }) {
  const product = useLiveProduct(seed);
  const locale = useLocale() as Locale;
  const t = useTranslations("product");
  const tc = useTranslations("common");
  const add = useCart((s) => s.add);
  const setCartOpen = useUi((s) => s.setCartOpen);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const orderable = isOrderable(product);

  return (
    <div className="space-y-4">
      <p className="text-(length:--text-xl) font-semibold text-ribbon">
        {product.priceMad !== null ? formatMad(product.priceMad, locale) : <span className="text-cocoa-soft">{tc("pricePending")}</span>}
      </p>

      {orderable ? (
        <div className="space-y-4 rounded-md bg-butter p-5">
          <p>{t("orderHint")}</p>
          <div className="flex flex-wrap items-center gap-4">
            <QuantityStepper value={qty} onChange={setQty} label={t("qty")} />
            <p className="font-semibold">{formatMad(product.priceMad! * qty, locale)}</p>
          </div>
          <div>
            <label htmlFor="buy-note" className="font-semibold">
              {t("noteLabel")}
            </label>
            <input id="buy-note" type="text" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("notePlaceholder")} className="mt-1 min-h-12 w-full rounded-sm border border-cocoa/30 bg-white px-4" />
          </div>
          <button
            type="button"
            className={buttonClasses("primary", "w-full sm:w-auto")}
            onClick={() => {
              add({ kind: "product", slug: product.slug, qty, note: note.trim() || undefined });
              setNote("");
              setQty(1);
              setCartOpen(true);
            }}
          >
            <ShoppingBag aria-hidden="true" className="size-5" />
            {t("addToCart")}
          </button>
        </div>
      ) : (
        <div role="note" className="rounded-md bg-butter p-5">
          <p className="font-semibold">{t("notOrderable")}</p>
          <p className="text-cocoa-soft">{t("notOrderableHint")}</p>
        </div>
      )}
    </div>
  );
}
