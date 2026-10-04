"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { boxSizes, bundles } from "@/data/demo";
import { buttonClasses } from "@/components/ui/Button";
import { GiftCard } from "@/components/shop/GiftCard";
import { houseSelection } from "@/lib/box";
import { useBundlePrice, useCatalog, useSettings } from "@/lib/demo/hooks";
import { useCart } from "@/lib/demo/store";
import { boxUnitPrice } from "@/lib/pricing";
import { formatMad } from "@/lib/format";
import { isValidPhone } from "@/lib/validation";
import type { BoxSize, GiftInfo } from "@/lib/demo/types";
import type { Locale } from "@/i18n/routing";

const field = "mt-1 min-h-12 w-full rounded-sm border bg-white px-4 py-2 border-cocoa/30 aria-[invalid=true]:border-2 aria-[invalid=true]:border-danger";
type Errs = Partial<Record<"recipientName" | "recipientPhone" | "address" | "senderName" | "message", true>>;

function BundleOption({ id, selected, onSelect, locale }: { id: string; selected: boolean; onSelect: () => void; locale: Locale }) {
  const b = bundles.find((x) => x.id === id)!;
  const price = useBundlePrice(b);
  return (
    <label className={`flex cursor-pointer items-center justify-between gap-3 rounded-md border-2 p-3 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ribbon ${selected ? "border-ribbon bg-white shadow-soft" : "border-transparent bg-butter hover:bg-[#ecd3a3]"}`}>
      <input type="radio" name="gift-bundle" checked={selected} onChange={onSelect} className="sr-only" />
      <span className="font-semibold">{b.name[locale]}</span>
      {price !== null && <span className="text-ribbon">{formatMad(price, locale)}</span>}
    </label>
  );
}

