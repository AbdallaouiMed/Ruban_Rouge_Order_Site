"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { ProductCard } from "./ProductCard";
import { categoryLabel, normalize, type Product } from "@/lib/products";
import type { CategoryId } from "@/data/bakery";
import type { Locale } from "@/i18n/routing";

export function MenuBrowser({ products }: { products: Product[] }) {
  const t = useTranslations("menu");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const categoryIds = useMemo(() => [...new Set(products.map((p) => p.category))] as CategoryId[], [products]);
  const hasFresh = products.some((p) => p.freshToday);

  const cat = params.get("cat");
  const active = categoryIds.includes(cat as CategoryId) ? (cat as CategoryId) : null;
  const freshOnly = params.get("fresh") === "1" && hasFresh;
  const [query, setQuery] = useState(params.get("q") ?? "");

  const update = (next: { cat?: string | null; q?: string; fresh?: boolean }) => {
    const sp = new URLSearchParams(params.toString());
    const set = (k: string, v: string | null | undefined) => (v ? sp.set(k, v) : sp.delete(k));
    if ("cat" in next) set("cat", next.cat);
    if ("q" in next) set("q", next.q?.trim());
    if ("fresh" in next) set("fresh", next.fresh ? "1" : null);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const visible = useMemo(() => {
    const q = normalize(query);
    return products.filter((p) => {
      if (active && p.category !== active) return false;
      if (freshOnly && !p.freshToday) return false;
      if (!q) return true;
      return normalize(`${p.name[locale]} ${p.name.fr} ${categoryLabel(p.category, locale)}`).includes(q);
    });
  }, [products, active, freshOnly, query, locale]);

  const chip = (selected: boolean) =>
    `min-h-11 rounded-pill px-4 text-(length:--text-sm) font-semibold transition-colors ${selected ? "bg-cocoa text-flour" : "bg-butter text-cocoa hover:bg-[#ecd3a3]"}`;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="relative max-w-md">
          <label htmlFor="menu-search" className="sr-only">{t("search")}</label>
          <Search aria-hidden="true" className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-cocoa-soft" />
          <input
            id="menu-search"
            type="search"
            value={query}
            placeholder={t("search")}
            onChange={(e) => {
              setQuery(e.target.value);
              update({ q: e.target.value });
            }}
            className="min-h-12 w-full rounded-pill border border-cocoa/20 bg-white ps-12 pe-4 outline-offset-2 placeholder:text-cocoa-soft"
          />
        </div>

        <div role="group" aria-label={t("filters")} className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={active === null} className={chip(active === null)} onClick={() => update({ cat: null })}>
            {t("all")}
          </button>
          {categoryIds.map((id) => (
            <button key={id} type="button" aria-pressed={active === id} className={chip(active === id)} onClick={() => update({ cat: id })}>
              {categoryLabel(id, locale)}
            </button>
          ))}
          {hasFresh && (
            <button type="button" aria-pressed={freshOnly} className={chip(freshOnly)} onClick={() => update({ fresh: !freshOnly })}>
              {t("freshOnly")}
            </button>
          )}
        </div>
      </div>

      <p role="status" className="text-(length:--text-sm) text-cocoa-soft">{t("results", { count: visible.length })}</p>

      {visible.length === 0 ? (
        <div className="rounded-md bg-butter p-8 text-center">
          <p>{t("empty")}</p>
          <button
            type="button"
            className="mt-4 min-h-11 rounded-pill bg-ribbon px-5 font-semibold text-white hover:bg-garnet"
            onClick={() => {
              setQuery("");
              router.replace(pathname, { scroll: false });
            }}
          >
            {t("reset")}
          </button>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((p) => (
            <li key={p.slug}>
              <ProductCard product={p} headingAs="h2" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
