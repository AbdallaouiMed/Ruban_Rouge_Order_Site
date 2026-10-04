/**
 * Single source of truth for Ruban Rouge business facts.
 *
 * Every value here was extracted from the first website
 * (Downloads/Ruban-Rouge_Website-main) unless marked TODO_OWNER.
 * TODO_OWNER means: not found in the old site, do NOT guess, ask the owners.
 * `npm run check:placeholders` lists them; a production build must fail
 * while any remain (see scripts/check-placeholders.mjs).
 */

export const TODO_OWNER = "TODO_OWNER" as const;
export type Todo = typeof TODO_OWNER;

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface OpeningWindow {
  /** 24h "HH:MM", local time Africa/Casablanca */
  open: string;
  close: string;
}

export const bakery = {
  name: "Ruban Rouge",
  nameAr: "روبان روج",
  city: "Meknès",
  country: "MA",
  /** Self-reported by the old site; unverified. */
  foundedYear: 1940,
  timezone: "Africa/Casablanca",

  address: {
    street: "198 Bd des F.A.R., Résidence Al Hamd",
    city: "Meknès",
    /** Only appeared in the old JSON-LD; not confirmed by owners. */
    postalCode: "50000",
    country: "Maroc",
  },

  /** Old coordinates (33.8992, -5.5271) are plausible but unverified. */
  geo: { lat: TODO_OWNER, lng: TODO_OWNER } as { lat: number | Todo; lng: number | Todo },
  /** Owner-provided Google Maps place (feature id 0xda044fcfca8a8bf:0x3af70ffff4b9e993). Opens the real listing. */
  mapsUrl: "https://www.google.com/maps/place/ruban+rouge+meknes/data=!4m2!3m1!1s0xda044fcfca8a8bf:0x3af70ffff4b9e993",
  /** Keyless embed of the same place, addressed by its Google CID (the hex id above, in decimal). */
  mapEmbedUrl: "https://www.google.com/maps?cid=4248882365444254099&output=embed",

  phones: {
    boutique: "+212535510010",
    orders: "+212663206008",
  },
  /** E.164 digits without "+", used for wa.me links. Unconfirmed that orders line has WhatsApp. */
  whatsappNumber: TODO_OWNER as string | Todo,

  /** Inbox for order and form alerts. Not displayed publicly. */
  notificationEmail: "ruban-rouge@outlook.com",

  social: {
    instagram: "https://instagram.com/ruban_rouge_meknes",
    instagramHandle: "@ruban_rouge_meknes",
    facebook: "https://facebook.com/PatisserieRubanRouge",
  },

  /**
   * Canonical origin for links, hreflang and the sitemap. NEXT_PUBLIC_SITE_URL wins, then the Vercel
   * production URL; the old site's domain is only a last-resort placeholder (not confirmed as theirs).
   */
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://rubanrouge-meknes.ma"),

  /** Old site: every day 06:30 - 22:30. No Ramadan/Friday/holiday variation known. */
  hours: {
    mon: { open: "06:30", close: "22:30" },
    tue: { open: "06:30", close: "22:30" },
    wed: { open: "06:30", close: "22:30" },
    thu: { open: "06:30", close: "22:30" },
    fri: { open: "06:30", close: "22:30" },
    sat: { open: "06:30", close: "22:30" },
    sun: { open: "06:30", close: "22:30" },
  } satisfies Record<DayKey, OpeningWindow | null>,

  /** Ordering rules the owners must confirm; safe defaults until then. */
  ordering: {
    currency: "MAD",
    pickupLeadTimeMinutes: TODO_OWNER as number | Todo,
    slotLengthMinutes: 30,
    delivery: {
      city: "Meknès",
      fee: TODO_OWNER as number | Todo,
      freeAbove: TODO_OWNER as number | Todo,
      minimumOrder: TODO_OWNER as number | Todo,
    },
    cakeLeadTimeDays: TODO_OWNER as number | Todo,
  },
} as const;

