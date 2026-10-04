/**
 * PLACEHOLDER DATA for demo mode. None of this comes from the owners.
 * Prices, availability, option lists and bundles are examples so the whole ordering
 * experience can be reviewed. Owners confirm or replace all of it (via the admin) before launch.
 */
import type { L, Settings } from "@/lib/demo/types";
import { bakery } from "./bakery";

/** Demo unit prices in MAD (per piece). */
export const demoPrices: Record<string, number> = {
  "pain-tradition": 4,
  baguette: 2,
  "croissant-au-beurre": 6,
  "pain-au-chocolat": 7,
  "mille-feuille": 18,
  "eclair-au-chocolat": 14,
  "truffes-artisanales": 9,
  "glace-vanille": 15,
};

/**
 * PLACEHOLDER PHOTOS (see public/images/CREDITS.md): stock photography and the three pastry shots the
 * old site shipped, cropped and colour-graded into one look. They are NOT the bakery's own products.
 * Real photography replaces them (admin upload, or `image` in src/data/bakery.ts).
 */
export const demoProductImages: Record<string, string> = Object.fromEntries(
  ["pain-tradition", "baguette", "croissant-au-beurre", "pain-au-chocolat", "mille-feuille", "eclair-au-chocolat", "truffes-artisanales", "glace-vanille"].map((slug) => [slug, `/images/products/${slug}.webp`]),
);

export const demoOccasionImages: Record<string, string> = Object.fromEntries(
  ["ramadan", "eid", "mawlid", "wedding", "engagement", "graduation", "corporate"].map((id) => [id, `/images/occasions/${id}.webp`]),
);

/** Default image for each editable site slot (the admin can replace any of them). */
export const defaultSiteImages = {
  hero: "/images/hero.webp",
  story: "/images/story.webp",
  occasions: "/images/occasions.webp",
  box: "/images/banner-box.webp",
  cakes: "/images/banner-cakes.webp",
  gift: "/images/banner-gift.webp",
} as const;

/** Demo "baked today" board. Real availability comes from the admin. */
export const demoAvailability: Record<string, { freshToday?: boolean; soldOut?: boolean }> = {
  "pain-tradition": { freshToday: true },
  baguette: { freshToday: true },
  "croissant-au-beurre": { freshToday: true },
  "pain-au-chocolat": { freshToday: true },
  "eclair-au-chocolat": { soldOut: true },
};

/**
 * The four products featured under "Nos classiques" on the home page. Chosen to differ from the
 * "fresh today" board (which shows the daily bakes). Owners decide the real selection.
 */
export const signatureSlugs = ["mille-feuille", "eclair-au-chocolat", "truffes-artisanales", "glace-vanille"];

export const defaultSettings: Settings = {
  deliveryFee: 20,
  freeAbove: 200,
  minOrder: 60,
  leadMinutes: 60,
  slotMinutes: 30,
  cakeLeadDays: 3,
  boxFee: 10,
  hours: { ...bakery.hours },
};

/* ---------- Cake studio options ---------- */

export interface Opt {
  id: string;
  label: L;
  add?: number;
}

const o = (id: string, fr: string, en: string, ar: string, add = 0): Opt => ({ id, label: { fr, en, ar }, add });

