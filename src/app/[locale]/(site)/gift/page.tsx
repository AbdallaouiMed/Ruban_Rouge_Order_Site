import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GiftForm } from "@/components/shop/GiftForm";
import { PageBand } from "@/components/ui/PageBand";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/gift">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "gift" });
  return pageMetadata({ locale, path: "/gift", title: t("title"), description: t("subtitle") });
}

export default async function GiftPage({ params }: PageProps<"/[locale]/gift">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("gift");
  return (
    <main id="main">
      <PageBand title={t("title")} subtitle={t("subtitle")} slot="gift" />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <GiftForm />
      </div>
    </main>
  );
}
