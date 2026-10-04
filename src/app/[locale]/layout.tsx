import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, El_Messiri, Readex_Pro } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { bakery } from "@/data/bakery";
import { isRtl, routing } from "@/i18n/routing";
import { DemoProvider } from "@/components/demo/DemoProvider";
import "../globals.css";

// Latin faces are preloaded (French and English are the bulk of the traffic). The weight axis alone is
// enough for Fraunces: the optional SOFT and opsz axes tripled the file for no visible gain.
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", display: "swap" });
// Arabic faces carry only Arabic glyphs and are not preloaded: they download only on pages that
// actually use them. Latin characters on Arabic pages (digits, the brand name) use the Latin faces above.
const elMessiri = El_Messiri({ subsets: ["arabic"], variable: "--font-el-messiri", display: "swap", preload: false });
const readex = Readex_Pro({ subsets: ["arabic"], variable: "--font-readex", display: "swap", preload: false });

/** Namespaces read by client components. Add one here when a client component starts using it. */
const clientNamespaces = ["nav", "common", "cart", "checkout", "order", "box", "cakes", "gift", "occasions", "menu", "product", "fresh", "contact"];

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(bakery.siteUrl),
    title: { default: t("title"), template: `%s | ${bakery.name}` },
    description: t("description"),
  };
}

/** Root layout: fonts, direction and providers. The public chrome lives in (site)/layout, the admin shell in (admin). */
export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  // Only the namespaces used by client components travel to the browser; server components read the rest directly.
  const all = await getMessages();
  const messages = Object.fromEntries(clientNamespaces.map((ns) => [ns, all[ns]]));

  return (
    <html
      lang={locale}
      dir={isRtl(locale) ? "rtl" : "ltr"}
      className={`${fraunces.variable} ${hanken.variable} ${elMessiri.variable} ${readex.variable}`}
    >
      <body className="min-h-dvh flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <DemoProvider>{children}</DemoProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
