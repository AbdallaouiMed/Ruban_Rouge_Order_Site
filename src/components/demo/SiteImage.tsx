"use client";

import type { ReactNode } from "react";
import { Photo } from "@/components/ui/Photo";
import { defaultSiteImages } from "@/data/demo";
import { isDemo } from "@/lib/demo/config";
import { useSiteImage } from "@/lib/demo/hooks";
import type { SiteImageSlot } from "@/lib/demo/types";

/**
 * A page image the owners can replace from the admin. Order of preference: the picture uploaded in the
 * admin, then the default photo for the slot (demo mode), then the fallback (illustration/placeholder).
 * Fills its positioned parent.
 */
export function SiteImage({ slot, alt = "", sizes, fallback = null, priority = false, className = "" }: { slot: SiteImageSlot; alt?: string; sizes: string; fallback?: ReactNode; priority?: boolean; className?: string }) {
  const uploaded = useSiteImage(slot);
  const src = uploaded ?? (isDemo ? defaultSiteImages[slot] : undefined);
  if (!src) return <>{fallback}</>;
  return <Photo src={src} alt={alt} sizes={sizes} priority={priority} className={className} />;
}
