import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { LanguageSwitch } from "@/components/ui/LanguageSwitch";
import { RibbonDivider } from "@/components/ui/RibbonDivider";

const swatches = [
  { name: "Ribbon Red", token: "ribbon", hex: "#B3202A", fg: "text-white", note: "Primary. White text 6.65:1" },
  { name: "Garnet", token: "garnet", hex: "#7E1420", fg: "text-white", note: "Hover/dark. White text 10.46:1" },
  { name: "Flour Cream", token: "flour", hex: "#FBF4E8", fg: "text-cocoa", note: "Page background. Cocoa text 15.24:1" },
  { name: "Butter", token: "butter", hex: "#F3E3C1", fg: "text-cocoa", note: "Surfaces. Cocoa text 13.14:1" },
  { name: "Cocoa", token: "cocoa", hex: "#2B1A14", fg: "text-flour", note: "Text, footer. Flour text 15.24:1" },
  { name: "Saffron", token: "saffron", hex: "#D9962B", fg: "text-cocoa", note: "Accent on cocoa 6.62:1. Decorative only on light" },
  { name: "Saffron Deep", token: "saffron-deep", hex: "#8A5A07", fg: "text-white", note: "Accent text on light 5.42:1" },
  { name: "Zellige Teal", token: "zellige", hex: "#1F5E5B", fg: "text-white", note: "Rare accent. White text 7.47:1" },
];

const scale = [
  ["text-4xl", "Hero", "Le goût du ruban rouge"],
  ["text-3xl", "H1", "Nos créations du jour"],
  ["text-2xl", "H2", "Composez votre boîte"],
  ["text-xl", "H3", "Mille-feuille vanille"],
  ["text-lg", "Lead", "Fait main, chaque matin, à Meknès."],
  ["text-base", "Body", "Des viennoiseries, des gâteaux et des boîtes à offrir."],
  ["text-sm", "Small", "Retrait en boutique ou livraison à Meknès."],
] as const;

// Internal review page: keep it out of search results (and remove before launch).
export const metadata = { robots: { index: false, follow: false } };

