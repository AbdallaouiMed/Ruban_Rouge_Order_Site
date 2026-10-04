import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/Button";
import { PastryArt } from "@/components/ui/PastryArt";

/** Shown when a product, occasion or order link does not exist. Keeps the site header and footer. */
export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <main id="main" className="mx-auto grid max-w-2xl place-items-center gap-4 px-4 py-24 text-center">
      <PastryArt kind="croissant-au-beurre" className="h-32" />
      <h1 className="font-display text-(length:--text-3xl) text-ribbon">{t("title")}</h1>
      <p className="text-cocoa-soft">{t("text")}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">{t("home")}</ButtonLink>
        <ButtonLink href="/menu" variant="secondary">{t("menu")}</ButtonLink>
      </div>
    </main>
  );
}
