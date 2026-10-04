import { getTranslations } from "next-intl/server";
import { Phone } from "lucide-react";
import { bakery, TODO_OWNER } from "@/data/bakery";

/** Floating contact button: WhatsApp once the number is confirmed, otherwise a phone call. */
export async function ContactFab() {
  const t = await getTranslations("common");
  const wa = bakery.whatsappNumber !== TODO_OWNER ? bakery.whatsappNumber : null;
  const href = wa ? `https://wa.me/${wa}` : `tel:${bakery.phones.orders}`;
  const label = wa ? t("whatsapp") : t("call");
  return (
    <aside aria-label={t("quickContact")}>
      <a
        href={href}
        {...(wa ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="fixed bottom-4 end-4 z-30 inline-flex min-h-14 items-center gap-2 rounded-pill bg-ribbon px-5 font-semibold text-white shadow-lift transition-transform duration-200 ease-(--ease-spring) hover:scale-105 hover:bg-garnet active:scale-95"
      >
        <Phone aria-hidden="true" className="size-5" />
        <span>{label}</span>
      </a>
    </aside>
  );
}
