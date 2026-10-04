"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Gift, MapPin, Store } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { PastryArt } from "@/components/ui/PastryArt";
import { Photo } from "@/components/ui/Photo";
import { SlotPicker } from "@/components/shop/SlotPicker";
import { useLineInfo } from "@/components/shop/CartDrawer";
import { useCartSummary, useSettings } from "@/lib/demo/hooks";
import { useCart, useDemoData, useHydration } from "@/lib/demo/store";
import { formatMad } from "@/lib/format";
import type { FulfillmentMethod } from "@/lib/demo/types";
import type { Locale } from "@/i18n/routing";

type Errors = Partial<Record<"name" | "phone" | "email" | "address" | "slot" | "form", string>>;

const input = "mt-1 min-h-12 w-full rounded-sm border bg-white px-4 py-2 border-cocoa/30 aria-[invalid=true]:border-2 aria-[invalid=true]:border-danger";

export function CheckoutForm() {
  const t = useTranslations("checkout");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const ready = useHydration((s) => s.ready);
  const items = useCart((s) => s.items);
  const gift = useCart((s) => s.gift);
  const settings = useSettings();
  const placeOrder = useDemoData((s) => s.placeOrder);
  const info = useLineInfo();

  const [pickedMethod, setMethod] = useState<FulfillmentMethod>("pickup");
  const method: FulfillmentMethod = gift ? "delivery" : pickedMethod;
  const summary = useCartSummary(method);

  const [slot, setSlot] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  if (!ready) return <div className="h-96 animate-pulse rounded-md bg-butter" aria-hidden="true" />;

  if (items.length === 0) {
    return (
      <div className="rounded-md bg-butter p-8 text-center">
        <h2 className="font-display text-(length:--text-xl)">{t("emptyTitle")}</h2>
        <p className="mt-2 text-cocoa-soft">{t("emptyText")}</p>
        <Link href="/menu" className={buttonClasses("primary", "mt-5")}>
          {t("backToMenu")}
        </Link>
      </div>
    );
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) ?? "").trim();
    setBusy(true);
    const res = placeOrder({
      items,
      customer: { name: get("name"), phone: get("phone"), email: get("email") || undefined },
      method,
      slot,
      address: get("address"),
      note: get("note"),
      gift,
      locale,
    });
    if (res.ok) {
      useCart.getState().clear();
      router.push(`/order/${res.order.id}`);
      return;
    }
    setBusy(false);
    const field = (["name", "phone", "email", "address", "slot"] as const).find((f) => f === res.error);
    setErrors(field ? { [field]: res.error } : { form: res.error });
    const target = field ? e.currentTarget.querySelector<HTMLElement>(field === "slot" ? "#slot-anchor" : `[name="${field}"]`) : null;
    target?.focus();
    if (res.error === "below_minimum") setErrors({ form: "below_minimum" });
  }

  const err = (f: keyof Errors) =>
    errors[f] ? (
      <p id={`err-${f}`} role="alert" className="mt-1 text-(length:--text-sm) font-semibold text-danger">
        {t(`errors.${errors[f]}`, { min: formatMad(settings.minOrder, locale) })}
      </p>
    ) : null;
  const fp = (f: "name" | "phone" | "email" | "address") => ({ name: f, "aria-invalid": errors[f] ? (true as const) : undefined, "aria-describedby": errors[f] ? `err-${f}` : undefined });

  const methodCard = (value: FulfillmentMethod, icon: React.ReactNode, title: string, hint: string) => (
    <label className={`flex cursor-pointer items-start gap-3 rounded-md border-2 p-4 transition-colors ${method === value ? "border-ribbon bg-white shadow-soft" : "border-transparent bg-butter hover:bg-[#ecd3a3]"} ${gift && value === "pickup" ? "pointer-events-none opacity-50" : ""}`}>
      <input type="radio" name="method" value={value} checked={method === value} disabled={!!gift && value === "pickup"} onChange={() => { setMethod(value); setSlot(""); }} className="mt-1 size-5 accent-[#B3202A]" />
      <span className="text-ribbon">{icon}</span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-(length:--text-sm) text-cocoa-soft">{hint}</span>
      </span>
    </label>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="space-y-8">
        <fieldset className="space-y-3">
          <legend className="font-display text-(length:--text-xl)">{t("fulfillment")}</legend>
          {gift && (
            <p className="flex items-center gap-2 rounded-md bg-butter p-3 text-(length:--text-sm) font-semibold">
              <Gift aria-hidden="true" className="size-5 text-ribbon" />
              {t("giftTo", { name: gift.recipientName })} · {t("giftLocked")}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {methodCard("pickup", <Store aria-hidden="true" />, t("pickup"), t("pickupHint"))}
            {methodCard("delivery", <MapPin aria-hidden="true" />, t("delivery"), t("deliveryHint", { fee: formatMad(settings.deliveryFee, locale), free: formatMad(settings.freeAbove, locale) }))}
          </div>
        </fieldset>

        <div>
          <span id="slot-anchor" tabIndex={-1} className="outline-none" />
          <SlotPicker value={slot} onChange={(s) => { setSlot(s); setErrors((e) => ({ ...e, slot: undefined })); }} legend={method === "pickup" ? t("whenPickup") : t("whenDelivery")} />
          {err("slot")}
        </div>

        <fieldset className="space-y-4">
          <legend className="font-display text-(length:--text-xl)">{t("you")}</legend>
          <div>
            <label htmlFor="c-name" className="font-semibold">{t("name")} <span className="font-normal text-cocoa-soft">*</span></label>
            <input id="c-name" {...fp("name")} autoComplete="name" required maxLength={100} defaultValue={gift?.senderName ?? ""} className={input} />
            {err("name")}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="c-phone" className="font-semibold">{t("phone")} <span className="font-normal text-cocoa-soft">*</span></label>
              <input id="c-phone" {...fp("phone")} type="tel" inputMode="tel" autoComplete="tel" required maxLength={30} dir="ltr" className={input} />
              {err("phone")}
            </div>
            <div>
              <label htmlFor="c-email" className="font-semibold">{t("email")} <span className="font-normal text-cocoa-soft">({tc("optionalLabel")})</span></label>
              <input id="c-email" {...fp("email")} type="email" inputMode="email" autoComplete="email" maxLength={200} dir="ltr" className={input} />
              {err("email")}
            </div>
          </div>
          {method === "delivery" && !gift && (
            <div>
              <label htmlFor="c-address" className="font-semibold">{t("address")} <span className="font-normal text-cocoa-soft">*</span></label>
              <textarea id="c-address" {...fp("address")} rows={3} required maxLength={300} className={input} />
              <p className="text-(length:--text-sm) text-cocoa-soft">{t("addressHint")}</p>
              {err("address")}
            </div>
          )}
          {gift && (
            <p className="rounded-md bg-butter p-3 text-(length:--text-sm)">
              {gift.address}
            </p>
          )}
          <div>
            <label htmlFor="c-note" className="font-semibold">{t("note")} <span className="font-normal text-cocoa-soft">({tc("optionalLabel")})</span></label>
            <textarea id="c-note" name="note" rows={2} maxLength={300} placeholder={t("notePlaceholder")} className={input} />
          </div>
        </fieldset>

        <section className="space-y-2 rounded-md bg-butter p-5">
          <h2 className="font-display text-(length:--text-xl)">{t("payment")}</h2>
          <p className="font-semibold">{t("paymentCash")}</p>
          <p className="text-(length:--text-sm) text-cocoa-soft">{t("paymentNote")}</p>
        </section>
      </div>

      <aside aria-labelledby="summary-title" className="h-fit space-y-4 rounded-md bg-white p-5 shadow-soft lg:sticky lg:top-24">
        <h2 id="summary-title" className="font-display text-(length:--text-xl)">{t("summary")}</h2>
        <ul className="divide-y divide-cocoa/10">
          {summary.lines.map(({ item, unit, error }) => {
            const line = info(item);
            return (
              <li key={item.id} className="flex gap-3 py-3">
                <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-sm bg-butter">{line.image ? <Photo src={line.image} sizes="48px" /> : <PastryArt kind={line.art} className="size-11" />}</div>
                <div className="min-w-0 flex-1 text-(length:--text-sm)">
                  <p className="font-semibold">{item.qty} × {line.title}</p>
                  {line.detail && <p className="text-cocoa-soft">{line.detail}</p>}
                  {item.note && <p className="text-cocoa-soft">“{item.note}”</p>}
                </div>
                <p className={`text-(length:--text-sm) font-semibold ${error ? "text-danger" : ""}`}>{error ? "—" : formatMad(unit * item.qty, locale)}</p>
              </li>
            );
          })}
        </ul>
        <dl className="space-y-1 border-t border-cocoa/10 pt-3">
          <div className="flex justify-between"><dt>{tc("subtotal")}</dt><dd>{formatMad(summary.subtotal, locale)}</dd></div>
          {method === "delivery" && (
            <div className="flex justify-between"><dt>{tc("delivery")}</dt><dd>{summary.deliveryFee > 0 ? formatMad(summary.deliveryFee, locale) : tc("free")}</dd></div>
          )}
          <div className="flex justify-between text-(length:--text-lg) font-bold text-ribbon"><dt>{tc("total")}</dt><dd>{formatMad(summary.total, locale)}</dd></div>
        </dl>
        {method === "delivery" && summary.deliveryFee > 0 && summary.freeDeliveryIn > 0 && (
          <p className="text-(length:--text-sm) text-cocoa-soft">{t("freeIn", { amount: formatMad(summary.freeDeliveryIn, locale) })}</p>
        )}
        {method === "delivery" && summary.belowMinimumBy > 0 && (
          <p role="status" className="rounded-sm bg-butter p-3 text-(length:--text-sm) font-semibold">
            {t("minOrder", { min: formatMad(settings.minOrder, locale), amount: formatMad(summary.belowMinimumBy, locale) })}
          </p>
        )}
        {errors.form && <p role="alert" className="font-semibold text-danger">{t(`errors.${errors.form}`, { min: formatMad(settings.minOrder, locale) })}</p>}
        <button type="submit" disabled={busy || summary.hasProblem} className={buttonClasses("primary", "w-full")}>
          {busy ? t("placing") : t("place")}
        </button>
        {summary.hasProblem && <p role="alert" className="text-(length:--text-sm) font-semibold text-danger">{t("errors.unavailable")}</p>}
      </aside>
    </form>
  );
}
