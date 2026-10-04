"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Photo } from "@/components/ui/Photo";
import { PastryArt } from "@/components/ui/PastryArt";
import { categoryLabel, type Product } from "@/lib/products";
import { isOrderable } from "@/lib/catalog";
import { useLiveProduct } from "@/lib/demo/hooks";
import { useCart } from "@/lib/demo/store";
import { formatMad } from "@/lib/format";
import type { Locale } from "@/i18n/routing";

/** `headingAs` keeps the heading outline valid: h2 where the page has no section heading above the cards (the menu), h3 elsewhere. */
export function ProductCard({ product: seed, priority = false, headingAs: Heading = "h3" }: { product: Product; priority?: boolean; headingAs?: "h2" | "h3" }) {
  const product = useLiveProduct(seed);
  const locale = useLocale() as Locale;
  const t = useTranslations("common");
  const add = useCart((s) => s.add);
  const [justAdded, setJustAdded] = useState(false);
  const name = product.name[locale];
  const orderable = isOrderable(product);

  useEffect(() => {
    if (!justAdded) return;
    const id = setTimeout(() => setJustAdded(false), 1400);
    return () => clearTimeout(id);
  }, [justAdded]);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-md bg-white shadow-soft ring-1 ring-cocoa/5 transition-[box-shadow,transform] duration-300 ease-(--ease-out) hover:-translate-y-0.5 hover:shadow-lift">
      <div className="pattern-zellige relative aspect-[4/3] overflow-hidden bg-butter">
        {product.image ? (
          <Photo src={product.image} alt={name} sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" priority={priority} className="transition-transform duration-700 ease-(--ease-out) group-hover:scale-105" />
        ) : (
          <div className="grid size-full place-items-center">
            <PastryArt kind={product.slug} className="h-4/5 w-4/5 transition-transform duration-500 ease-(--ease-out) group-hover:scale-105" />
          </div>
        )}
        {/* A soft shade at the foot of the photo anchors the badges and the price */}
        {product.image && <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-cocoa/25 to-transparent" />}
        {product.freshToday && !product.soldOut && (
          <span className="absolute start-3 top-3 rounded-pill bg-saffron px-3 py-1 text-(length:--text-xs) font-bold text-cocoa shadow-soft">{t("freshToday")}</span>
        )}
        {product.soldOut && <span className="absolute start-3 top-3 rounded-pill bg-cocoa px-3 py-1 text-(length:--text-xs) font-bold text-flour shadow-soft">{t("soldOut")}</span>}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-5">
        <p className="text-(length:--text-xs) font-semibold tracking-wide text-saffron-deep uppercase">{categoryLabel(product.category, locale)}</p>
        <Heading className="font-display text-(length:--text-xl) leading-snug">
          {/* Stretched link: the whole card opens the product, with a single tab stop */}
          <Link href={`/menu/${product.slug}`} prefetch={false} className="after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-md">
            {name}
          </Link>
        </Heading>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <p className="font-semibold text-ribbon">{product.priceMad !== null ? formatMad(product.priceMad, locale) : <span className="text-cocoa-soft">{t("pricePending")}</span>}</p>
          {orderable && (
            <button
              type="button"
              onClick={() => {
                add({ kind: "product", slug: product.slug, qty: 1 });
                setJustAdded(true);
              }}
              aria-label={t("addNamed", { name })}
              className="relative z-10 inline-flex min-h-11 items-center gap-1 rounded-pill bg-ribbon px-4 text-(length:--text-sm) font-semibold text-white transition-[transform,background-color] duration-200 ease-(--ease-spring) hover:bg-garnet active:scale-95"
            >
              {justAdded ? <Check aria-hidden="true" className="size-4" /> : <Plus aria-hidden="true" className="size-4" />}
              <span aria-live="polite">{justAdded ? t("added") : t("add")}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