export default async function DesignSystemPage({ params }: PageProps<"/[locale]/design-system">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("design");

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-display text-(length:--text-sm) font-semibold tracking-widest text-saffron-deep uppercase">Ruban Rouge</p>
          <h1 className="font-display text-(length:--text-3xl) leading-tight text-ribbon">{t("title")}</h1>
          <p className="mt-2 max-w-prose text-cocoa-soft">{t("intro")}</p>
        </div>
        <LanguageSwitch />
      </header>

      <RibbonDivider className="my-10" animate />

      <section aria-labelledby="ds-color" className="space-y-4">
        <h2 id="ds-color" className="font-display text-(length:--text-2xl)">Palette</h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {swatches.map((s) => (
            <li key={s.token} className={`rounded-md p-5 shadow-soft ${s.fg}`} style={{ background: s.hex }}>
              <p className="font-display text-(length:--text-lg) font-semibold">{s.name}</p>
              <p className="text-(length:--text-sm) opacity-95">{s.hex}</p>
              <p className="mt-6 text-(length:--text-xs)">{s.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <RibbonDivider className="my-10" />

      <section aria-labelledby="ds-type" className="space-y-6">
        <h2 id="ds-type" className="font-display text-(length:--text-2xl)">Typography</h2>
        <p className="text-cocoa-soft">Fraunces (display) + Hanken Grotesk (body). Arabic: El Messiri (headings) + Readex Pro (body), set larger with taller leading.</p>
        <div className="space-y-3 rounded-md bg-butter p-6">
          {scale.map(([cls, label, sample]) => (
            <div key={cls} className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-cocoa/10 pb-3 last:border-0">
              <span className="w-16 shrink-0 text-(length:--text-xs) text-cocoa-soft">{label}</span>
              <span className={`${cls === "text-base" || cls === "text-sm" ? "font-sans" : "font-display"}`} style={{ fontSize: `var(--${cls})` }}>
                {sample}
              </span>
            </div>
          ))}
        </div>
        <div dir="rtl" lang="ar" className="rounded-md bg-butter p-6 [--font-display:var(--font-el-messiri)] [--font-sans:var(--font-readex)]">
          <p className="font-display text-(length:--text-3xl) text-ribbon">طعم الشريط الأحمر</p>
          <p className="mt-2 text-cocoa">مخبوزات وحلويات صُنعت بحب كل صباح في مكناس. اطلب علبتك أو صمّم كعكتك.</p>
        </div>
      </section>

      <RibbonDivider className="my-10" />

      <section aria-labelledby="ds-comp" className="space-y-6">
        <h2 id="ds-comp" className="font-display text-(length:--text-2xl)">Components</h2>

        <div className="flex flex-wrap gap-3">
          <Button>Commander</Button>
          <Button variant="secondary">Composer une boîte</Button>
          <Button variant="ghost">Voir le menu</Button>
          <Button disabled>Indisponible</Button>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtres">
          {["Tout", "Viennoiseries", "Pâtisseries", "Boulangerie"].map((c, i) => (
            <button
              key={c}
              aria-pressed={i === 0}
              className={`min-h-11 rounded-pill px-4 text-(length:--text-sm) font-semibold transition-colors ${i === 0 ? "bg-cocoa text-flour" : "bg-butter text-cocoa hover:bg-[#ecd3a3]"}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Croissant au beurre", "Viennoiseries", true],
            ["Mille-feuille", "Pâtisseries", true],
            ["Éclair au chocolat", "Pâtisseries", false],
          ].map(([name, cat, fresh]) => (
            <article key={String(name)} className="group overflow-hidden rounded-md bg-white shadow-soft transition-shadow hover:shadow-lift">
              <div className="pattern-zellige relative flex aspect-[4/3] items-center justify-center bg-butter">
                <span className="text-(length:--text-sm) text-cocoa-soft">Photo à fournir</span>
                {fresh ? (
                  <span className="absolute start-3 top-3 rounded-pill bg-saffron px-3 py-1 text-(length:--text-xs) font-bold text-cocoa">Frais aujourd&apos;hui</span>
                ) : (
                  <span className="absolute start-3 top-3 rounded-pill bg-cocoa px-3 py-1 text-(length:--text-xs) font-bold text-flour">Épuisé</span>
                )}
              </div>
              <div className="space-y-1 p-5">
                <p className="text-(length:--text-xs) font-semibold tracking-wide text-saffron-deep uppercase">{cat}</p>
                <h3 className="font-display text-(length:--text-xl)">{name}</h3>
                <div className="flex items-center justify-between pt-3">
                  <span className="relative rounded-sm bg-ribbon px-3 py-1 font-semibold text-white">-- DH</span>
                  <Button className="min-h-11 px-4" disabled={!fresh}>Ajouter</Button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="rounded-md bg-cocoa p-8 text-flour">
          <RibbonDivider className="mb-6" />
          <p className="font-display text-(length:--text-xl)">Footer sombre</p>
          <p className="text-(length:--text-sm)">Accent saffron sur cocoa : <span className="text-saffron">06h30 – 22h30 · tous les jours</span></p>
        </div>
      </section>

      <RibbonDivider className="my-10" />

      <section aria-labelledby="ds-motif" className="space-y-3 pb-12">
        <h2 id="ds-motif" className="font-display text-(length:--text-2xl)">Ribbon motif & motion</h2>
        <ul className="list-disc space-y-1 ps-6 text-cocoa-soft">
          <li>Wavy ribbon dividers between sections (above), drawn left to right, right to left in Arabic.</li>
          <li>Ribbon underline on the active nav item, red price tags, ribbon around gift cards.</li>
          <li>Box Builder: the ribbon ties across the box when the last slot is filled.</li>
          <li>Loader: a ribbon pulling through.</li>
          <li>Motion is short (150–300 ms) and springy; everything is disabled under reduced motion.</li>
        </ul>
      </section>
    </main>
  );
}
