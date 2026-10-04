"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ShoppingBag, Trash2, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { bundles } from "@/data/demo";
import { buttonClasses } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { PastryArt } from "@/components/ui/PastryArt";
import { Photo } from "@/components/ui/Photo";
import { useCart, useUi } from "@/lib/demo/store";
import { useCartSummary, useCatalog } from "@/lib/demo/hooks";
import { formatMad } from "@/lib/format";
import type { CartItem } from "@/lib/demo/types";
import type { Locale } from "@/i18n/routing";

/** Title/detail/art for a cart line in the visitor's language. Shared with the checkout summary. */
export function useLineInfo() {
  const locale = useLocale() as Locale;
  const t = useTranslations("cart");
  const { products } = useCatalog();
  return (item: CartItem): { title: string; detail?: string; art: string; image?: string } => {
    if (item.kind === "bundle") {
      const b = bundles.find((x) => x.id === item.bundleId);
      const first = products.find((p) => p.slug === b?.items[0]?.slug);
      return { title: b?.name[locale] ?? t("collection"), art: "cake", image: first?.image ?? undefined };
    }
    if (item.kind === "box") {
      const parts = (item.box?.items ?? []).map((i) => `${i.qty} × ${products.find((p) => p.slug === i.slug)?.name[locale] ?? i.slug}`);
      const first = products.find((p) => p.slug === item.box?.items[0]?.slug);
      return { title: t("box", { size: item.box?.size ?? 0 }), detail: parts.join(" · "), art: "cake", image: first?.image ?? undefined };
    }
    const p = products.find((x) => x.slug === item.slug);
    return { title: p?.name[locale] ?? item.slug ?? "", art: item.slug ?? "cake", image: p?.image ?? undefined };
  };
}

export function CartDrawer() {
  const t = useTranslations("cart");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const open = useUi((s) => s.cartOpen);
  const setOpen = useUi((s) => s.setCartOpen);
  const { setQty, setNote, remove } = useCart.getState();
  const items = useCart((s) => s.items);
  const summary = useCartSummary("pickup");
  const info = useLineInfo();
  const ref = useRef<HTMLDialogElement>(null);
  const [noteOpen, setNoteOpen] = useState<string | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="cart-title"
      onClose={() => setOpen(false)}
      onClick={(e) => e.target === ref.current && setOpen(false)}
      className="m-0 ms-auto h-dvh max-h-dvh w-full max-w-md bg-flour p-0 text-cocoa shadow-lift backdrop:bg-cocoa/50 open:flex open:flex-col"
    >
      <header className="flex items-center justify-between border-b border-cocoa/10 px-5 py-4">
        <h2 id="cart-title" className="font-display text-(length:--text-xl)">
          {t("title")}
          {summary.count > 0 && <span className="ms-2 text-(length:--text-sm) font-sans text-cocoa-soft">({t("count", { count: summary.count })})</span>}
        </h2>
        <button type="button" onClick={() => setOpen(false)} aria-label={t("close")} className="inline-flex size-11 items-center justify-center rounded-pill hover:bg-butter">
          <X aria-hidden="true" />
        </button>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <ShoppingBag aria-hidden="true" className="size-12 text-ribbon" />
          <p className="font-display text-(length:--text-lg)">{t("empty")}</p>
          <p className="text-cocoa-soft">{t("emptyHint")}</p>
          <Link href="/menu" onClick={() => setOpen(false)} className={buttonClasses("primary")}>
            {t("browse")}
          </Link>
        </div>
      ) : (
        <>
          <ul className="flex-1 divide-y divide-cocoa/10 overflow-y-auto px-5">
            {summary.lines.map(({ item, unit, error }) => {
              const line = info(item);
              return (
                <li key={item.id} className="space-y-2 py-4">
                  <div className="flex gap-3">
                    <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-sm bg-butter">
                      {line.image ? <Photo src={line.image} sizes="64px" /> : <PastryArt kind={line.art} className="size-14" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{line.title}</p>
                      {line.detail && <p className="text-(length:--text-sm) text-cocoa-soft">{line.detail}</p>}
                      {item.note && <p className="text-(length:--text-sm) text-cocoa-soft">“{item.note}”</p>}
                      {error ? (
                        <p role="alert" className="text-(length:--text-sm) font-semibold text-danger">
                          {t("unavailable")}
                        </p>
                      ) : (
                        <p className="font-semibold text-ribbon">{formatMad(unit * item.qty, locale)}</p>
                      )}
                    </div>
                    <button type="button" onClick={() => remove(item.id)} aria-label={t("remove", { name: line.title })} className="inline-flex size-11 shrink-0 items-center justify-center rounded-pill text-cocoa-soft hover:bg-butter hover:text-danger">
                      <Trash2 aria-hidden="true" className="size-5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <QuantityStepper value={item.qty} onChange={(n) => setQty(item.id, n)} label={t("quantityOf", { name: line.title })} />
                    {item.kind === "product" && (
                      <button type="button" className="min-h-11 px-2 text-(length:--text-sm) font-semibold text-ribbon underline-offset-4 hover:underline" onClick={() => setNoteOpen(noteOpen === item.id ? null : item.id)} aria-expanded={noteOpen === item.id}>
                        {item.note ? t("editNote") : t("addNote")}
                      </button>
                    )}
                  </div>
                  {noteOpen === item.id && (
                    <div>
                      <label htmlFor={`note-${item.id}`} className="sr-only">
                        {t("noteLabel")}
                      </label>
                      <input id={`note-${item.id}`} type="text" maxLength={200} defaultValue={item.note ?? ""} placeholder={t("notePlaceholder")} onBlur={(e) => setNote(item.id, e.target.value)} className="min-h-11 w-full rounded-sm border border-cocoa/30 bg-white px-3" />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <footer className="space-y-3 border-t border-cocoa/10 bg-white px-5 py-4">
            <div className="flex items-center justify-between text-(length:--text-lg)">
              <span>{tc("subtotal")}</span>
              <strong className="text-ribbon">{formatMad(summary.subtotal, locale)}</strong>
            </div>
            <p className="text-(length:--text-sm) text-cocoa-soft">{t("deliveryNote")}</p>
            {summary.hasProblem ? (
              <p role="alert" className="font-semibold text-danger">
                {t("fixProblems")}
              </p>
            ) : (
              <Link href="/checkout" onClick={() => setOpen(false)} className={buttonClasses("primary", "w-full")}>
                {t("checkout")}
              </Link>
            )}
            <button type="button" onClick={() => setOpen(false)} className={buttonClasses("ghost", "w-full")}>
              {t("continue")}
            </button>
          </footer>
        </>
      )}
    </dialog>
  );
}
