import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MenuBrowser } from "@/components/shop/MenuBrowser";
import { ProductCard } from "@/components/shop/ProductCard";
import { PageBand } from "@/components/ui/PageBand";
import { getProducts } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/menu">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "menu" });
  return pageMetadata({ locale, path: "/menu", title: t("title"), description: t("subtitle") });
}

export default async function MenuPage({ params }: PageProps<"/[locale]/menu">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("menu");
  const products = await getProducts();

  return (
    <main id="main">
      <PageBand title={t("title")} subtitle={t("subtitle")} />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* The browser reads the URL on the client, so its first render bails out of static HTML.
            The fallback is the full server-rendered grid: crawlers and no-JS visitors still get every product. */}
        <Suspense
          fallback={
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((p) => (
                <li key={p.slug}>
                  <ProductCard product={p} headingAs="h2" />
                </li>
              ))}
            </ul>
          }
        >
          <MenuBrowser products={products} />
        </Suspense>
      </div>
    </main>
  );
}
