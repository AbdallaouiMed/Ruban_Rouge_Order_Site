"use client";

import { useLocale, useTranslations } from "next-intl";
import { Check, Gift, MessageCircle, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { RibbonDivider } from "@/components/ui/RibbonDivider";
import { isDemo } from "@/lib/demo/config";
import { useDemoData, useHydration } from "@/lib/demo/store";
import { formatDateTime, formatDay, formatMad, formatSlot } from "@/lib/format";
import { bakeryWhatsApp, orderMessage, whatsAppLink } from "@/lib/whatsapp";
import type { OrderStatus } from "@/lib/demo/types";
import type { Locale } from "@/i18n/routing";

const steps = (method: "pickup" | "delivery"): OrderStatus[] => ["new", "confirmed", "preparing", method === "delivery" ? "out_for_delivery" : "ready", "completed"];

/** Order confirmation. It reads the order from this device and updates live when the admin changes its status. */
export function OrderView({ id }: { id: string }) {
  const t = useTranslations("order");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const ready = useHydration((s) => s.ready);
  const order = useDemoData((s) => s.orders.find((o) => o.id === id));

  if (!ready) return <div className="h-96 animate-pulse rounded-md bg-butter" aria-hidden="true" />;
  if (!order) {
    return (
      <div className="rounded-md bg-butter p-8 text-center">
        <h1 className="font-display text-(length:--text-2xl)">{t("notFound")}</h1>
        <p className="mt-2 text-cocoa-soft">{t("notFoundText")}</p>
        <Link href="/menu" className={buttonClasses("primary", "mt-5")}>{t("backToMenu")}</Link>
      </div>
    );
  }

  const cancelled = order.status === "cancelled";
  const flow = steps(order.method);
  const currentIndex = flow.indexOf(order.status);
  const isCake = order.kind === "cake";
  const wa = whatsAppLink(bakeryWhatsApp(), orderMessage(order));

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="font-display text-(length:--text-sm) font-semibold tracking-widest text-saffron-deep uppercase">{order.number}</p>
        <h1 className="font-display text-(length:--text-4xl) leading-tight text-ribbon">{isCake ? t("cakeTitle") : t("title", { name: order.customer.name.split(" ")[0] })}</h1>
        <p className="max-w-prose text-(length:--text-lg) text-cocoa-soft">{isCake ? t("cakeText") : t("subtitle", { number: order.number })}</p>
        {isDemo && <p role="note" className="inline-block rounded-pill bg-butter px-4 py-2 text-(length:--text-sm)">{t("demoNote")}</p>}
      </header>

      <RibbonDivider animate />

      <section aria-labelledby="progress" className="space-y-4">
        <h2 id="progress" className="font-display text-(length:--text-xl)">{t("progress")}</h2>
        {cancelled ? (
          <p role="status" className="flex items-center gap-2 rounded-md bg-danger p-4 font-semibold text-white"><X aria-hidden="true" />{t("status.cancelled")}</p>
        ) : (
          <ol className="grid gap-3 sm:grid-cols-5" aria-label={t("progress")}>
            {flow.map((s, i) => {
              const done = i < currentIndex || order.status === "completed";
              const current = i === currentIndex && order.status !== "completed";
              return (
                <li key={s} aria-current={current ? "step" : undefined} className={`flex items-center gap-3 rounded-md p-3 sm:flex-col sm:text-center ${current ? "bg-ribbon text-white" : done ? "bg-success text-white" : "bg-butter text-cocoa-soft"}`}>
                  <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-white/25 font-semibold">{done ? <Check className="size-4" /> : i + 1}</span>
                  <span className="text-(length:--text-sm) font-semibold">{t(`status.${s}`)}</span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="details" className="space-y-3 rounded-md bg-white p-6 shadow-soft">
          <h2 id="details" className="font-display text-(length:--text-xl)">{t("details")}</h2>
          <dl className="space-y-2">
            {order.slot && (
              <div>
                <dt className="text-(length:--text-sm) text-cocoa-soft">{isCake ? t("eventDate") : order.method === "pickup" ? t("pickupAt") : t("deliveryAt")}</dt>
                <dd className="font-semibold">{isCake ? formatDay(order.slot.slice(0, 10), locale) : formatSlot(order.slot, locale)}</dd>
              </div>
            )}
            {order.address && (
              <div>
                <dt className="text-(length:--text-sm) text-cocoa-soft">{t("address")}</dt>
                <dd className="font-semibold"><bdi>{order.address}</bdi></dd>
              </div>
            )}
            {!isCake && (
              <div>
                <dt className="text-(length:--text-sm) text-cocoa-soft">{t("payment")}</dt>
                <dd className="font-semibold">{t("paymentCash")}</dd>
              </div>
            )}
            <div>
              <dt className="text-(length:--text-sm) text-cocoa-soft">{t("placedAt")}</dt>
              <dd className="font-semibold">{formatDateTime(order.createdAt, locale)}</dd>
            </div>
          </dl>
          {order.gift && (
            <div className="rounded-sm bg-butter p-3">
              <p className="flex items-center gap-2 font-semibold"><Gift aria-hidden="true" className="size-5 text-ribbon" />{t("giftTo", { name: order.gift.recipientName })}</p>
              <p className="mt-1 text-(length:--text-sm) text-cocoa-soft">{t("cardMessage")} : “{order.gift.message}”</p>
            </div>
          )}
        </section>

        <section aria-labelledby="items" className="space-y-3 rounded-md bg-white p-6 shadow-soft">
          <h2 id="items" className="font-display text-(length:--text-xl)">{t("items")}</h2>
          <ul className="divide-y divide-cocoa/10">
            {order.lines.map((l, i) => (
              <li key={i} className="flex justify-between gap-3 py-2">
                <span>
                  <span className="font-semibold">{l.qty} × {l.label}</span>
                  {l.details && <span className="block text-(length:--text-sm) text-cocoa-soft">{l.details}</span>}
                  {l.note && <span className="block text-(length:--text-sm) text-cocoa-soft">“{l.note}”</span>}
                </span>
                {!isCake && <span className="font-semibold">{formatMad(l.qty * l.unitPrice, locale)}</span>}
              </li>
            ))}
          </ul>
          {isCake && order.cake ? (
            <p className="rounded-sm bg-butter p-3 font-semibold">{t("estimate")} : {formatMad(order.cake.estimateLow, locale)} – {formatMad(order.cake.estimateHigh, locale)}</p>
          ) : (
            <dl className="space-y-1 border-t border-cocoa/10 pt-3">
              <div className="flex justify-between"><dt>{tc("subtotal")}</dt><dd>{formatMad(order.subtotal, locale)}</dd></div>
              {order.method === "delivery" && <div className="flex justify-between"><dt>{tc("delivery")}</dt><dd>{order.deliveryFee > 0 ? formatMad(order.deliveryFee, locale) : tc("free")}</dd></div>}
              <div className="flex justify-between text-(length:--text-lg) font-bold text-ribbon"><dt>{tc("total")}</dt><dd>{formatMad(order.total, locale)}</dd></div>
            </dl>
          )}
        </section>
      </div>

      <section className="space-y-3 rounded-md bg-butter p-6">
        <p>{t("waHint")}</p>
        <div className="flex flex-wrap gap-3">
          <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonClasses("primary")}>
            <MessageCircle aria-hidden="true" className="size-5" />
            {t("sendWhatsApp")}
          </a>
          <Link href="/menu" className={buttonClasses("secondary")}>{t("backToMenu")}</Link>
        </div>
      </section>
    </div>
  );
}
