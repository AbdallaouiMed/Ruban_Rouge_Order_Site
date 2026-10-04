"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bike, CakeSlice, Gift, MessageCircle, Phone, Plus, Printer, Search, Store } from "lucide-react";
import { useDemoData, useHydration } from "@/lib/demo/store";
import { formatDateTime, formatDay, formatMad, formatSlot } from "@/lib/format";
import { isOpenOrder, nextStatuses, statusLabelFr } from "@/lib/orders";
import { customerMessage, whatsAppLink } from "@/lib/whatsapp";
import { toWhatsAppNumber } from "@/lib/validation";
import type { Order, OrderStatus } from "@/lib/demo/types";
import { PageHeader, StatusBadge, adminBtn, adminBtnDanger, adminBtnPrimary, adminBtnSecondary, ago, fieldClass, orderKindFr } from "./ui";

type Filter = "all" | "new" | "active" | "ready" | "done" | "cancelled";

const filters: { id: Filter; label: string; match: (o: Order) => boolean }[] = [
  { id: "all", label: "Toutes", match: () => true },
  { id: "new", label: "Nouvelles", match: (o) => o.status === "new" },
  { id: "active", label: "En cours", match: (o) => o.status === "confirmed" || o.status === "preparing" },
  { id: "ready", label: "Prêtes / en livraison", match: (o) => o.status === "ready" || o.status === "out_for_delivery" },
  { id: "done", label: "Terminées", match: (o) => o.status === "completed" },
  { id: "cancelled", label: "Annulées", match: (o) => o.status === "cancelled" },
];

/** Verb on the button that moves an order to a status. */
const actionLabel: Record<OrderStatus, string> = {
  new: "",
  confirmed: "Confirmer la commande",
  preparing: "Lancer la préparation",
  ready: "Marquer comme prête",
  out_for_delivery: "Partie en livraison",
  completed: "Marquer comme terminée",
  cancelled: "Annuler la commande",
};

function Ticket({ order }: { order: Order }) {
  return (
    <div className="print-ticket font-mono text-[12px] leading-snug">
      <p className="text-center text-base font-bold">RUBAN ROUGE</p>
      <p className="text-center">Ticket de préparation</p>
      <hr className="my-2 border-black" />
      <p className="text-base font-bold">{order.number} · {orderKindFr[order.kind]}</p>
      <p>{order.method === "delivery" ? "LIVRAISON" : "RETRAIT BOUTIQUE"} : {order.slot ? formatSlot(order.slot, "fr") : "—"}</p>
      <p>{order.customer.name} · {order.customer.phone}</p>
      {order.address && <p>{order.address}</p>}
      <hr className="my-2 border-black" />
      {order.lines.map((l, i) => (
        <div key={i} className="mb-1">
          <p className="font-bold">{l.qty} × {l.label}</p>
          {l.details && <p>{l.details}</p>}
          {l.note && <p>NOTE : {l.note}</p>}
        </div>
      ))}
      {order.gift && <p className="mt-2">CARTE : « {order.gift.message} » (de {order.gift.senderName})</p>}
      {order.note && <p className="mt-2">NOTE COMMANDE : {order.note}</p>}
      <hr className="my-2 border-black" />
      <p className="text-base font-bold">TOTAL : {formatMad(order.total, "fr")} (à encaisser)</p>
    </div>
  );
}

