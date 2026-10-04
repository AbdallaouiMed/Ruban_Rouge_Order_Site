import { getTranslations } from "next-intl/server";
import { MapPin, Phone } from "lucide-react";
import { bakery } from "@/data/bakery";
import { displayPhone } from "@/lib/format";
import { OpenStatus } from "./OpenStatus";
import { LiveHours } from "./LiveHours";
import { buttonClasses } from "@/components/ui/Button";

const mapsDirections = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${bakery.name} ${bakery.address.street} ${bakery.address.city}`)}`;

/** Address, live open status, hours and quick actions. Used on Home and Contact. */
export async function HoursCard({ title }: { title?: string }) {
  const tc = await getTranslations("common");
  const tf = await getTranslations("footer");

  return (
    <div className="space-y-5 rounded-md bg-white p-6 shadow-soft sm:p-8">
      {title && <h2 className="font-display text-(length:--text-2xl)">{title}</h2>}
      <OpenStatus />
      <div className="flex gap-3">
        <MapPin aria-hidden="true" className="mt-1 size-5 shrink-0 text-ribbon" />
        <address className="not-italic">
          <bdi>{bakery.address.street}</bdi>
          <br />
          <bdi>
            {bakery.address.city}, {bakery.address.country}
          </bdi>
        </address>
      </div>
      <div className="flex gap-3">
        <Phone aria-hidden="true" className="mt-1 size-5 shrink-0 text-ribbon" />
        <p>
          <a className="font-semibold text-ribbon underline-offset-4 hover:underline" href={`tel:${bakery.phones.boutique}`} dir="ltr">
            {displayPhone(bakery.phones.boutique)}
          </a>
          <span className="text-cocoa-soft"> · {tf("boutique")}</span>
          <br />
          <a className="font-semibold text-ribbon underline-offset-4 hover:underline" href={`tel:${bakery.phones.orders}`} dir="ltr">
            {displayPhone(bakery.phones.orders)}
          </a>
          <span className="text-cocoa-soft"> · {tf("orders")}</span>
        </p>
      </div>
      <div>
        <h3 className="font-display text-(length:--text-lg)">{tf("hours")}</h3>
        <LiveHours />
      </div>
      <a href={mapsDirections} target="_blank" rel="noopener noreferrer" className={buttonClasses("secondary")}>
        {tc("directions")}
      </a>
    </div>
  );
}
