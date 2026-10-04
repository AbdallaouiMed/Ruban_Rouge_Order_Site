import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ContactFab } from "@/components/layout/ContactFab";
import { DemoBanner } from "@/components/demo/DemoBanner";
import { StructuredData } from "@/components/layout/StructuredData";
import { CartDrawerLoader } from "@/components/shop/CartDrawerLoader";

/** Public site chrome: skip link, demo notice, header, footer, cart drawer and call button. */
export default async function SiteLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tc = await getTranslations({ locale, namespace: "common" });

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-pill focus:bg-ribbon focus:px-5 focus:py-3 focus:font-semibold focus:text-white"
      >
        {tc("skipToContent")}
      </a>
      <StructuredData />
      <DemoBanner />
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
      <CartDrawerLoader />
      <ContactFab />
    </>
  );
}