function OrderDetail({ order, onBack }: { order: Order; onBack: () => void }) {
  const setStatus = useDemoData((s) => s.setStatus);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const options = nextStatuses(order);
  const forward = options.filter((s) => s !== "cancelled");
  const waNumber = toWhatsAppNumber(order.customer.phone);

  const print = () => {
    document.body.dataset.print = "ticket";
    window.print();
    delete document.body.dataset.print;
  };

  return (
    <article aria-labelledby="order-heading" className="space-y-5 rounded-md bg-white p-5 shadow-soft sm:p-6">
      <button type="button" onClick={onBack} className={`${adminBtn} -ms-2 px-2 text-ribbon lg:hidden`}><ArrowLeft aria-hidden="true" className="size-4" />Toutes les commandes</button>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="order-heading" className="font-display text-(length:--text-2xl)">{order.number}</h2>
          <p className="text-(length:--text-sm) text-cocoa-soft">{orderKindFr[order.kind]} · reçue le {formatDateTime(order.createdAt, "fr")} ({ago(order.createdAt)}){order.simulated ? " · simulée" : ""}</p>
        </div>
        <StatusBadge status={order.status} />
      </header>

      <section aria-label="Actions" className="space-y-3 rounded-md bg-butter p-4">
        {forward.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {forward.map((s) => (
              <button key={s} type="button" className={adminBtnPrimary} onClick={() => setStatus(order.id, s)}>{actionLabel[s]}</button>
            ))}
            {!cancelling && options.includes("cancelled") && <button type="button" className={adminBtnDanger} onClick={() => setCancelling(true)}>Annuler</button>}
          </div>
        ) : (
          <p className="font-semibold">{order.status === "cancelled" ? "Commande annulée." : "Commande terminée."}</p>
        )}
        {cancelling && (
          <div className="space-y-2">
            <label htmlFor="cancel-reason" className="font-semibold">Motif de l&apos;annulation (facultatif)</label>
            <input id="cancel-reason" className={fieldClass} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex. : produit épuisé" />
            <div className="flex gap-2">
              <button type="button" className={adminBtnDanger} onClick={() => { setStatus(order.id, "cancelled", reason); setCancelling(false); setReason(""); }}>Confirmer l&apos;annulation</button>
              <button type="button" className={adminBtnSecondary} onClick={() => setCancelling(false)}>Retour</button>
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2 border-t border-cocoa/10 pt-3">
          <a className={adminBtnSecondary} href={`tel:${order.customer.phone}`}><Phone aria-hidden="true" className="size-4" />Appeler</a>
          <a className={adminBtnSecondary} target="_blank" rel="noopener noreferrer" href={whatsAppLink(waNumber, customerMessage(order, order.status))}><MessageCircle aria-hidden="true" className="size-4" />WhatsApp au client</a>
          <button type="button" className={adminBtnSecondary} onClick={print}><Printer aria-hidden="true" className="size-4" />Imprimer le ticket</button>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section aria-labelledby="who" className="space-y-1">
          <h3 id="who" className="font-display text-(length:--text-lg)">Client</h3>
          <p className="font-semibold">{order.customer.name}</p>
          <p dir="ltr" className="text-start">{order.customer.phone}</p>
          {order.customer.email && <p dir="ltr" className="text-start text-cocoa-soft">{order.customer.email}</p>}
        </section>
        <section aria-labelledby="when" className="space-y-1">
          <h3 id="when" className="font-display text-(length:--text-lg)">{order.kind === "cake" ? "Événement" : order.method === "delivery" ? "Livraison" : "Retrait en boutique"}</h3>
          <p className="font-semibold">{order.slot ? (order.kind === "cake" ? formatDay(order.slot.slice(0, 10), "fr") : formatSlot(order.slot, "fr")) : "—"}</p>
          {order.address && <p>{order.address}</p>}
          {order.kind !== "cake" && <p className="text-cocoa-soft">Paiement : à la réception (espèces)</p>}
        </section>
      </div>

      {order.gift && (
        <section className="rounded-md bg-butter p-4">
          <h3 className="flex items-center gap-2 font-display text-(length:--text-lg)"><Gift aria-hidden="true" className="size-5 text-ribbon" />Cadeau pour {order.gift.recipientName}</h3>
          <p>Carte ({order.gift.cardStyle}) : « {order.gift.message} » · de la part de {order.gift.senderName}</p>
          <p className="text-(length:--text-sm) text-cocoa-soft">Tél. destinataire : <span dir="ltr">{order.gift.recipientPhone}</span></p>
        </section>
      )}

      {order.cake && (
        <section className="space-y-2 rounded-md bg-butter p-4">
          <h3 className="flex items-center gap-2 font-display text-(length:--text-lg)"><CakeSlice aria-hidden="true" className="size-5 text-ribbon" />Demande de gâteau</h3>
          <p>{order.cake.summary}</p>
          <p className="font-semibold">Estimation affichée au client : {formatMad(order.cake.estimateLow, "fr")} – {formatMad(order.cake.estimateHigh, "fr")}</p>
          {order.cake.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={order.cake.photo} alt="Photo d'inspiration envoyée par le client" className="max-h-48 rounded-sm" />
          )}
        </section>
      )}

      <section aria-labelledby="lines">
        <h3 id="lines" className="font-display text-(length:--text-lg)">Articles</h3>
        <ul className="divide-y divide-cocoa/10">
          {order.lines.map((l, i) => (
            <li key={i} className="flex justify-between gap-3 py-2">
              <span>
                <span className="font-semibold">{l.qty} × {l.label}</span>
                {l.details && <span className="block text-(length:--text-sm) text-cocoa-soft">{l.details}</span>}
                {l.note && <span className="block text-(length:--text-sm) font-semibold text-ribbon">Note : {l.note}</span>}
              </span>
              {order.kind !== "cake" && <span className="font-semibold">{formatMad(l.qty * l.unitPrice, "fr")}</span>}
            </li>
          ))}
        </ul>
        {order.note && <p className="mt-2 rounded-sm bg-butter p-3"><strong>Note de commande :</strong> {order.note}</p>}
        {order.kind !== "cake" && (
          <dl className="mt-3 space-y-1 border-t border-cocoa/10 pt-3">
            <div className="flex justify-between"><dt>Sous-total</dt><dd>{formatMad(order.subtotal, "fr")}</dd></div>
            {order.method === "delivery" && <div className="flex justify-between"><dt>Livraison</dt><dd>{order.deliveryFee > 0 ? formatMad(order.deliveryFee, "fr") : "Offerte"}</dd></div>}
            <div className="flex justify-between text-(length:--text-lg) font-bold text-ribbon"><dt>À encaisser</dt><dd>{formatMad(order.total, "fr")}</dd></div>
          </dl>
        )}
      </section>

      <section aria-labelledby="hist">
        <h3 id="hist" className="font-display text-(length:--text-lg)">Historique</h3>
        <ol className="mt-2 space-y-1 text-(length:--text-sm)">
          {[...order.history].reverse().map((h, i) => (
            <li key={i} className="flex flex-wrap gap-x-2"><span className="font-semibold">{statusLabelFr[h.status]}</span><span className="text-cocoa-soft">{formatDateTime(h.at, "fr")}{h.note ? ` · ${h.note}` : ""}</span></li>
          ))}
        </ol>
      </section>

      <Ticket order={order} />
    </article>
  );
}

