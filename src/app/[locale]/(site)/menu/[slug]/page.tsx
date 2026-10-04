import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductBuyPanel, ProductImage } from "@/components/shop/ProductBuyPanel";
import { routing, type Locale } from "@/i18n/routing";
import { categoryLabel, getProduct, getProducts } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  const products = await getProducts();
  return routing.locales.flatMap((locale) => products.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/menu/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  const name = product.name[locale as Locale];
  return pageMetadata({ locale, path: `/menu/${slug}`, title: `${name} | ${categoryLabel(product.category, locale as Locale)}` });
}

export default async function ProductPage({ params }: PageProps<"/[locale]/menu/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const product = await getProduct(slug);
  if (!product) notFound();

  const t = await getTranslations("product");
  const tm = await getTranslations("menu");
  const name = product.name[locale];
  const related = (await getProducts()).filter((p) => p.category === product.category && p.slug !== product.slug).slice(0, 4);

  return (
    <main id="main" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/menu" className="inline-flex min-h-11 items-center gap-2 font-semibold text-ribbon underline-offset-4 hover:underline">
        <ArrowLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
        {tm("title")}
      </Link>

      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <ProductImage product={product} />

        <div className="space-y-5">
          <p className="text-(length:--text-sm) font-semibold tracking-wide text-saffron-deep uppercase">{categoryLabel(product.category, locale)}</p>
          <h1 className="font-display text-(length:--text-3xl) leading-tight">{name}</h1>

          <ProductBuyPanel product={product} />

          <section aria-labelledby="details" className="space-y-1">
            <h2 id="details" className="font-display text-(length:--text-lg)">{t("details")}</h2>
            <p className="text-cocoa-soft">{t("descPending")}</p>
          </section>
          <section aria-labelledby="allergens" className="space-y-1">
            <h2 id="allergens" className="font-display text-(length:--text-lg)">{t("allergens")}</h2>
            <p className="text-cocoa-soft">{t("allergensPending")}</p>
          </section>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related" className="mt-16">
          <h2 id="related" className="font-display text-(length:--text-2xl)">{t("related")}</h2>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <li key={p.slug}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
