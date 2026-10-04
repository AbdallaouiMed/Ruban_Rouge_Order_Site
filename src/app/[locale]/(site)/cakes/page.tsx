import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CakeStudio } from "@/components/shop/CakeStudio";
import { PageBand } from "@/components/ui/PageBand";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/cakes">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cakes" });
  return pageMetadata({ locale, path: "/cakes", title: t("title"), description: t("subtitle") });
}

export default async function CakesPage({ params }: PageProps<"/[locale]/cakes">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("cakes");
  return (
    <main id="main">
      <PageBand title={t("title")} subtitle={t("subtitle")} slot="cakes" />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-md bg-butter" aria-hidden="true" />}>
          <CakeStudio />
        </Suspense>
      </div>
    </main>
  );
}