export const cakeOptions = {
  occasions: [
    o("birthday", "Anniversaire", "Birthday", "عيد ميلاد"),
    o("wedding", "Mariage", "Wedding", "زفاف"),
    o("engagement", "Fiançailles", "Engagement", "خطوبة"),
    o("graduation", "Remise de diplôme", "Graduation", "حفل تخرج"),
    o("baby", "Naissance / baptême", "Baby celebration", "مولود جديد"),
    o("eid", "Aïd / fête religieuse", "Eid / religious holiday", "عيد ديني"),
    o("corporate", "Événement d'entreprise", "Corporate event", "حدث مهني"),
    o("other", "Autre occasion", "Other occasion", "مناسبة أخرى"),
  ],
  sizes: [
    { id: "s", servings: 6, base: 180, factor: 1 },
    { id: "m", servings: 10, base: 280, factor: 1.3 },
    { id: "l", servings: 16, base: 420, factor: 1.8 },
    { id: "xl", servings: 24, base: 600, factor: 2.4 },
    { id: "xxl", servings: 40, base: 950, factor: 3.5 },
  ],
  flavors: [
    o("vanilla", "Vanille", "Vanilla", "فانيليا"),
    o("chocolate", "Chocolat", "Chocolate", "شوكولا", 20),
    o("pistachio", "Pistache", "Pistachio", "فستق", 40),
    o("lemon", "Citron", "Lemon", "ليمون", 10),
    o("orange-blossom", "Fleur d'oranger", "Orange blossom", "زهر البرتقال", 20),
    o("red-fruits", "Fruits rouges", "Red fruits", "فواكه حمراء", 30),
  ],
  fillings: [
    o("cream", "Crème légère", "Light cream", "كريمة خفيفة"),
    o("ganache", "Ganache chocolat", "Chocolate ganache", "غاناش الشوكولا", 25),
    o("praline", "Praliné", "Praline", "برالين", 35),
    o("fruit", "Compotée de fruits", "Fruit compote", "مربى الفواكه", 20),
    o("almond", "Crème d'amande", "Almond cream", "كريمة اللوز", 30),
  ],
  frostings: [
    o("buttercream", "Crème au beurre", "Buttercream", "كريمة الزبدة"),
    o("whipped", "Chantilly", "Whipped cream", "شانتيي"),
    o("naked", "Style naked", "Naked style", "بدون تغطية"),
    o("glaze", "Glaçage ganache", "Ganache glaze", "طلاء الغاناش", 30),
    o("fondant", "Pâte à sucre", "Fondant", "عجينة السكر", 60),
  ],
  decorations: [
    o("ribbon", "Ruban rouge (offert)", "Red ribbon (free)", "شريط أحمر (مجاني)"),
    o("flowers", "Fleurs comestibles", "Edible flowers", "زهور صالحة للأكل", 40),
    o("gold", "Feuilles d'or", "Gold leaf", "رقائق الذهب", 50),
    o("macarons", "Macarons", "Macarons", "ماكارون", 45),
    o("fruit", "Fruits frais", "Fresh fruit", "فواكه طازجة", 35),
    o("topper", "Sujet personnalisé", "Custom topper", "مجسم مخصص", 25),
  ],
  budgets: [
    { id: "b1", max: 300 },
    { id: "b2", max: 500 },
    { id: "b3", max: 800 },
    { id: "b4", max: 1200 },
    { id: "b5", max: null },
  ],
} as const;

/* ---------- Occasion collections ---------- */

export interface Bundle {
  id: string;
  occasion: string;
  name: L;
  desc: L;
  items: { slug: string; qty: number }[];
}

export interface Occasion {
  id: string;
  name: L;
  blurb: L;
  /** Tailwind classes for the card accent */
  accent: string;
}

export const occasions: Occasion[] = [
  { id: "ramadan", name: { fr: "Ramadan", en: "Ramadan", ar: "رمضان" }, blurb: { fr: "Pour la rupture du jeûne et les soirées qui suivent.", en: "For breaking the fast and the evenings that follow.", ar: "للإفطار وللسهرات الرمضانية." }, accent: "bg-zellige text-white" },
  { id: "eid", name: { fr: "Aïd", en: "Eid", ar: "العيد" }, blurb: { fr: "Des boîtes à partager avec toute la famille.", en: "Boxes to share with the whole family.", ar: "علب لتقاسمها مع كل العائلة." }, accent: "bg-ribbon text-white" },
  { id: "mawlid", name: { fr: "Mawlid", en: "Mawlid", ar: "المولد النبوي" }, blurb: { fr: "Une douceur pour la célébration du Mawlid.", en: "A sweet treat for the Mawlid celebration.", ar: "حلاوة لاحتفال المولد النبوي." }, accent: "bg-saffron-deep text-white" },
  { id: "wedding", name: { fr: "Mariage", en: "Weddings", ar: "الأعراس" }, blurb: { fr: "Plateaux et boîtes pour vos invités.", en: "Platters and boxes for your guests.", ar: "صواني وعلب لضيوفكم." }, accent: "bg-garnet text-white" },
  { id: "engagement", name: { fr: "Fiançailles", en: "Engagements", ar: "الخطوبة" }, blurb: { fr: "Une première célébration en beauté.", en: "A first celebration done beautifully.", ar: "احتفال أول بأجمل طريقة." }, accent: "bg-butter text-garnet" },
  { id: "graduation", name: { fr: "Diplômes", en: "Graduations", ar: "التخرج" }, blurb: { fr: "Pour fêter la réussite.", en: "To celebrate the achievement.", ar: "للاحتفال بالنجاح." }, accent: "bg-cocoa text-flour" },
  { id: "corporate", name: { fr: "Entreprises", en: "Corporate", ar: "المؤسسات" }, blurb: { fr: "Petits-déjeuners, réunions et cadeaux clients.", en: "Breakfasts, meetings and client gifts.", ar: "فطور، اجتماعات وهدايا للعملاء." }, accent: "bg-zellige text-white" },
];

const b = (id: string, occasion: string, fr: [string, string], en: [string, string], ar: [string, string], items: [string, number][]): Bundle => ({
  id,
  occasion,
  name: { fr: fr[0], en: en[0], ar: ar[0] },
  desc: { fr: fr[1], en: en[1], ar: ar[1] },
  items: items.map(([slug, qty]) => ({ slug, qty })),
});

