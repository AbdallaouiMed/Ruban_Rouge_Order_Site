import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ButtonLink } from "@/components/ui/Button";
import { PageBand } from "@/components/ui/PageBand";
import { RibbonDivider } from "@/components/ui/RibbonDivider";
import { bakery, storyDraft } from "@/data/bakery";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/story">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "story" });
  return pageMetadata({ locale, path: "/story", title: t("title"), description: t("subtitle") });
}

const valueKeys = ["craft", "tradition", "welcome"] as const;

export default async function StoryPage({ params }: PageProps<"/[locale]/story">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("story");
  const year = bakery.foundedYear;

  return (
    <main id="main">
      <PageBand title={t("title")} subtitle={t("subtitle")} eyebrow={String(year)} slot="story" />

      <section className="grade-peach grain">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6">
          <p className="text-(length:--text-lg)">{t("intro", { year })}</p>
          {!storyDraft.confirmed && process.env.NODE_ENV !== "production" && (
            <p role="note" className="mx-auto mt-6 inline-block rounded-pill bg-saffron px-4 py-2 text-(length:--text-sm) font-semibold text-cocoa">
              {t("draftNote")}
            </p>
          )}
        </div>
      </section>

      <section aria-labelledby="timeline" className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h2 id="timeline" className="font-display text-(length:--text-3xl)">{t("timelineTitle")}</h2>
        {/* One ribbon runs down the page; each milestone hangs off it */}
        <ol className="relative mt-10 space-y-10 border-s-4 border-ribbon ps-8">
          {storyDraft.timeline.map((m) => (
            <li key={m.key} className="relative">
              <span aria-hidden="true" className="absolute -start-[2.65rem] top-1 size-5 rounded-full border-4 border-flour bg-ribbon" />
              <p className="font-display text-(length:--text-2xl) font-semibold text-ribbon">{m.year}</p>
              <h3 className="font-display text-(length:--text-xl)">{t(`timeline.${m.key}.t`)}</h3>
              <p className="mt-1 text-cocoa-soft">{t(`timeline.${m.key}.d`)}</p>
            </li>
          ))}
        </ol>
      </section>

      <RibbonDivider className="mx-auto max-w-6xl" />

      <section aria-labelledby="values" className="grade-honey grain mt-14 py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 id="values" className="font-display text-(length:--text-3xl)">{t("valuesTitle")}</h2>
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {valueKeys.map((k) => (
              <li key={k} className="rounded-md bg-flour/95 p-6 shadow-soft ring-1 ring-cocoa/5">
                <h3 className="font-display text-(length:--text-xl) text-garnet">{t(`values.${k}.t`)}</h3>
                <p className="mt-1">{t(`values.${k}.d`)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <ButtonLink href="/menu">{t("cta")}</ButtonLink>
          </div>
        </div>
      </section>
    </main>
  );
}
