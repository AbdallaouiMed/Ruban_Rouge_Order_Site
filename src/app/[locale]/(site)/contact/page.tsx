import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactForm } from "@/components/forms/ContactForm";
import { HoursCard } from "@/components/shop/HoursCard";
import { PageBand } from "@/components/ui/PageBand";
import { bakery } from "@/data/bakery";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return pageMetadata({ locale, path: "/contact", title: t("title"), description: t("subtitle") });
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  return (
    <main id="main">
      <PageBand title={t("title")} subtitle={t("subtitle")} />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2">
        <section aria-labelledby="form-title" className="space-y-5">
          <h2 id="form-title" className="font-display text-(length:--text-2xl)">{t("formTitle")}</h2>
          <ContactForm />
        </section>

        <section aria-labelledby="visit-title" className="space-y-5">
          <h2 id="visit-title" className="font-display text-(length:--text-2xl)">{t("visitTitle")}</h2>
          <HoursCard />
          <iframe title={t("mapTitle")} src={bakery.mapEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="aspect-[4/3] w-full rounded-md border-0 shadow-soft" />
          <p className="flex flex-wrap items-center gap-x-4 text-(length:--text-sm)">
            <span className="font-semibold">{t("social")}</span>
            <a className="min-h-11 content-center font-semibold text-ribbon underline-offset-4 hover:underline" href={bakery.social.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
            <a className="min-h-11 content-center font-semibold text-ribbon underline-offset-4 hover:underline" href={bakery.social.facebook} target="_blank" rel="noopener noreferrer">Facebook</a>
          </p>
        </section>
      </div>
    </main>
  );
}
