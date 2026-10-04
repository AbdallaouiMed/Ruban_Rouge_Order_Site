"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, ShoppingBag } from "lucide-react";
import { boxSizes } from "@/data/demo";
import { PastryArt } from "@/components/ui/PastryArt";
import { Photo } from "@/components/ui/Photo";
import { buttonClasses } from "@/components/ui/Button";
import { isOrderable } from "@/lib/catalog";
import { useCatalog, useSettings } from "@/lib/demo/hooks";
import { useCart, useUi } from "@/lib/demo/store";
import { formatMad } from "@/lib/format";
import type { BoxSize } from "@/lib/demo/types";
import type { Locale } from "@/i18n/routing";

const cols: Record<BoxSize, string> = { 6: "grid-cols-3", 12: "grid-cols-4", 24: "grid-cols-6" };

/** Red ribbon tied across the box: drawn only once every slot is filled. */
function TiedRibbon() {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" className="pointer-events-none absolute inset-0 size-full">
      <g className="ribbon-animate">
        <rect x="0" y="86" width="200" height="28" fill="#B3202A" opacity="0.92" />
        <rect x="86" y="0" width="28" height="200" fill="#B3202A" opacity="0.92" />
        <path d="M100 100c-8-26-40-34-44-16s22 26 44 16Zm0 0c8-26 40-34 44-16s-22 26-44 16Z" fill="#7E1420" />
        <circle cx="100" cy="100" r="9" fill="#B3202A" stroke="#FBF4E8" strokeWidth="3" />
      </g>
    </svg>
  );
}

