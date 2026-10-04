import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { PageBand } from "@/components/ui/PageBand";

export async function generateMetadata({ params }: PageProps<"/[locale]/checkout">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  // Checkout is a transactional page: keep it out of search results.
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function CheckoutPage({ params }: PageProps<"/[locale]/checkout">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("checkout");
  return (
    <main id="main">
      <PageBand title={t("title")} subtitle={t("subtitle")} />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <CheckoutForm />
      </div>
    </main>
  );
}
