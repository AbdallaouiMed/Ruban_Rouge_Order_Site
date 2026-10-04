import { bakery, TODO_OWNER } from "@/data/bakery";
import { formatMad, formatSlot } from "@/lib/format";
import type { Order } from "@/lib/demo/types";
import { toWhatsAppNumber } from "@/lib/validation";

/**
 * The bakery's WhatsApp number. Until the owners confirm one, the orders line is used
 * (it may not have WhatsApp: see the TODO_OWNER list).
 */
export const bakeryWhatsApp = () => (bakery.whatsappNumber !== TODO_OWNER ? bakery.whatsappNumber : toWhatsAppNumber(bakery.phones.orders));

export const whatsAppLink = (number: string, text: string) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

/** Message the customer sends to the bakery. Always French: it is the bakery that reads it. */
export function orderMessage(order: Order): string {
  const lines = order.lines.map((l) => `• ${l.qty} × ${l.label}${l.details ? ` (${l.details})` : ""}${l.note ? ` — ${l.note}` : ""}`);
  const when = order.slot ? formatSlot(order.slot, "fr") : "";
  return [
    `Bonjour Ruban Rouge, voici ma commande ${order.number} :`,
    ...lines,
    "",
    order.deliveryFee > 0 ? `Livraison : ${formatMad(order.deliveryFee, "fr")}` : order.method === "delivery" ? "Livraison offerte" : "",
    `Total : ${formatMad(order.total, "fr")} (paiement à la réception)`,
    order.method === "delivery" ? `Livraison le ${when} à : ${order.address}` : `Retrait en boutique le ${when}`,
    order.gift ? `Cadeau pour ${order.gift.recipientName} — message : « ${order.gift.message} »` : "",
    `Nom : ${order.customer.name} · ${order.customer.phone}`,
    order.note ? `Note : ${order.note}` : "",
  ]
    .filter((l, i, a) => l !== "" || (a[i - 1] !== "" && i !== a.length - 1))
    .join("\n");
}

/** Message the bakery sends to the customer from the admin (status updates). */
export function customerMessage(order: Order, status: string): string {
  const base = `Bonjour ${order.customer.name}, ici Ruban Rouge. Votre commande ${order.number}`;
  switch (status) {
    case "confirmed":
      return `${base} est confirmée. Merci !`;
    case "preparing":
      return `${base} est en préparation.`;
    case "ready":
      return `${base} est prête : vous pouvez passer la récupérer en boutique.`;
    case "out_for_delivery":
      return `${base} est en route vers vous.`;
    case "completed":
      return `${base} est terminée. Merci de votre confiance, à bientôt !`;
    case "cancelled":
      return `${base} a dû être annulée. N'hésitez pas à nous appeler pour en discuter.`;
    default:
      return `${base} : nous revenons vers vous très vite.`;
  }
}
