"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { ImagePlus, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { cakeOptions, type Opt } from "@/data/demo";
import { buttonClasses } from "@/components/ui/Button";
import { PastryArt } from "@/components/ui/PastryArt";
import { cakeEstimate } from "@/lib/pricing";
import { useSettings } from "@/lib/demo/hooks";
import { useDemoData } from "@/lib/demo/store";
import { formatDay, formatMad } from "@/lib/format";
import { ImageError, resizeImage } from "@/lib/image";
import { wallClock } from "@/lib/slots";
import type { Locale } from "@/i18n/routing";

const STEPS = ["occasion", "size", "flavor", "filling", "frosting", "decorations", "message", "date", "details"] as const;
type Step = (typeof STEPS)[number];

function Choice({ name, options, value, onChange, locale, legend }: { name: string; options: readonly Opt[]; value: string; onChange: (id: string) => void; locale: Locale; legend: string }) {
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((o) => (
          <label key={o.id} className={`flex min-h-14 cursor-pointer items-center justify-between gap-2 rounded-md border-2 px-4 py-3 font-semibold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ribbon ${value === o.id ? "border-ribbon bg-white shadow-soft" : "border-transparent bg-butter hover:bg-[#ecd3a3]"}`}>
            <input type="radio" name={name} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} className="sr-only" />
            <span>{o.label[locale]}</span>
            {!!o.add && <span className="shrink-0 whitespace-nowrap text-(length:--text-sm) font-normal text-cocoa-soft">+{formatMad(o.add, locale)}</span>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function CakeStudio() {
  const t = useTranslations("cakes");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const params = useSearchParams();
  const settings = useSettings();
  const placeCakeRequest = useDemoData((s) => s.placeCakeRequest);
  const fileRef = useRef<HTMLInputElement>(null);

  const fromUrl = params.get("occasion");
  const [step, setStep] = useState(0);
  const [occasion, setOccasion] = useState(cakeOptions.occasions.some((o) => o.id === fromUrl) ? fromUrl! : "birthday");
  const [size, setSize] = useState("m");
  const [flavor, setFlavor] = useState("vanilla");
  const [filling, setFilling] = useState("cream");
  const [frosting, setFrosting] = useState("buttercream");
  const [decorations, setDecorations] = useState<string[]>(["ribbon"]);
  const [dedication, setDedication] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [budget, setBudget] = useState("b3");
  const [error, setError] = useState<string | null>(null);

  const wc = wallClock();
  const minDate = new Date(Date.UTC(wc.y, wc.m - 1, wc.d + settings.cakeLeadDays)).toISOString().slice(0, 10);
  const estimate = cakeEstimate({ size, flavor, filling, frosting, decorations });
  const sizeOpt = cakeOptions.sizes.find((s) => s.id === size)!;
  const current: Step = STEPS[step];
  const label = (list: readonly Opt[], id: string) => list.find((o) => o.id === id)?.label[locale] ?? id;

  const toggleDeco = (id: string) => setDecorations((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));

  async function onPhoto(file?: File) {
    if (!file) return;
    setPhotoError(null);
    try {
      setPhoto(await resizeImage(file, 800, 0.7));
    } catch (e) {
      setPhotoError(e instanceof ImageError ? t(`photoErrors.${e.code}`) : t("photoErrors.decode"));
    }
  }

  function goNext() {
    setError(null);
    if (current === "date" && (!date || date < minDate)) {
      setError(t("errors.cake_date", { date: formatDay(minDate, locale) }));
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = placeCakeRequest({
      spec: { occasion, servings: sizeOpt.servings, flavor, filling, frosting, decorations, dedication: dedication.trim(), date, budget, estimateLow: estimate?.low ?? 0, estimateHigh: estimate?.high ?? 0, photo },
      customer: { name: String(fd.get("name") ?? ""), phone: String(fd.get("phone") ?? ""), email: String(fd.get("email") ?? "") || undefined },
      locale,
    });
    if (res.ok) router.push(`/order/${res.order.id}`);
    else setError(t(`errors.${res.error}`, { date: formatDay(minDate, locale) }));
  }

  const budgetLabel = (b: { id: string; max: number | null }) => (b.max === null ? t("budgetAbove", { amount: formatMad(1200, locale) }) : t("budgetUpTo", { amount: formatMad(b.max, locale) }));

  const summary = (
    <dl className="space-y-2 text-(length:--text-sm)">
      {[
        [t("steps.occasion"), label(cakeOptions.occasions, occasion)],
        [t("steps.size"), t("servings", { count: sizeOpt.servings })],
        [t("steps.flavor"), label(cakeOptions.flavors, flavor)],
        [t("steps.filling"), label(cakeOptions.fillings, filling)],
        [t("steps.frosting"), label(cakeOptions.frostings, frosting)],
        [t("steps.decorations"), decorations.length ? decorations.map((d) => label(cakeOptions.decorations, d)).join(", ") : "—"],
        [t("dedication"), dedication || "—"],
        [t("steps.date"), date ? formatDay(date, locale) : "—"],
      ].map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3">
          <dt className="text-cocoa-soft">{k}</dt>
          <dd className="text-end font-semibold">{v}</dd>
        </div>
      ))}
    </dl>
  );

  const nav = (
    <div className="flex flex-wrap justify-between gap-3 pt-4">
      <button type="button" onClick={() => { setError(null); setStep((s) => Math.max(0, s - 1)); }} disabled={step === 0} className={buttonClasses("secondary")}>{tc("previous")}</button>
      {current !== "details" && <button type="button" onClick={goNext} className={buttonClasses("primary")}>{tc("next")}</button>}
    </div>
  );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        <div>
          <p className="font-semibold" aria-live="polite">{t("stepOf", { current: step + 1, total: STEPS.length })} · {t(`steps.${current}`)}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-pill bg-butter" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-label={t("progress")}>
            <div className="h-full rounded-pill bg-ribbon transition-[width] duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>

        <section aria-labelledby="step-title" className="space-y-4">
          <h2 id="step-title" className="font-display text-(length:--text-2xl)" tabIndex={-1}>{t(`titles.${current}`)}</h2>

          {current === "occasion" && <Choice name="occasion" options={cakeOptions.occasions} value={occasion} onChange={setOccasion} locale={locale} legend={t("steps.occasion")} />}
          {current === "size" && (
            <fieldset>
              <legend className="sr-only">{t("steps.size")}</legend>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cakeOptions.sizes.map((s) => (
                  <label key={s.id} className={`cursor-pointer rounded-md border-2 p-4 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ribbon ${size === s.id ? "border-ribbon bg-white shadow-soft" : "border-transparent bg-butter hover:bg-[#ecd3a3]"}`}>
                    <input type="radio" name="size" value={s.id} checked={size === s.id} onChange={() => setSize(s.id)} className="sr-only" />
                    <span className="block font-display text-(length:--text-xl)">{t("servings", { count: s.servings })}</span>
                    <span className="text-(length:--text-sm) text-cocoa-soft">{t("from", { price: formatMad(s.base, locale) })}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {current === "flavor" && <Choice name="flavor" options={cakeOptions.flavors} value={flavor} onChange={setFlavor} locale={locale} legend={t("steps.flavor")} />}
          {current === "filling" && <Choice name="filling" options={cakeOptions.fillings} value={filling} onChange={setFilling} locale={locale} legend={t("steps.filling")} />}
          {current === "frosting" && <Choice name="frosting" options={cakeOptions.frostings} value={frosting} onChange={setFrosting} locale={locale} legend={t("steps.frosting")} />}
          {current === "decorations" && (
            <fieldset>
              <legend className="sr-only">{t("steps.decorations")}</legend>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cakeOptions.decorations.map((o) => (
                  <label key={o.id} className={`flex min-h-14 cursor-pointer items-center justify-between gap-2 rounded-md border-2 px-4 py-3 font-semibold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ribbon ${decorations.includes(o.id) ? "border-ribbon bg-white shadow-soft" : "border-transparent bg-butter hover:bg-[#ecd3a3]"}`}>
                    <input type="checkbox" checked={decorations.includes(o.id)} onChange={() => toggleDeco(o.id)} className="sr-only" />
                    <span>{o.label[locale]}</span>
                    {!!o.add && <span className="shrink-0 whitespace-nowrap text-(length:--text-sm) font-normal text-cocoa-soft">+{formatMad(o.add, locale)}</span>}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {current === "message" && (
            <div className="space-y-5">
              <div>
                <label htmlFor="dedication" className="font-semibold">{t("dedication")} <span className="font-normal text-cocoa-soft">({tc("optionalLabel")})</span></label>
                <input id="dedication" type="text" maxLength={80} value={dedication} onChange={(e) => setDedication(e.target.value)} placeholder={t("dedicationPlaceholder")} className="mt-1 min-h-12 w-full rounded-sm border border-cocoa/30 bg-white px-4" />
                <p className="text-(length:--text-sm) text-cocoa-soft">{dedication.length}/80</p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold">{t("photo")} <span className="font-normal text-cocoa-soft">({tc("optionalLabel")})</span></p>
                <input ref={fileRef} id="cake-photo" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { void onPhoto(e.target.files?.[0]); e.target.value = ""; }} />
                {photo ? (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt={t("photoAlt")} className="max-h-56 rounded-md" />
                    <button type="button" onClick={() => setPhoto(undefined)} aria-label={t("removePhoto")} className="absolute -end-2 -top-2 grid size-11 place-items-center rounded-pill bg-cocoa text-flour"><X aria-hidden="true" className="size-4" /></button>
                  </div>
                ) : (
                  <label htmlFor="cake-photo" className={buttonClasses("secondary", "cursor-pointer")}><ImagePlus aria-hidden="true" className="size-5" />{t("choosePhoto")}</label>
                )}
                <p className="text-(length:--text-sm) text-cocoa-soft">{t("photoHint")}</p>
                {photoError && <p role="alert" className="font-semibold text-danger">{photoError}</p>}
              </div>
            </div>
          )}
          {current === "date" && (
            <div className="space-y-5">
              <div>
                <label htmlFor="cake-date" className="font-semibold">{t("eventDate")} <span className="font-normal text-cocoa-soft">*</span></label>
                <input id="cake-date" type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} suppressHydrationWarning className="mt-1 min-h-12 w-full max-w-xs rounded-sm border border-cocoa/30 bg-white px-4" />
                <p className="text-(length:--text-sm) text-cocoa-soft">{t("leadHint", { days: settings.cakeLeadDays })}</p>
              </div>
              <fieldset>
                <legend className="font-semibold">{t("budget")}</legend>
                <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {cakeOptions.budgets.map((b) => (
                    <label key={b.id} className={`flex min-h-12 cursor-pointer items-center rounded-md border-2 px-4 py-3 font-semibold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ribbon ${budget === b.id ? "border-ribbon bg-white shadow-soft" : "border-transparent bg-butter hover:bg-[#ecd3a3]"}`}>
                      <input type="radio" name="budget" value={b.id} checked={budget === b.id} onChange={() => setBudget(b.id)} className="sr-only" />
                      {budgetLabel(b)}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          )}
          {current === "details" && (
            <form onSubmit={submit} noValidate className="space-y-4">
              <div>
                <label htmlFor="cake-name" className="font-semibold">{t("name")} <span className="font-normal text-cocoa-soft">*</span></label>
                <input id="cake-name" name="name" required autoComplete="name" maxLength={100} className="mt-1 min-h-12 w-full rounded-sm border border-cocoa/30 bg-white px-4" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="cake-phone" className="font-semibold">{t("phone")} <span className="font-normal text-cocoa-soft">*</span></label>
                  <input id="cake-phone" name="phone" type="tel" inputMode="tel" required autoComplete="tel" dir="ltr" maxLength={30} className="mt-1 min-h-12 w-full rounded-sm border border-cocoa/30 bg-white px-4" />
                </div>
                <div>
                  <label htmlFor="cake-email" className="font-semibold">{t("email")} <span className="font-normal text-cocoa-soft">({tc("optionalLabel")})</span></label>
                  <input id="cake-email" name="email" type="email" inputMode="email" autoComplete="email" dir="ltr" maxLength={200} className="mt-1 min-h-12 w-full rounded-sm border border-cocoa/30 bg-white px-4" />
                </div>
              </div>
              <p className="rounded-md bg-butter p-4 text-(length:--text-sm)">{t("quoteNote")}</p>
              {error && <p role="alert" className="font-semibold text-danger">{error}</p>}
              <button type="submit" className={buttonClasses("primary", "w-full sm:w-auto")}>{t("send")}</button>
            </form>
          )}
          {error && current !== "details" && <p role="alert" className="font-semibold text-danger">{error}</p>}
        </section>
        {nav}
      </div>

      <aside aria-labelledby="live-summary" className="h-fit space-y-4 rounded-md bg-white p-5 shadow-soft lg:sticky lg:top-24">
        <div className="grid place-items-center rounded-md bg-butter py-3"><PastryArt kind="cake" className="h-28" /></div>
        <h2 id="live-summary" className="font-display text-(length:--text-xl)">{t("summary")}</h2>
        {summary}
        {estimate && (
          <p className="rounded-md bg-cocoa p-4 text-flour">
            <span className="block text-(length:--text-sm)">{t("estimate")}</span>
            <strong className="font-display text-(length:--text-xl)">{formatMad(estimate.low, locale)} – {formatMad(estimate.high, locale)}</strong>
          </p>
        )}
        <p className="text-(length:--text-xs) text-cocoa-soft">{t("estimateNote")}</p>
      </aside>
    </div>
  );
}