export function OrdersView() {
  const ready = useHydration((s) => s.ready);
  const orders = useDemoData((s) => s.orders);
  const simulateOrder = useDemoData((s) => s.simulateOrder);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const counts = useMemo(() => Object.fromEntries(filters.map((f) => [f.id, orders.filter(f.match).length])) as Record<Filter, number>, [orders]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = filters.find((f) => f.id === filter)!.match;
    return orders
      .filter(match)
      .filter((o) => !q || `${o.number} ${o.customer.name} ${o.customer.phone}`.toLowerCase().includes(q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [orders, filter, query]);

  if (!ready) return <div className="h-96 animate-pulse rounded-md bg-butter" aria-hidden="true" />;

  const selected = orders.find((o) => o.id === selectedId) ?? null;
  const detail = selected ?? visible[0] ?? null;
  const open = orders.filter(isOpenOrder).length;

  return (
    <>
      <PageHeader title="Commandes" subtitle={`${open} à traiter · ${orders.length} au total`}>
        <button type="button" className={adminBtnPrimary} onClick={() => { const o = simulateOrder(); setFilter("all"); setSelectedId(o.id); }}>
          <Plus aria-hidden="true" className="size-4" />Simuler une commande
        </button>
      </PageHeader>

      <p className="mb-5 rounded-md bg-butter p-4 text-(length:--text-sm)">
        Démo : ouvrez le site dans un autre onglet, passez une commande, et elle apparaît ici en direct. Faites-la ensuite avancer (confirmer, préparer, prête, terminée) : le client voit l&apos;avancement sur sa page de confirmation.
      </p>

      <div className="mb-4 space-y-3">
        <div role="group" aria-label="Filtrer par statut" className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => { setFilter(f.id); setSelectedId(null); }} className={`${adminBtn} shrink-0 ${filter === f.id ? "bg-cocoa text-flour" : "bg-butter text-cocoa hover:bg-[#ecd3a3]"}`}>
              {f.label} <span className={`ms-1 rounded-pill px-2 text-(length:--text-xs) ${f.id === "new" && counts.new > 0 && filter !== "new" ? "bg-ribbon text-white" : "bg-black/10"}`}>{counts[f.id]}</span>
            </button>
          ))}
        </div>
        <div className="relative max-w-sm">
          <label htmlFor="order-search" className="sr-only">Rechercher une commande</label>
          <Search aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-cocoa-soft" />
          <input id="order-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="N°, nom ou téléphone" className={`${fieldClass} ps-9`} />
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <section aria-label="Liste des commandes" className={selectedId ? "hidden lg:block" : ""}>
          {visible.length === 0 ? (
            <p className="rounded-md bg-white p-6 text-center shadow-soft">Aucune commande dans cette vue.</p>
          ) : (
            <ul className="space-y-2">
              {visible.map((o) => (
                <li key={o.id}>
                  <button type="button" onClick={() => setSelectedId(o.id)} aria-current={detail?.id === o.id ? "true" : undefined} className={`flex w-full items-start gap-3 rounded-md bg-white p-4 text-start shadow-soft transition-shadow hover:shadow-lift aria-[current=true]:ring-2 aria-[current=true]:ring-ribbon`}>
                    <span aria-hidden="true" className="mt-1 text-ribbon">{o.kind === "cake" ? <CakeSlice className="size-5" /> : o.kind === "gift" ? <Gift className="size-5" /> : o.method === "delivery" ? <Bike className="size-5" /> : <Store className="size-5" />}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold">{o.number}</span>
                        <StatusBadge status={o.status} />
                      </span>
                      <span className="block truncate">{o.customer.name}</span>
                      <span className="flex justify-between text-(length:--text-sm) text-cocoa-soft">
                        <span>{ago(o.createdAt, now)}</span>
                        <span className="font-semibold text-cocoa">{o.kind === "cake" ? "Devis" : formatMad(o.total, "fr")}</span>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className={selectedId ? "" : "hidden lg:block"}>
          {detail ? <OrderDetail key={detail.id} order={detail} onBack={() => setSelectedId(null)} /> : <p className="rounded-md bg-white p-6 shadow-soft">Sélectionnez une commande.</p>}
        </div>
      </div>
    </>
  );
}
