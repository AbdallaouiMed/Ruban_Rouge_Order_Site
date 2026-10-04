import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { OrderView } from "@/components/shop/OrderView";

export async function generateMetadata({ params }: PageProps<"/[locale]/order/[id]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return { title: t("confirmationTitle"), robots: { index: false, follow: false } };
}

export default async function OrderPage({ params }: PageProps<"/[locale]/order/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return (
    <main id="main" className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <OrderView id={id} />
    </main>
  );
}