export const bundles: Bundle[] = [
  b("ramadan-iftar", "ramadan", ["Plateau Iftar", "Croissants, pains au chocolat et éclairs pour rompre le jeûne."], ["Iftar platter", "Croissants, pains au chocolat and éclairs to break the fast."], ["صينية الإفطار", "كرواسان وبان أو شوكولا وإكلير لكسر الصيام."], [["croissant-au-beurre", 6], ["pain-au-chocolat", 6], ["eclair-au-chocolat", 4]]),
  b("ramadan-sohour", "ramadan", ["Boîte Sohour", "Pains et viennoiseries pour le dernier repas de la nuit."], ["Sohour box", "Breads and viennoiseries for the last meal of the night."], ["علبة السحور", "خبز وفطائر لوجبة السحور."], [["pain-tradition", 4], ["croissant-au-beurre", 4], ["mille-feuille", 2]]),
  b("eid-family", "eid", ["Grande boîte Aïd", "Un assortiment généreux pour la famille réunie."], ["Eid family box", "A generous assortment for the gathered family."], ["علبة العيد العائلية", "تشكيلة سخية للعائلة المجتمعة."], [["mille-feuille", 6], ["eclair-au-chocolat", 6], ["truffes-artisanales", 12]]),
  b("eid-visit", "eid", ["Boîte visite", "Pour accueillir les invités avec élégance."], ["Visit box", "To welcome guests with elegance."], ["علبة الزيارة", "لاستقبال الضيوف بأناقة."], [["truffes-artisanales", 12], ["mille-feuille", 3]]),
  b("mawlid-share", "mawlid", ["Boîte Mawlid", "Douceurs à partager en famille."], ["Mawlid box", "Sweet treats to share with family."], ["علبة المولد", "حلويات لمشاركتها مع العائلة."], [["truffes-artisanales", 12], ["eclair-au-chocolat", 4]]),
  b("mawlid-small", "mawlid", ["Petite boîte Mawlid", "Une attention simple et gourmande."], ["Small Mawlid box", "A simple, delicious gesture."], ["علبة المولد الصغيرة", "لفتة بسيطة ولذيذة."], [["truffes-artisanales", 6], ["croissant-au-beurre", 3]]),
  b("wedding-guests", "wedding", ["Plateau invités", "Un grand plateau pour le café d'accueil."], ["Guest platter", "A large platter for the welcome coffee."], ["صينية الضيوف", "صينية كبيرة لقهوة الاستقبال."], [["mille-feuille", 8], ["eclair-au-chocolat", 8], ["truffes-artisanales", 24]]),
  b("wedding-favors", "wedding", ["Boîtes cadeaux invités", "Une boîte de truffes par invité."], ["Guest favor boxes", "One truffle box per guest."], ["علب هدايا الضيوف", "علبة ترافل لكل ضيف."], [["truffes-artisanales", 24]]),
  b("engagement-tea", "engagement", ["Thé de fiançailles", "Un assortiment raffiné pour la famille."], ["Engagement tea", "A refined assortment for the family."], ["شاي الخطوبة", "تشكيلة راقية للعائلة."], [["mille-feuille", 6], ["eclair-au-chocolat", 6], ["truffes-artisanales", 12]]),
  b("engagement-small", "engagement", ["Petit plateau", "Pour une célébration intime."], ["Small platter", "For an intimate celebration."], ["صينية صغيرة", "لاحتفال حميمي."], [["mille-feuille", 3], ["eclair-au-chocolat", 3]]),
  b("graduation-party", "graduation", ["Boîte diplômé", "Pour trinquer à la réussite."], ["Graduate box", "To toast the success."], ["علبة المتخرج", "لنحتفل بالنجاح."], [["eclair-au-chocolat", 6], ["truffes-artisanales", 12]]),
  b("graduation-friends", "graduation", ["Plateau entre amis", "À partager après la cérémonie."], ["Friends platter", "To share after the ceremony."], ["صينية الأصدقاء", "لتقاسمها بعد الحفل."], [["mille-feuille", 4], ["croissant-au-beurre", 6]]),
  b("corporate-breakfast", "corporate", ["Petit-déjeuner d'équipe", "Viennoiseries et pains pour 10 personnes."], ["Team breakfast", "Viennoiseries and breads for 10 people."], ["فطور الفريق", "فطائر وخبز لعشرة أشخاص."], [["croissant-au-beurre", 10], ["pain-au-chocolat", 10], ["pain-tradition", 3]]),
  b("corporate-gift", "corporate", ["Cadeau client", "Une boîte soignée à offrir."], ["Client gift", "A carefully made box to give."], ["هدية للعميل", "علبة أنيقة للإهداء."], [["truffes-artisanales", 12], ["mille-feuille", 2]]),
];

/** Bundles are priced slightly under the sum of their pieces. */
export const BUNDLE_DISCOUNT = 0.05;

export const boxSizes = [6, 12, 24] as const;