export function GiftForm() {
  const t = useTranslations("gift");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { products } = useCatalog();
  const settings = useSettings();
  const add = useCart((s) => s.add);
  const setGift = useCart((s) => s.setGift);

  const [what, setWhat] = useState<"box" | "bundle">("box");
  const [size, setSize] = useState<BoxSize>(12);
  const [bundleId, setBundleId] = useState(bundles[0].id);
  const [style, setStyle] = useState<GiftInfo["cardStyle"]>("ribbon");
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errs>({});
  const [formError, setFormError] = useState<string | null>(null);

  const box = houseSelection(size, products);
  let boxPrice: number | null = null;
  try {
    boxPrice = box ? boxUnitPrice(box, products, settings) : null;
  } catch {
    boxPrice = null;
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const g = (k: string) => String(fd.get(k) ?? "").trim();
    const next: Errs = {};
    if (g("recipientName").length < 2) next.recipientName = true;
    if (!isValidPhone(g("recipientPhone"))) next.recipientPhone = true;
    if (g("address").length < 8) next.address = true;
    if (g("senderName").length < 2) next.senderName = true;
    if (message.trim().length < 3) next.message = true;
    setErrors(next);
    setFormError(null);
    const first = Object.keys(next)[0];
    if (first) {
      e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    if (what === "box" && !box) {
      setFormError(t("nothingAvailable"));
      return;
    }
    add(what === "box" ? { kind: "box", qty: 1, box: box! } : { kind: "bundle", bundleId, qty: 1 });
    setGift({ recipientName: g("recipientName"), recipientPhone: g("recipientPhone"), address: g("address"), message: message.trim(), cardStyle: style, senderName: g("senderName") });
    router.push("/checkout");
  }

  const ap = (k: keyof Errs) => ({ name: k, "aria-invalid": errors[k] ? (true as const) : undefined, "aria-describedby": errors[k] ? `gift-err-${k}` : undefined });
  const e = (k: keyof Errs) => (errors[k] ? <p id={`gift-err-${k}`} role="alert" className="mt-1 text-(length:--text-sm) font-semibold text-danger">{t(`errors.${k}`)}</p> : null);
  const tab = (active: boolean) => `min-h-12 cursor-pointer rounded-pill px-6 py-3 font-semibold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ribbon ${active ? "bg-cocoa text-flour" : "bg-butter hover:bg-[#ecd3a3]"}`;

  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="space-y-8">
        <fieldset className="space-y-3">
          <legend className="font-display text-(length:--text-xl)">{t("what")}</legend>
          <div className="flex flex-wrap gap-3">
            <label className={tab(what === "box")}><input type="radio" name="what" checked={what === "box"} onChange={() => setWhat("box")} className="sr-only" />{t("whatBox")}</label>
            <label className={tab(what === "bundle")}><input type="radio" name="what" checked={what === "bundle"} onChange={() => setWhat("bundle")} className="sr-only" />{t("whatBundle")}</label>
          </div>
          {what === "box" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3" role="group" aria-label={t("boxSize")}>
                {boxSizes.map((n) => (
                  <label key={n} className={tab(size === n)}><input type="radio" name="gift-size" checked={size === n} onChange={() => setSize(n)} className="sr-only" />{t("pieces", { count: n })}</label>
                ))}
              </div>
              <p className="text-cocoa-soft">{t("houseHint")} {boxPrice !== null && <strong className="text-ribbon">{formatMad(boxPrice, locale)}</strong>}</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {bundles.map((b) => <BundleOption key={b.id} id={b.id} selected={bundleId === b.id} onSelect={() => setBundleId(b.id)} locale={locale} />)}
            </div>
          )}
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-display text-(length:--text-xl)">{t("recipient")}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="g-rname" className="font-semibold">{t("recipientName")} <span className="font-normal text-cocoa-soft">*</span></label>
              <input id="g-rname" {...ap("recipientName")} value={to} onChange={(ev) => setTo(ev.target.value)} autoComplete="off" maxLength={100} className={field} />
              {e("recipientName")}
            </div>
            <div>
              <label htmlFor="g-rphone" className="font-semibold">{t("recipientPhone")} <span className="font-normal text-cocoa-soft">*</span></label>
              <input id="g-rphone" {...ap("recipientPhone")} type="tel" inputMode="tel" dir="ltr" maxLength={30} className={field} />
              {e("recipientPhone")}
            </div>
          </div>
          <div>
            <label htmlFor="g-address" className="font-semibold">{t("address")} <span className="font-normal text-cocoa-soft">*</span></label>
            <textarea id="g-address" {...ap("address")} rows={3} maxLength={300} className={field} />
            <p className="text-(length:--text-sm) text-cocoa-soft">{t("addressHint")}</p>
            {e("address")}
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-display text-(length:--text-xl)">{t("card")}</legend>
          <div className="flex flex-wrap gap-3" role="group" aria-label={t("cardStyle")}>
            {(["ribbon", "floral", "classic"] as const).map((s) => (
              <label key={s} className={tab(style === s)}><input type="radio" name="card-style" checked={style === s} onChange={() => setStyle(s)} className="sr-only" />{t(`styles.${s}`)}</label>
            ))}
          </div>
          <div>
            <label htmlFor="g-message" className="font-semibold">{t("message")} <span className="font-normal text-cocoa-soft">*</span></label>
            <textarea id="g-message" {...ap("message")} rows={4} maxLength={300} value={message} onChange={(ev) => setMessage(ev.target.value)} placeholder={t("messagePlaceholder")} className={field} />
            <p className="text-(length:--text-sm) text-cocoa-soft">{message.length}/300</p>
            {e("message")}
          </div>
          <div>
            <label htmlFor="g-from" className="font-semibold">{t("senderName")} <span className="font-normal text-cocoa-soft">*</span></label>
            <input id="g-from" {...ap("senderName")} value={from} onChange={(ev) => setFrom(ev.target.value)} autoComplete="name" maxLength={100} className={field} />
            {e("senderName")}
          </div>
        </fieldset>

        {formError && <p role="alert" className="font-semibold text-danger">{formError}</p>}
        <button type="submit" className={buttonClasses("primary", "w-full sm:w-auto")}>{t("continue")}</button>
        <p className="text-(length:--text-sm) text-cocoa-soft">{t("deliveryNote")}</p>
      </div>

      <aside aria-labelledby="preview" className="h-fit space-y-3 lg:sticky lg:top-24">
        <h2 id="preview" className="font-display text-(length:--text-xl)">{t("preview")}</h2>
        <GiftCard style={style} to={to} from={from} message={message} labels={{ to: t.raw("cardTo") as string, from: t.raw("cardFrom") as string, placeholder: t("messagePlaceholder") }} />
      </aside>
    </form>
  );
}
