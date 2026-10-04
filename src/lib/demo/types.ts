import type { DayKey, OpeningWindow } from "@/data/bakery";
import type { Locale } from "@/i18n/routing";

export type L = Record<Locale, string>;

export type OrderStatus = "new" | "confirmed" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled";
export type OrderKind = "order" | "gift" | "cake";
export type FulfillmentMethod = "pickup" | "delivery";
export type BoxSize = 6 | 12 | 24;

export interface BoxContents {
  size: BoxSize;
  items: { slug: string; qty: number }[];
}

/** What the customer put in the cart. Prices are NOT stored: they are recomputed when the order is placed. */
export interface CartItem {
  id: string;
  kind: "product" | "box" | "bundle";
  slug?: string;
  bundleId?: string;
  box?: BoxContents;
  qty: number;
  note?: string;
}

export interface GiftInfo {
  recipientName: string;
  recipientPhone: string;
  address: string;
  message: string;
  cardStyle: "ribbon" | "floral" | "classic";
  senderName: string;
}

export interface OrderLine {
  label: string;
  qty: number;
  unitPrice: number;
  note?: string;
  /** Box contents, snapshotted so the bakery can prepare it */
  details?: string;
}

export interface CakeSpec {
  occasion: string;
  servings: number;
  flavor: string;
  filling: string;
  frosting: string;
  decorations: string[];
  dedication: string;
  date: string;
  budget: string;
  estimateLow: number;
  estimateHigh: number;
  /** Small data URL, demo only */
  photo?: string;
  summary: string;
}

export interface StatusEvent {
  status: OrderStatus;
  at: string;
  note?: string;
}

export interface Order {
  id: string;
  number: string;
  createdAt: string;
  kind: OrderKind;
  status: OrderStatus;
  history: StatusEvent[];
  customer: { name: string; phone: string; email?: string };
  method: FulfillmentMethod;
  /** Local wall-clock "YYYY-MM-DDTHH:mm" in Africa/Casablanca; for cakes, the event date */
  slot?: string;
  address?: string;
  lines: OrderLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  payment: "cash";
  note?: string;
  gift?: GiftInfo;
  cake?: CakeSpec;
  locale: Locale;
  /** Set on demo-generated orders */
  simulated?: boolean;
}

export interface Settings {
  deliveryFee: number;
  freeAbove: number;
  minOrder: number;
  leadMinutes: number;
  slotMinutes: number;
  cakeLeadDays: number;
  boxFee: number;
  hours: Record<DayKey, OpeningWindow | null>;
}

export interface ProductOverride {
  priceMad?: number;
  soldOut?: boolean;
  freshToday?: boolean;
  /** Resized data URL uploaded from the admin; null hides the photo and shows the illustration */
  image?: string | null;
}

export const SITE_IMAGE_SLOTS = ["hero", "story", "occasions", "box", "cakes", "gift"] as const;
export type SiteImageSlot = (typeof SITE_IMAGE_SLOTS)[number];
