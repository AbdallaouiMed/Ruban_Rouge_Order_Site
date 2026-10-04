import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Photo } from "@/components/ui/Photo";
import { PageBand } from "@/components/ui/PageBand";
import { demoOccasionImages, occasions } from "@/data/demo";
import { isDemo } from "@/lib/demo/config";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/occasions">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "occasions" });
  return pageMetadata({ locale, path: "/occasions", title: t("title"), description: t("subtitle") });
}

export default async function OccasionsPage({ params }: PageProps<"/[locale]/occasions">) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("occasions");

  return (
    <main id="main">
      <PageBand title={t("title")} subtitle={t("subtitle")} slot="occasions" />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {occasions.map((o) => {
            const image = isDemo ? demoOccasionImages[o.id] : undefined;
            return (
              <li key={o.id}>
                <Link
                  href={`/occasions/${o.id}`}
                  className={`group relative isolate flex h-full min-h-60 flex-col justify-end overflow-hidden rounded-md p-6 text-white shadow-soft transition-[box-shadow,transform] duration-300 ease-(--ease-out) hover:-translate-y-0.5 hover:shadow-lift ${o.accent}`}
                >
                  {image && <Photo src={image} sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="-z-20 transition-transform duration-700 ease-(--ease-out) group-hover:scale-105" />}
                  {/* The occasion's colour tints the photo; a cocoa gradient keeps the title legible */}
                  {image && <div aria-hidden="true" className={`absolute inset-0 -z-10 opacity-40 mix-blend-multiply ${o.accent}`} />}
                  <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-cocoa/90 via-cocoa/45 to-cocoa/5" />
                  <h2 className="font-display text-(length:--text-2xl)">{o.name[locale]}</h2>
                  <p className="mt-1 text-white/95">{o.blurb[locale]}</p>
                  <span className="mt-4 inline-flex items-center gap-2 font-semibold">
                    {t("discover")}
                    <ArrowRight aria-hidden="true" className="size-5 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
