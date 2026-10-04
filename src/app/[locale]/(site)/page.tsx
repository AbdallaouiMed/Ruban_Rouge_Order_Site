import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Phone } from "lucide-react";
import { SiteImage } from "@/components/demo/SiteImage";
import { ButtonLink, buttonClasses } from "@/components/ui/Button";
import { PastryArt } from "@/components/ui/PastryArt";
import { RibbonDivider } from "@/components/ui/RibbonDivider";
import { FreshBoard } from "@/components/shop/FreshBoard";
import { HoursCard } from "@/components/shop/HoursCard";
import { ProductCard } from "@/components/shop/ProductCard";
import { bakery, reviews } from "@/data/bakery";
import { signatureSlugs } from "@/data/demo";
import { getProducts } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  // Home keeps the full brand title (no "| Ruban Rouge" suffix) and gets canonical + hreflang.
  return { ...pageMetadata({ locale, path: "", title: t("title"), description: t("description") }), title: { absolute: t("title") } };
}

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tc = await getTranslations("common");
  const all = await getProducts();
  const featured = signatureSlugs.map((slug) => all.find((p) => p.slug === slug)).filter((p): p is NonNullable<typeof p> => !!p);
  const products = featured.length >= 4 ? featured : all.slice(0, 4);
  const year = bakery.foundedYear;

  const steps = [
    { n: 1, title: t("how.s1t"), text: t("how.s1d") },
    { n: 2, title: t("how.s2t"), text: t("how.s2d") },
    { n: 3, title: t("how.s3t"), text: t("how.s3d") },
  ];

  return (
    <main id="main">
      {/* Hero */}
      <section className="grade-hero grain">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:py-20">
          <div className="space-y-6">
            <p className="font-display text-(length:--text-sm) font-semibold tracking-widest text-saffron-deep uppercase">{t("hero.eyebrow", { year })}</p>
            <h1 className="font-display text-(length:--text-4xl) leading-[1.05] text-ribbon">{t("hero.title")}</h1>
            <p className="max-w-prose text-(length:--text-lg) text-cocoa-soft">{t("hero.subtitle")}</p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/menu">{t("hero.cta")}</ButtonLink>
              <ButtonLink href="/box" variant="secondary">{t("hero.cta2")}</ButtonLink>
              <a href={`tel:${bakery.phones.orders}`} className={buttonClasses("ghost")}>
                <Phone aria-hidden="true" className="size-5" />
                {tc("call")}
              </a>
            </div>
          </div>
          {/* Hero photo: the owners replace it from the admin (Images) */}
          <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] bg-butter shadow-lift ring-8 ring-white/70 md:max-w-none">
            <SiteImage
              slot="hero"
              alt={t("hero.title")}
              sizes="(min-width:768px) 45vw, 90vw"
              priority
              fallback={
                <div className="grid size-full place-items-center p-6 text-center text-cocoa-soft">
                  <PastryArt kind="cake" className="h-3/5" />
                  <span className="sr-only">{t("hero.photo")}</span>
                </div>
              }
            />
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-cocoa/45 to-transparent" />
            <div aria-hidden="true" className="absolute inset-x-0 bottom-6">
              <RibbonDivider className="h-8" animate />
            </div>
          </div>
        </div>
      </section>

      <FreshBoard />

      {/* Signature products */}
      <section aria-labelledby="signature" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="signature" className="font-display text-(length:--text-3xl)">{t("signature.title")}</h2>
            <p className="mt-2 text-cocoa-soft">{t("signature.subtitle")}</p>
          </div>
          <ButtonLink href="/menu" variant="ghost">{tc("viewAll")}</ButtonLink>
        </div>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <li key={p.slug}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      </section>

      {/* How ordering works */}
      <section aria-labelledby="how" className="grade-blush grain py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 id="how" className="font-display text-(length:--text-3xl)">{t("how.title")}</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <li key={s.n} className="rounded-md bg-flour/95 p-6 shadow-soft ring-1 ring-cocoa/5">
                <span aria-hidden="true" className="inline-flex size-11 items-center justify-center rounded-full bg-ribbon font-display text-(length:--text-xl) font-semibold text-white shadow-soft">{s.n}</span>
                <h3 className="mt-4 font-display text-(length:--text-xl)">{s.title}</h3>
                <p className="mt-1 text-cocoa-soft">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Occasions, cake studio and gifts */}
      <section aria-labelledby="occasions" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grade-ruby grain relative isolate overflow-hidden rounded-md p-8 text-white shadow-lift sm:p-12">
          <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-25 mix-blend-luminosity">
            <SiteImage slot="occasions" sizes="(min-width:1152px) 1100px, 100vw" />
          </div>
          <h2 id="occasions" className="font-display text-(length:--text-3xl)">{t("occasions.title")}</h2>
          <p className="mt-3 max-w-prose text-(length:--text-lg)">{t("occasions.text")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/cakes" variant="secondary">{t("occasions.cta")}</ButtonLink>
            <ButtonLink href="/occasions" variant="secondary">{t("occasions.collections")}</ButtonLink>
            <ButtonLink href="/gift" variant="secondary">{t("occasions.gift")}</ButtonLink>
          </div>
        </div>
      </section>

      {/* Story teaser + visit */}
      <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-8 sm:px-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="pattern-zellige relative aspect-[16/9] overflow-hidden rounded-md bg-butter shadow-soft ring-1 ring-cocoa/5">
            <SiteImage slot="story" alt={t("story.title")} sizes="(min-width:768px) 560px, 100vw" fallback={<div className="grid size-full place-items-center"><PastryArt kind="pain-tradition" className="h-4/5" /></div>} />
          </div>
          <h2 className="font-display text-(length:--text-3xl)">{t("story.title")}</h2>
          <p className="max-w-prose text-cocoa-soft">{t("story.text", { year })}</p>
          <ButtonLink href="/story" variant="secondary">{t("story.cta")}</ButtonLink>
        </div>
        <HoursCard title={t("visit.title")} />
      </section>

      {/* Reviews: only rendered once the owners provide real, approved reviews */}
      {reviews.length > 0 && (
        <section aria-labelledby="reviews" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 id="reviews" className="font-display text-(length:--text-3xl)">{t("reviews.title")}</h2>
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {reviews.map((r) => (
              <li key={r.author} className="rounded-md bg-white p-6 shadow-soft">
                <p aria-label={`${r.rating} / 5`} className="text-saffron-deep">{"★".repeat(r.rating)}</p>
                <blockquote className="mt-2">{r.text}</blockquote>
                <p className="mt-3 font-semibold">{r.author}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
