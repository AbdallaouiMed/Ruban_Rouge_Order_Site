"use client";

import { useState, type FormEvent } from "react";
import type { DayKey } from "@/data/bakery";
import { dayLabel, dayOrder } from "@/lib/hours";
import { useDemoData, useHydration } from "@/lib/demo/store";
import type { Settings } from "@/lib/demo/types";
import { PageHeader, adminBtnDanger, adminBtnPrimary, adminBtnSecondary, fieldClass } from "./ui";

type Hours = Settings["hours"];

const numberFields: { key: keyof Pick<Settings, "deliveryFee" | "freeAbove" | "minOrder" | "boxFee">; label: string; unit: string; hint: string }[] = [
  { key: "deliveryFee", label: "Frais de livraison", unit: "DH", hint: "Appliqués aux livraisons à Meknès." },
  { key: "freeAbove", label: "Livraison offerte dès", unit: "DH", hint: "Montant de commande à partir duquel la livraison est gratuite." },
  { key: "minOrder", label: "Minimum de commande (livraison)", unit: "DH", hint: "Sous ce montant, la livraison est refusée." },
  { key: "boxFee", label: "Boîte et ruban", unit: "DH", hint: "Ajouté au prix des pièces d'une boîte composée." },
];

function SettingsForm({ initial }: { initial: Settings }) {
  const updateSettings = useDemoData((s) => s.updateSettings);
  const resetAll = useDemoData((s) => s.resetAll);
  const seedIfEmpty = useDemoData((s) => s.seedIfEmpty);
  const [draft, setDraft] = useState<Settings>(initial);
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const setHours = (day: DayKey, patch: Partial<NonNullable<Hours[DayKey]>> | null) =>
    setDraft((d) => ({ ...d, hours: { ...d.hours, [day]: patch === null ? null : { ...(d.hours[day] ?? { open: "06:30", close: "22:30" }), ...patch } } }));

  function save(e: FormEvent) {
    e.preventDefault();
    const problems: string[] = [];
    for (const day of dayOrder) {
      const h = draft.hours[day];
      if (h && h.open >= h.close) problems.push(`${dayLabel(day, "fr")} : l'ouverture doit être avant la fermeture.`);
    }
    if (dayOrder.every((d) => draft.hours[d] === null)) problems.push("Au moins un jour d'ouverture est nécessaire pour prendre des commandes.");
    for (const f of numberFields) if (!Number.isFinite(draft[f.key]) || draft[f.key] < 0 || draft[f.key] > 100000) problems.push(`${f.label} : valeur invalide.`);
    if (!Number.isInteger(draft.leadMinutes) || draft.leadMinutes < 0 || draft.leadMinutes > 7 * 1440) problems.push("Délai de préparation : valeur invalide.");
    if (!Number.isInteger(draft.cakeLeadDays) || draft.cakeLeadDays < 0 || draft.cakeLeadDays > 60) problems.push("Délai pour les gâteaux : valeur invalide.");
    setErrors(problems);
    setSaved(false);
    if (problems.length) return;
    updateSettings(draft);
    setSaved(true);
  }

  const num = (v: string) => (v === "" ? NaN : Number(v.replace(",", ".")));

  return (
    <form onSubmit={save} noValidate className="space-y-8">
      <section aria-labelledby="hours" className="space-y-3 rounded-md bg-white p-5 shadow-soft">
        <h2 id="hours" className="font-display text-(length:--text-xl)">Horaires d&apos;ouverture</h2>
        <p className="text-(length:--text-sm) text-cocoa-soft">Ils déterminent le badge « ouvert » du site et les créneaux proposés au client.</p>
        <ul className="divide-y divide-cocoa/10">
          {dayOrder.map((day) => {
            const h = draft.hours[day];
            return (
              <li key={day} className="flex flex-wrap items-center gap-3 py-3">
                <span className="w-28 font-semibold capitalize">{dayLabel(day, "fr")}</span>
                <label className="inline-flex min-h-11 items-center gap-2">
                  <input type="checkbox" role="switch" checked={!!h} onChange={(e) => setHours(day, e.target.checked ? {} : null)} className="size-5 accent-[#B3202A]" />
                  Ouvert
                </label>
                {h ? (
                  <>
                    <label className="inline-flex items-center gap-2"><span className="text-(length:--text-sm) text-cocoa-soft">de</span><input type="time" value={h.open} onChange={(e) => setHours(day, { open: e.target.value })} aria-label={`${dayLabel(day, "fr")} : ouverture`} className={`${fieldClass} w-32`} /></label>
                    <label className="inline-flex items-center gap-2"><span className="text-(length:--text-sm) text-cocoa-soft">à</span><input type="time" value={h.close} onChange={(e) => setHours(day, { close: e.target.value })} aria-label={`${dayLabel(day, "fr")} : fermeture`} className={`${fieldClass} w-32`} /></label>
                  </>
                ) : (
                  <span className="text-cocoa-soft">Fermé</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="orders" className="space-y-4 rounded-md bg-white p-5 shadow-soft">
        <h2 id="orders" className="font-display text-(length:--text-xl)">Livraison et commandes</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {numberFields.map((f) => (
            <div key={f.key}>
              <label htmlFor={f.key} className="font-semibold">{f.label}</label>
              <div className="mt-1 flex items-center gap-2">
                <input id={f.key} type="text" inputMode="decimal" value={Number.isNaN(draft[f.key]) ? "" : String(draft[f.key])} onChange={(e) => setDraft((d) => ({ ...d, [f.key]: num(e.target.value) }))} className={`${fieldClass} max-w-40`} />
                <span>{f.unit}</span>
              </div>
              <p className="text-(length:--text-sm) text-cocoa-soft">{f.hint}</p>
            </div>
          ))}
          <div>
            <label htmlFor="lead" className="font-semibold">Délai de préparation (retrait et livraison)</label>
            <div className="mt-1 flex items-center gap-2">
              <input id="lead" type="text" inputMode="numeric" value={Number.isNaN(draft.leadMinutes) ? "" : String(draft.leadMinutes)} onChange={(e) => setDraft((d) => ({ ...d, leadMinutes: num(e.target.value) }))} className={`${fieldClass} max-w-40`} />
              <span>minutes</span>
            </div>
            <p className="text-(length:--text-sm) text-cocoa-soft">Le premier créneau proposé est au moins à ce délai de l&apos;heure actuelle.</p>
          </div>
          <div>
            <label htmlFor="slot" className="font-semibold">Durée d&apos;un créneau</label>
            <select id="slot" value={draft.slotMinutes} onChange={(e) => setDraft((d) => ({ ...d, slotMinutes: Number(e.target.value) }))} className={`${fieldClass} mt-1 max-w-40`}>
              {[15, 30, 60].map((m) => <option key={m} value={m}>{m} minutes</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="cakelead" className="font-semibold">Délai pour un gâteau sur mesure</label>
            <div className="mt-1 flex items-center gap-2">
              <input id="cakelead" type="text" inputMode="numeric" value={Number.isNaN(draft.cakeLeadDays) ? "" : String(draft.cakeLeadDays)} onChange={(e) => setDraft((d) => ({ ...d, cakeLeadDays: num(e.target.value) }))} className={`${fieldClass} max-w-40`} />
              <span>jours</span>
            </div>
          </div>
        </div>
      </section>

      {errors.length > 0 && (
        <ul role="alert" className="list-disc rounded-md bg-danger p-4 ps-8 font-semibold text-white">
          {errors.map((m) => <li key={m}>{m}</li>)}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={adminBtnPrimary}>Enregistrer les réglages</button>
        {saved && <p role="status" className="font-semibold text-success">Réglages enregistrés.</p>}
      </div>

      <section aria-labelledby="danger" className="space-y-3 rounded-md border-2 border-danger/30 p-5">
        <h2 id="danger" className="font-display text-(length:--text-xl)">Zone de démonstration</h2>
        <p>Remet à zéro les commandes, prix, images et réglages enregistrés sur cet appareil, puis recrée les commandes d&apos;exemple.</p>
        {confirmReset ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" className={adminBtnDanger} onClick={() => { resetAll(); seedIfEmpty(); setConfirmReset(false); setDraft(useDemoData.getState().settings); }}>Oui, tout réinitialiser</button>
            <button type="button" className={adminBtnSecondary} onClick={() => setConfirmReset(false)}>Annuler</button>
          </div>
        ) : (
          <button type="button" className={adminBtnDanger} onClick={() => setConfirmReset(true)}>Réinitialiser la démo</button>
        )}
      </section>
    </form>
  );
}

export function SettingsView() {
  const ready = useHydration((s) => s.ready);
  const settings = useDemoData((s) => s.settings);
  if (!ready) return <div className="h-96 animate-pulse rounded-md bg-butter" aria-hidden="true" />;
  // Mounted only after hydration so the form starts from the saved settings, not the defaults.
  return (
    <>
      <PageHeader title="Réglages" subtitle="Horaires, livraison et délais." />
      <SettingsForm initial={settings} />
    </>
  );
}
