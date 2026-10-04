import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/ui/Logo";
import { RibbonDivider } from "@/components/ui/RibbonDivider";
import { LiveHours } from "@/components/shop/LiveHours";
import { bakery } from "@/data/bakery";
import { displayPhone } from "@/lib/format";

const footerLinks = ["menu", "box", "cakes", "occasions", "gift", "story", "contact"] as const;

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");

  return (
    <footer className="grade-cocoa grain mt-24 text-flour">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6">
        <RibbonDivider className="mb-10" />
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <div className="inline-block rounded-sm bg-flour px-3 py-2">
              <Logo />
            </div>
            <p className="text-(length:--text-sm)">{t("tagline")}</p>
          </div>

          <nav aria-label={t("explore")}>
            <h2 className="font-display text-(length:--text-lg) text-saffron">{t("explore")}</h2>
            <ul className="mt-3 columns-2 gap-6 sm:columns-1 lg:columns-2">
              {footerLinks.map((k) => (
                <li key={k}>
                  <Link href={`/${k}`} prefetch={false} className="inline-block min-h-11 content-center underline-offset-4 hover:underline">
                    {tn(k)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-display text-(length:--text-lg) text-saffron">{t("visit")}</h2>
            <address className="mt-3 space-y-2 text-(length:--text-sm) not-italic">
              <p>
                <bdi>{bakery.address.street}</bdi>
                <br />
                <bdi>
                  {bakery.address.city}, {bakery.address.country}
                </bdi>
              </p>
              <p>
                <a className="underline-offset-4 hover:underline" href={`tel:${bakery.phones.boutique}`} dir="ltr">
                  {displayPhone(bakery.phones.boutique)}
                </a>
                <span className="opacity-80"> · {t("boutique")}</span>
                <br />
                <a className="underline-offset-4 hover:underline" href={`tel:${bakery.phones.orders}`} dir="ltr">
                  {displayPhone(bakery.phones.orders)}
                </a>
                <span className="opacity-80"> · {t("orders")}</span>
              </p>
            </address>
          </div>

          <div>
            <h2 className="font-display text-(length:--text-lg) text-saffron">{t("hours")}</h2>
            <div className="mt-3 text-(length:--text-sm)">
              <LiveHours variant="compact" />
            </div>
            <h2 className="mt-6 font-display text-(length:--text-lg) text-saffron">{t("follow")}</h2>
            <p className="mt-2 flex flex-wrap gap-x-4 text-(length:--text-sm)">
              <a className="min-h-11 content-center underline-offset-4 hover:underline" href={bakery.social.instagram} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
              <a className="min-h-11 content-center underline-offset-4 hover:underline" href={bakery.social.facebook} target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
            </p>
          </div>
        </div>
        <p className="mt-10 border-t border-flour/20 pt-6 text-(length:--text-xs) opacity-80">{t("rights", { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
