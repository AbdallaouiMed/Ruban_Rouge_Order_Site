import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { BundleCard } from "@/components/shop/BundleCard";
import { buttonClasses } from "@/components/ui/Button";
import { PageBand } from "@/components/ui/PageBand";
import { bundles, demoOccasionImages, occasions } from "@/data/demo";
import { routing, type Locale } from "@/i18n/routing";
import { isDemo } from "@/lib/demo/config";
import { cakeOccasionFor } from "@/lib/box";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => occasions.map((o) => ({ locale, slug: o.id })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/occasions/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const occasion = occasions.find((o) => o.id === slug);
  if (!occasion) return {};
  return pageMetadata({ locale, path: `/occasions/${slug}`, title: occasion.name[locale as Locale], description: occasion.blurb[locale as Locale] });
}

export default async function OccasionPage({ params }: PageProps<"/[locale]/occasions/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const occasion = occasions.find((o) => o.id === slug);
  if (!occasion) notFound();
  const t = await getTranslations("occasions");
  const list = bundles.filter((b) => b.occasion === occasion.id);
  const image = isDemo ? demoOccasionImages[occasion.id] : undefined;

  return (
    <main id="main">
      <PageBand title={occasion.name[locale]} subtitle={occasion.blurb[locale]} image={image} accent={occasion.accent}>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/occasions" className="inline-flex min-h-11 items-center gap-2 rounded-pill bg-white/15 px-4 font-semibold text-white ring-1 ring-white/40 hover:bg-white/25">
            <ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
            {t("title")}
          </Link>
          <p className="inline-block rounded-pill bg-white/20 px-4 py-2 text-(length:--text-sm) font-semibold">{t("preorder")}</p>
        </div>
      </PageBand>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <section aria-labelledby="bundles">
          <h2 id="bundles" className="font-display text-(length:--text-2xl)">{t("bundles")}</h2>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((b) => (
              <li key={b.id}>
                <BundleCard bundle={b} />
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 grid gap-5 md:grid-cols-2" aria-label={t("more")}>
          <div className="grade-honey grain rounded-md p-6 shadow-soft">
            <h2 className="font-display text-(length:--text-xl)">{t("cakeTitle")}</h2>
            <p className="mt-1">{t("cakeText")}</p>
            <Link href={`/cakes?occasion=${cakeOccasionFor[occasion.id] ?? "other"}`} className={buttonClasses("primary", "mt-4")}>{t("cakeCta")}</Link>
          </div>
          <div className="grade-blush grain rounded-md p-6 shadow-soft">
            <h2 className="font-display text-(length:--text-xl)">{t("giftTitle")}</h2>
            <p className="mt-1">{t("giftText")}</p>
            <Link href="/gift" className={buttonClasses("outline", "mt-4")}>{t("giftCta")}</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
