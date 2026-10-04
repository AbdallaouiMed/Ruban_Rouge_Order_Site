"use client";

import { useMemo } from "react";
import { ClipboardList, ExternalLink, Package, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useDemoData, useHydration } from "@/lib/demo/store";
import { formatMad } from "@/lib/format";
import { isOpenOrder } from "@/lib/orders";
import { PageHeader, StatusBadge, adminBtnPrimary, adminBtnSecondary, ago, isToday } from "./ui";

const dayKey = (d: Date) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Africa/Casablanca" }).format(d);
const dayLabel = (d: Date) => new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Casablanca", weekday: "short" }).format(d);

function Stat({ label, value, hint, accent = false }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className={`rounded-md p-5 shadow-soft ${accent ? "bg-ribbon text-white" : "bg-white"}`}>
      <p className={`text-(length:--text-sm) ${accent ? "opacity-90" : "text-cocoa-soft"}`}>{label}</p>
      <p className="mt-1 font-display text-(length:--text-3xl) leading-none">{value}</p>
      {hint && <p className={`mt-2 text-(length:--text-xs) ${accent ? "opacity-90" : "text-cocoa-soft"}`}>{hint}</p>}
    </div>
  );
}

export function DashboardView() {
  const ready = useHydration((s) => s.ready);
  const orders = useDemoData((s) => s.orders);
  const simulate = useDemoData((s) => s.simulateOrder);

  const data = useMemo(() => {
    const now = new Date();
    const today = orders.filter((o) => isToday(o.createdAt, now));
    const revenue = today.filter((o) => o.status !== "cancelled" && o.kind !== "cake").reduce((n, o) => n + o.total, 0);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getTime() - (6 - i) * 86_400_000);
      return { key: dayKey(d), label: dayLabel(d), count: 0 };
    });
    for (const o of orders) {
      const k = dayKey(new Date(o.createdAt));
      const slot = days.find((d) => d.key === k);
      if (slot && o.status !== "cancelled") slot.count++;
    }
    const sold = new Map<string, number>();
    for (const o of orders) {
      if (o.status === "cancelled" || o.kind === "cake") continue;
      for (const l of o.lines) sold.set(l.label, (sold.get(l.label) ?? 0) + l.qty);
    }
    return {
      todayCount: today.length,
      revenue,
      toProcess: orders.filter((o) => o.status === "new" || o.status === "confirmed").length,
      preparing: orders.filter((o) => o.status === "preparing").length,
      days,
      top: [...sold].sort((a, b) => b[1] - a[1]).slice(0, 5),
      recent: [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
      openCount: orders.filter(isOpenOrder).length,
    };
  }, [orders]);

  if (!ready) return <div className="h-96 animate-pulse rounded-md bg-butter" aria-hidden="true" />;
  const max = Math.max(1, ...data.days.map((d) => d.count));

  return (
    <>
      <PageHeader title="Tableau de bord" subtitle="Vue d'ensemble de la boutique">
        <button type="button" className={adminBtnPrimary} onClick={() => simulate()}><Plus aria-hidden="true" className="size-4" />Simuler une commande</button>
        <Link href="/" className={adminBtnSecondary}><ExternalLink aria-hidden="true" className="size-4" />Voir le site</Link>
      </PageHeader>

      <section aria-label="Chiffres du jour" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Commandes aujourd'hui" value={String(data.todayCount)} />
        <Stat label="Chiffre du jour" value={formatMad(data.revenue, "fr")} hint="hors annulées et devis" />
        <Stat label="À traiter" value={String(data.toProcess)} hint="nouvelles et à confirmer" accent={data.toProcess > 0} />
        <Stat label="En préparation" value={String(data.preparing)} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="week" className="rounded-md bg-white p-5 shadow-soft">
          <h2 id="week" className="font-display text-(length:--text-xl)">Commandes sur 7 jours</h2>
          <ul className="mt-4 flex h-40 items-end gap-2">
            {data.days.map((d) => (
              <li key={d.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-(length:--text-xs) font-semibold">{d.count}</span>
                <span aria-hidden="true" className="w-full rounded-t-sm bg-ribbon" style={{ height: `${Math.max(4, (d.count / max) * 100)}%`, opacity: d.count ? 1 : 0.25 }} />
                <span className="text-(length:--text-xs) text-cocoa-soft">{d.label}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="top" className="rounded-md bg-white p-5 shadow-soft">
          <h2 id="top" className="font-display text-(length:--text-xl)">Les plus commandés</h2>
          {data.top.length === 0 ? (
            <p className="mt-3 text-cocoa-soft">Pas encore de données.</p>
          ) : (
            <ol className="mt-3 space-y-2">
              {data.top.map(([label, qty], i) => (
                <li key={label} className="flex items-center gap-3">
                  <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-butter font-semibold text-garnet">{i + 1}</span>
                  <span className="flex-1">{label}</span>
                  <span className="font-semibold">{qty}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section aria-labelledby="recent" className="mt-6 rounded-md bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h2 id="recent" className="font-display text-(length:--text-xl)">Dernières commandes</h2>
          <Link href="/admin/orders" className="inline-flex min-h-11 items-center gap-1 font-semibold text-ribbon underline-offset-4 hover:underline"><ClipboardList aria-hidden="true" className="size-4" />Tout voir ({data.openCount} à traiter)</Link>
        </div>
        <ul className="mt-2 divide-y divide-cocoa/10">
          {data.recent.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <span><strong>{o.number}</strong> · {o.customer.name} <span className="text-(length:--text-sm) text-cocoa-soft">· {ago(o.createdAt)}</span></span>
              <span className="flex items-center gap-3"><span className="font-semibold">{o.kind === "cake" ? "Devis" : formatMad(o.total, "fr")}</span><StatusBadge status={o.status} /></span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-md bg-butter p-5">
        <h2 className="font-display text-(length:--text-xl)">Ce que vous pouvez faire ici</h2>
        <ul className="mt-2 list-disc space-y-1 ps-5">
          <li><strong>Commandes</strong> : recevoir, confirmer, préparer et terminer les commandes, imprimer le ticket, écrire au client sur WhatsApp.</li>
          <li><strong>Produits et prix</strong> : changer un prix, marquer « frais aujourd&apos;hui » ou « épuisé », remplacer la photo d&apos;un produit.</li>
          <li><strong>Images du site</strong> : changer la photo d&apos;accueil et les autres visuels.</li>
          <li><strong>Réglages</strong> : horaires, frais de livraison, délais de préparation.</li>
        </ul>
        <p className="mt-3 inline-flex items-center gap-2 text-(length:--text-sm)"><Package aria-hidden="true" className="size-4" />Tout est enregistré sur cet appareil : c&apos;est une démonstration.</p>
      </section>
    </>
  );
}
