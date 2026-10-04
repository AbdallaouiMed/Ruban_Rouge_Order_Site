"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, RotateCcw, Trash2 } from "lucide-react";
import { categories } from "@/data/bakery";
import { PastryArt } from "@/components/ui/PastryArt";
import { Photo } from "@/components/ui/Photo";
import { baseProducts, type Product } from "@/lib/catalog";
import { useCatalog } from "@/lib/demo/hooks";
import { useDemoData, useHydration } from "@/lib/demo/store";
import { ImageError, resizeImage } from "@/lib/image";
import { PageHeader, adminBtn, adminBtnSecondary, fieldClass } from "./ui";

const MIN = 0.5;
const MAX = 10000;

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 font-semibold">
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-5 accent-[#B3202A]" />
      {label}
    </label>
  );
}

function Row({ product }: { product: Product }) {
  const setOverride = useDemoData((s) => s.setOverride);
  const hasOverride = useDemoData((s) => !!s.overrides[product.slug]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const category = categories.find((c) => c.id === product.category)?.fr ?? product.category;

  const shown = draft ?? (product.priceMad !== null ? String(product.priceMad) : "");

  function commitPrice() {
    if (draft === null) return;
    const value = Number(draft.replace(",", "."));
    if (!Number.isFinite(value) || value < MIN || value > MAX) {
      setError(`Entrez un prix entre ${MIN} et ${MAX} DH.`);
      return;
    }
    setError(null);
    setOverride(product.slug, { priceMad: Math.round(value * 100) / 100 });
    setDraft(null);
  }

  async function onFile(file?: File) {
    if (!file) return;
    setError(null);
    try {
      setOverride(product.slug, { image: await resizeImage(file, 900, 0.78) });
    } catch (e) {
      setError(e instanceof ImageError ? { type: "Format non accepté (JPEG, PNG ou WebP).", size: "Image trop lourde (12 Mo max).", decode: "Image illisible." }[e.code] : "Échec de l'envoi.");
    }
  }

  return (
    <li className="grid gap-4 rounded-md bg-white p-4 shadow-soft sm:grid-cols-[6rem_1fr] lg:grid-cols-[6rem_1fr_auto]">
      <div className="pattern-zellige relative grid size-24 place-items-center overflow-hidden rounded-sm bg-butter">
        {product.image ? <Photo src={product.image} sizes="96px" /> : <PastryArt kind={product.slug} className="size-20" />}
      </div>

      <div className="min-w-0 space-y-3">
        <div>
          <h2 className="font-display text-(length:--text-lg)">{product.name.fr}</h2>
          <p className="text-(length:--text-sm) text-cocoa-soft">{category}</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor={`price-${product.slug}`} className="text-(length:--text-sm) font-semibold">Prix (DH)</label>
            <input
              id={`price-${product.slug}`}
              type="text"
              inputMode="decimal"
              value={shown}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitPrice}
              onKeyDown={(e) => e.key === "Enter" && commitPrice()}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `err-${product.slug}` : undefined}
              className={`${fieldClass} mt-1 w-28`}
            />
          </div>
          <Toggle label="Frais aujourd'hui" checked={product.freshToday && !product.soldOut} onChange={(v) => setOverride(product.slug, { freshToday: v, soldOut: v ? false : product.soldOut })} />
          <Toggle label="Épuisé" checked={product.soldOut} onChange={(v) => setOverride(product.slug, { soldOut: v, freshToday: v ? false : product.freshToday })} />
        </div>
        {error && <p id={`err-${product.slug}`} role="alert" className="text-(length:--text-sm) font-semibold text-danger">{error}</p>}
      </div>

      <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-1 lg:flex-col">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label={`Photo de ${product.name.fr}`} onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
        <button type="button" className={adminBtnSecondary} onClick={() => fileRef.current?.click()}><ImagePlus aria-hidden="true" className="size-4" />{product.image ? "Changer la photo" : "Ajouter une photo"}</button>
        {product.image && <button type="button" className={`${adminBtn} text-danger hover:bg-butter`} onClick={() => setOverride(product.slug, { image: null })}><Trash2 aria-hidden="true" className="size-4" />Masquer la photo</button>}
        {hasOverride && <button type="button" className={`${adminBtn} text-cocoa-soft hover:bg-butter`} onClick={() => setOverride(product.slug, null)}><RotateCcw aria-hidden="true" className="size-4" />Rétablir</button>}
      </div>
    </li>
  );
}

export function ProductsView() {
  const ready = useHydration((s) => s.ready);
  const { products } = useCatalog();
  const [storageFull, setStorageFull] = useState(false);

  useEffect(() => {
    const on = () => setStorageFull(true);
    window.addEventListener("rr-storage-error", on);
    return () => window.removeEventListener("rr-storage-error", on);
  }, []);

  if (!ready) return <div className="h-96 animate-pulse rounded-md bg-butter" aria-hidden="true" />;
  const seeds = baseProducts();

  return (
    <>
      <PageHeader title="Produits et prix" subtitle="Les changements apparaissent tout de suite sur le site (ouvrez-le dans un autre onglet)." />
      {storageFull && <p role="alert" className="mb-4 rounded-md bg-danger p-4 font-semibold text-white">Le stockage de l&apos;appareil est plein : utilisez des photos plus légères ou retirez-en.</p>}
      <p className="mb-5 rounded-md bg-butter p-4 text-(length:--text-sm)">
        Les prix actuels sont des exemples de démonstration à remplacer par les vrais prix. Un produit sans prix ou marqué « épuisé » ne peut pas être commandé.
      </p>
      <ul className="space-y-4">
        {products.map((p) => (
          <Row key={p.slug} product={p} />
        ))}
      </ul>
      <p className="mt-4 text-(length:--text-sm) text-cocoa-soft">{seeds.length} produits.</p>
    </>
  );
}
