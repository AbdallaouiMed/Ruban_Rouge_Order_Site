import { bakery, categories, type DayKey } from "@/data/bakery";

const schemaDay: Record<DayKey, string> = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };

/**
 * schema.org Bakery for local search. Only facts the owners have provided are included: no rating,
 * no review count and no coordinates until they are confirmed (the old site's values looked invented).
 */
export function StructuredData() {
  const hours = (Object.keys(bakery.hours) as DayKey[]).flatMap((d) => {
    const w = bakery.hours[d];
    return w ? [{ "@type": "OpeningHoursSpecification", dayOfWeek: schemaDay[d], opens: w.open, closes: w.close }] : [];
  });

  const data = {
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: bakery.name,
    alternateName: bakery.nameAr,
    url: bakery.siteUrl,
    telephone: bakery.phones.boutique,
    foundingDate: String(bakery.foundedYear),
    address: {
      "@type": "PostalAddress",
      streetAddress: bakery.address.street,
      addressLocality: bakery.address.city,
      postalCode: bakery.address.postalCode,
      addressCountry: bakery.country,
    },
    openingHoursSpecification: hours,
    sameAs: [bakery.social.instagram, bakery.social.facebook],
    servesCuisine: categories.map((c) => c.en),
    currenciesAccepted: "MAD",
    paymentAccepted: "Cash",
  };

  // "<" is escaped so no field can ever close the script tag.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
