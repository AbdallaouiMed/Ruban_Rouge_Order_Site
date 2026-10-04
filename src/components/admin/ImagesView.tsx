"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, ImagePlus, RotateCcw } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Photo } from "@/components/ui/Photo";
import { defaultSiteImages } from "@/data/demo";
import { useDemoData, useHydration } from "@/lib/demo/store";
import { ImageError, resizeImage } from "@/lib/image";
import type { SiteImageSlot } from "@/lib/demo/types";
import { PageHeader, adminBtn, adminBtnSecondary } from "./ui";

const slots: { slot: SiteImageSlot; title: string; where: string; ratio: string; aspect: string; href: string }[] = [
  { slot: "hero", title: "Photo principale de l'accueil", where: "En haut de la page d'accueil, à côté du titre.", ratio: "Portrait ou carré (4:5 idéal)", aspect: "aspect-[4/5]", href: "/" },
  { slot: "story", title: "Photo « Notre histoire »", where: "Page d'accueil, au-dessus du texte sur l'histoire de la maison.", ratio: "Paysage (16:9)", aspect: "aspect-[16/9]", href: "/" },
  { slot: "occasions", title: "Bandeau des occasions", where: "En-tête de la page Occasions, et fond du bloc rouge de l'accueil.", ratio: "Très large (21:8)", aspect: "aspect-[21/8]", href: "/occasions" },
  { slot: "box", title: "Bandeau « Composer une boîte »", where: "En-tête de la page Composer une boîte.", ratio: "Très large (21:8)", aspect: "aspect-[21/8]", href: "/box" },
  { slot: "cakes", title: "Bandeau « Gâteau sur mesure »", where: "En-tête de la page Gâteau sur mesure.", ratio: "Très large (21:8)", aspect: "aspect-[21/8]", href: "/cakes" },
  { slot: "gift", title: "Bandeau « Offrir »", where: "En-tête de la page Offrir une gourmandise.", ratio: "Très large (21:8)", aspect: "aspect-[21/8]", href: "/gift" },
];

function SlotCard({ slot, title, where, ratio, aspect, href }: (typeof slots)[number]) {
  const image = useDemoData((s) => s.siteImages[slot]);
  const setSiteImage = useDemoData((s) => s.setSiteImage);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file?: File) {
    if (!file) return;
    setError(null);
    try {
      setSiteImage(slot, await resizeImage(file, 1400, 0.8));
    } catch (e) {
      setError(e instanceof ImageError ? { type: "Format non accepté (JPEG, PNG ou WebP).", size: "Image trop lourde (12 Mo max).", decode: "Image illisible." }[e.code] : "Échec de l'envoi.");
    }
  }

  return (
    <li className="space-y-3 rounded-md bg-white p-5 shadow-soft">
      <div>
        <h2 className="font-display text-(length:--text-lg)">{title}</h2>
        <p className="text-(length:--text-sm) text-cocoa-soft">{where} Format conseillé : {ratio}.</p>
      </div>
      <div className={`pattern-zellige relative grid max-h-72 ${aspect} place-items-center overflow-hidden rounded-sm bg-butter`}>
        {image ? (
          <Photo src={image} alt={`Aperçu : ${title}`} sizes="(min-width:1024px) 520px, 100vw" />
        ) : (
          <>
            <Photo src={defaultSiteImages[slot]} alt={`Aperçu : ${title}`} sizes="(min-width:1024px) 520px, 100vw" />
            <span className="absolute start-2 top-2 rounded-pill bg-cocoa/85 px-3 py-1 text-(length:--text-xs) font-semibold text-flour">Image par défaut</span>
          </>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label={`Choisir : ${title}`} onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
      <div className="flex flex-wrap gap-2">
        <button type="button" className={adminBtnSecondary} onClick={() => fileRef.current?.click()}><ImagePlus aria-hidden="true" className="size-4" />{image ? "Remplacer" : "Choisir une image"}</button>
        {image && <button type="button" className={`${adminBtn} text-cocoa-soft hover:bg-butter`} onClick={() => setSiteImage(slot, null)}><RotateCcw aria-hidden="true" className="size-4" />Rétablir l&apos;image par défaut</button>}
        <Link href={href} className={`${adminBtn} text-ribbon hover:bg-butter`}><ExternalLink aria-hidden="true" className="size-4" />Voir sur le site</Link>
      </div>
      {error && <p role="alert" className="font-semibold text-danger">{error}</p>}
    </li>
  );
}

export function ImagesView() {
  const ready = useHydration((s) => s.ready);
  const [storageFull, setStorageFull] = useState(false);
  useEffect(() => {
    const on = () => setStorageFull(true);
    window.addEventListener("rr-storage-error", on);
    return () => window.removeEventListener("rr-storage-error", on);
  }, []);

  if (!ready) return <div className="h-96 animate-pulse rounded-md bg-butter" aria-hidden="true" />;
  return (
    <>
      <PageHeader title="Images du site" subtitle="Remplacez les visuels du site. Les photos des produits se changent dans « Produits et prix »." />
      {storageFull && <p role="alert" className="mb-4 rounded-md bg-danger p-4 font-semibold text-white">Le stockage de l&apos;appareil est plein : choisissez une image plus légère.</p>}
      <ul className="grid gap-5 lg:grid-cols-2">
        {slots.map((s) => (
          <SlotCard key={s.slot} {...s} />
        ))}
      </ul>
    </>
  );
}
