import type { Metadata } from "next";
import { bakery } from "@/data/bakery";
import { routing, type Locale } from "@/i18n/routing";

const ogLocale: Record<Locale, string> = { fr: "fr_MA", ar: "ar_MA", en: "en_GB" };

/** Canonical + hreflang alternates + OG for a localized path ("" for home). */
export function pageMetadata({ locale, path, title, description }: { locale: string; path: string; title: string; description?: string }): Metadata {
  const base = bakery.siteUrl;
  const url = `${base}/${locale}${path}`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(routing.locales.map((l) => [l, `${base}/${l}${path}`])),
        "x-default": `${base}/${routing.defaultLocale}${path}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: bakery.name,
      type: "website",
      locale: ogLocale[locale as Locale] ?? "fr_MA",
    },
  };
}