export const categories = [
  { id: "boulangerie", fr: "Boulangerie", en: "Bakery", ar: "المخبوزات" },
  { id: "viennoiseries", fr: "Viennoiseries", en: "Viennoiseries", ar: "الفيينوازري" },
  { id: "patisseries", fr: "Pâtisseries", en: "Pastries", ar: "الحلويات" },
  { id: "chocolats", fr: "Chocolats", en: "Chocolates", ar: "الشوكولاتة" },
  { id: "glaces", fr: "Glaces", en: "Ice cream", ar: "المثلجات" },
  { id: "gateaux", fr: "Gâteaux sur commande", en: "Custom cakes", ar: "كعك مخصص" },
  // Listed in the old site's category names but with no products or filter.
  { id: "marocaine", fr: "Pâtisserie marocaine", en: "Moroccan pastry", ar: "الحلويات المغربية" },
] as const;

export type CategoryId = (typeof categories)[number]["id"];

/**
 * French product names come from the old site (EN/AR names are plain translations
 * for owners to review). Everything else is TODO_OWNER:
 * the old site had no prices, descriptions, allergens or real photos.
 */
export interface SeedProduct {
  slug: string;
  category: CategoryId;
  name: { fr: string; en: string; ar: string };
  priceMad: number | Todo;
  /** Local file in /public/images when real photo exists. */
  image: string | null;
}

export const seedProducts: readonly SeedProduct[] = [
  { slug: "pain-tradition", category: "boulangerie", name: { fr: "Pain Tradition", en: "Traditional bread", ar: "خبز تقليدي" }, priceMad: TODO_OWNER, image: null },
  { slug: "baguette", category: "boulangerie", name: { fr: "Baguette", en: "Baguette", ar: "باغيت" }, priceMad: TODO_OWNER, image: null },
  { slug: "croissant-au-beurre", category: "viennoiseries", name: { fr: "Croissant au Beurre", en: "Butter croissant", ar: "كرواسان بالزبدة" }, priceMad: TODO_OWNER, image: null },
  { slug: "pain-au-chocolat", category: "viennoiseries", name: { fr: "Pain au Chocolat", en: "Pain au chocolat", ar: "بان أو شوكولا" }, priceMad: TODO_OWNER, image: null },
  { slug: "mille-feuille", category: "patisseries", name: { fr: "Mille-Feuille", en: "Mille-feuille", ar: "ميل فوي" }, priceMad: TODO_OWNER, image: null },
  { slug: "eclair-au-chocolat", category: "patisseries", name: { fr: "Éclair au Chocolat", en: "Chocolate éclair", ar: "إكلير بالشوكولاتة" }, priceMad: TODO_OWNER, image: null },
  { slug: "truffes-artisanales", category: "chocolats", name: { fr: "Truffes Artisanales", en: "Artisan truffles", ar: "ترافل حرفي" }, priceMad: TODO_OWNER, image: null },
  { slug: "glace-vanille", category: "glaces", name: { fr: "Glace Vanille", en: "Vanilla ice cream", ar: "آيس كريم بالفانيليا" }, priceMad: TODO_OWNER, image: null },
];

/**
 * Story facts from the old site. The wording is template-like and the
 * details (French-trained grandfather, milestones) are UNCONFIRMED:
 * owners must validate before this content is published.
 */
export const storyDraft = {
  confirmed: false as boolean,
  founder: "grandfather, master pastry chef trained in France (unconfirmed)",
  generations: 3,
  timeline: [
    { year: 1940, key: "origins" },
    { year: 1965, key: "expansion" },
    { year: 1985, key: "secondGeneration" },
    { year: 2000, key: "diversification" },
    { year: 2015, key: "thirdGeneration" },
    { year: 2026, key: "today" },
  ],
} as const;

/**
 * Testimonials, aggregate rating and review counts from the old site
 * are NOT included: they looked fabricated (rating 4.8 / 150 reviews,
 * four names). Add only real, owner-approved reviews here.
 */
export const reviews: readonly { author: string; text: string; rating: 1 | 2 | 3 | 4 | 5 }[] = [];

export const yearsOfCraft = (now = new Date()) => now.getFullYear() - bakery.foundedYear;
