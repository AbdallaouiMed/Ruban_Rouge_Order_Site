import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BoxBuilder } from "@/components/shop/BoxBuilder";
import { PageBand } from "@/components/ui/PageBand";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/box">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "box" });
  return pageMetadata({ locale, path: "/box", title: t("title"), description: t("subtitle") });
}

export default async function BoxPage({ params }: PageProps<"/[locale]/box">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("box");
  return (
    <main id="main">
      <PageBand title={t("title")} subtitle={t("subtitle")} slot="box" />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <BoxBuilder />
      </div>
    </main>
  );
}
