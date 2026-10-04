"use client";

import type { ReactNode } from "react";
import type { Order, OrderStatus } from "@/lib/demo/types";
import { statusLabelFr } from "@/lib/orders";

/** Admin screens are French only (demo). Shared small pieces. */

export const statusStyle: Record<OrderStatus, string> = {
  new: "bg-ribbon text-white",
  confirmed: "bg-saffron-deep text-white",
  preparing: "bg-zellige text-white",
  ready: "bg-success text-white",
  out_for_delivery: "bg-zellige text-white",
  completed: "bg-cocoa-soft text-white",
  cancelled: "bg-danger text-white",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-flex items-center rounded-pill px-3 py-1 text-(length:--text-xs) font-bold ${statusStyle[status]}`}>{statusLabelFr[status]}</span>;
}

export function PageHeader({ title, children, subtitle }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-(length:--text-3xl) leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-cocoa-soft">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  );
}

export const adminBtn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-pill px-5 font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50";
export const adminBtnPrimary = `${adminBtn} bg-ribbon text-white hover:bg-garnet`;
export const adminBtnSecondary = `${adminBtn} bg-butter text-garnet hover:bg-[#ecd3a3]`;
export const adminBtnDanger = `${adminBtn} bg-white text-danger ring-2 ring-danger/40 hover:bg-danger hover:text-white`;

export const fieldClass = "min-h-11 w-full rounded-sm border border-cocoa/30 bg-white px-3";

/** "il y a 6 min" */
export function ago(iso: string, now = Date.now()) {
  const min = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
}

export const isToday = (iso: string, now = new Date()) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Africa/Casablanca" }).format(new Date(iso)) === new Intl.DateTimeFormat("fr-CA", { timeZone: "Africa/Casablanca" }).format(now);

export const orderKindFr: Record<Order["kind"], string> = { order: "Commande", gift: "Cadeau", cake: "Gâteau sur mesure" };