export function BoxBuilder() {
  const t = useTranslations("box");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const { products } = useCatalog();
  const settings = useSettings();
  const add = useCart((s) => s.add);
  const setCartOpen = useUi((s) => s.setCartOpen);

  const [size, setSize] = useState<BoxSize>(6);
  const [picked, setPicked] = useState<Record<string, number>>({});

  const orderable = useMemo(() => products.filter(isOrderable), [products]);
  const count = Object.values(picked).reduce((n, q) => n + q, 0);
  const full = count >= size;
  const slots = useMemo(() => Object.entries(picked).flatMap(([slug, q]) => Array.from({ length: q }, () => slug)), [picked]);
  const total = settings.boxFee + Object.entries(picked).reduce((n, [slug, q]) => n + (products.find((p) => p.slug === slug)?.priceMad ?? 0) * q, 0);

  // Changing size trims the box from the end if it no longer fits.
  const changeSize = (next: BoxSize) => {
    setSize(next);
    setPicked((cur) => {
      let over = Object.values(cur).reduce((n, q) => n + q, 0) - next;
      if (over <= 0) return cur;
      const out = { ...cur };
      for (const slug of Object.keys(out).reverse()) {
        while (over > 0 && out[slug] > 0) {
          out[slug]--;
          over--;
        }
        if (out[slug] === 0) delete out[slug];
      }
      return out;
    });
  };

  const change = (slug: string, delta: number) =>
    setPicked((cur) => {
      const q = (cur[slug] ?? 0) + delta;
      const next = { ...cur };
      if (q <= 0) delete next[slug];
      else next[slug] = q;
      return next;
    });

  const nameOf = (slug: string) => products.find((p) => p.slug === slug)?.name[locale] ?? slug;
  const imageOf = (slug: string) => products.find((p) => p.slug === slug)?.image ?? null;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <section aria-labelledby="your-box" className="h-fit space-y-4 lg:sticky lg:top-24">
        <h2 id="your-box" className="font-display text-(length:--text-xl)">{t("yourBox")}</h2>
        <div className="relative overflow-hidden rounded-md bg-cocoa p-4 shadow-lift">
          <ul className={`grid ${cols[size]} gap-2`} aria-label={t("filled", { count, size })}>
            {Array.from({ length: size }, (_, i) => {
              const slug = slots[i];
              return (
                <li key={i} className="aspect-square">
                  {slug ? (
                    <button type="button" onClick={() => change(slug, -1)} aria-label={t("removeOne", { name: nameOf(slug) })} className="relative grid size-full place-items-center overflow-hidden rounded-sm bg-butter transition-transform hover:scale-95">
                      {imageOf(slug) ? <Photo src={imageOf(slug)!} sizes="96px" /> : <PastryArt kind={slug} className="size-full p-1" />}
                    </button>
                  ) : (
                    <div className="grid size-full place-items-center rounded-sm border-2 border-dashed border-flour/40 text-flour/60"><Plus aria-hidden="true" className="size-5" /></div>
                  )}
                </li>
              );
            })}
          </ul>
          {full && <TiedRibbon />}
        </div>
        <p role="status" className="font-semibold">
          {full ? t("full") : t("remaining", { count: size - count })} <span className="font-normal text-cocoa-soft">({t("filled", { count, size })})</span>
        </p>
        <div className="flex items-center justify-between text-(length:--text-lg)">
          <span>{t("boxFee", { fee: formatMad(settings.boxFee, locale) })}</span>
          <strong className="text-ribbon">{formatMad(total, locale)}</strong>
        </div>
        <button
          type="button"
          disabled={!full}
          className={buttonClasses("primary", "w-full")}
          onClick={() => {
            add({ kind: "box", qty: 1, box: { size, items: Object.entries(picked).map(([slug, qty]) => ({ slug, qty })) } });
            setPicked({});
            setCartOpen(true);
          }}
        >
          <ShoppingBag aria-hidden="true" className="size-5" />
          {t("addBox")}
        </button>
        {!full && <p className="text-(length:--text-sm) text-cocoa-soft">{t("fillHint")}</p>}
      </section>

      <div className="space-y-8">
        <fieldset className="space-y-3">
          <legend className="font-display text-(length:--text-xl)">{t("size")}</legend>
          <div className="flex flex-wrap gap-3">
            {boxSizes.map((n) => (
              <label key={n} className={`min-h-12 cursor-pointer rounded-pill px-6 py-3 font-semibold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ribbon ${size === n ? "bg-cocoa text-flour" : "bg-butter hover:bg-[#ecd3a3]"}`}>
                <input type="radio" name="box-size" value={n} checked={size === n} onChange={() => changeSize(n)} className="sr-only" />
                {t("sizeOption", { count: n })}
              </label>
            ))}
          </div>
        </fieldset>

        <section aria-labelledby="pick" className="space-y-3">
          <h2 id="pick" className="font-display text-(length:--text-xl)">{t("pick")}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {orderable.map((p) => {
              const q = picked[p.slug] ?? 0;
              return (
                <li key={p.slug} className={`flex items-center gap-3 rounded-md bg-white p-3 shadow-soft ${q ? "ring-2 ring-ribbon" : ""}`}>
                  <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-sm bg-butter">{p.image ? <Photo src={p.image} sizes="64px" /> : <PastryArt kind={p.slug} className="size-14" />}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{p.name[locale]}</p>
                    <p className="text-(length:--text-sm) text-ribbon">{formatMad(p.priceMad!, locale)}</p>
                  </div>
                  <div className="inline-flex items-center gap-1" role="group" aria-label={p.name[locale]}>
                    <button type="button" onClick={() => change(p.slug, -1)} disabled={q === 0} aria-label={t("removeOne", { name: p.name[locale] })} className="inline-flex size-11 items-center justify-center rounded-pill bg-butter text-garnet disabled:opacity-40">−</button>
                    <span aria-live="polite" className="min-w-6 text-center font-semibold tabular-nums">{q}</span>
                    <button type="button" onClick={() => change(p.slug, 1)} disabled={full} aria-label={t("addOne", { name: p.name[locale] })} className="inline-flex size-11 items-center justify-center rounded-pill bg-ribbon text-white disabled:opacity-40">+</button>
                  </div>
                </li>
              );
            })}
          </ul>
          {orderable.length === 0 && <p className="rounded-md bg-butter p-4">{tc("pricePending")}</p>}
        </section>
      </div>
    </div>
  );
}
