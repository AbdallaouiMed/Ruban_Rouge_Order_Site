import type { ReactNode } from "react";
import { SiteImage } from "@/components/demo/SiteImage";
import { Photo } from "@/components/ui/Photo";
import { RibbonDivider } from "@/components/ui/RibbonDivider";
import type { SiteImageSlot } from "@/lib/demo/types";

/**
 * The header of a page: title and intro over either a photo (an editable site slot, or a fixed image)
 * or a warm tinted band. Over a photo, a cocoa gradient keeps the white text legible; it is darkest on
 * the text side and flips with the reading direction. The red ribbon runs along the bottom edge.
 */
export function PageBand({
  title,
  subtitle,
  eyebrow,
  slot,
  image,
  accent,
  children,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  slot?: SiteImageSlot;
  image?: string;
  /** Tailwind classes for a solid tinted overlay under the gradient (occasion colours) */
  accent?: string;
  children?: ReactNode;
}) {
  const photo = !!slot || !!image;
  return (
    <header className={`relative isolate overflow-hidden ${photo ? "bg-cocoa text-white" : "grade-band grain"}`}>
      {photo && (
        <>
          <div className="absolute inset-0 -z-20">{slot ? <SiteImage slot={slot} sizes="100vw" priority /> : <Photo src={image!} sizes="100vw" priority />}</div>
          {accent && <div aria-hidden="true" className={`absolute inset-0 -z-10 opacity-35 mix-blend-multiply ${accent}`} />}
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-r from-cocoa/90 via-cocoa/62 to-cocoa/15 rtl:bg-linear-to-l" />
        </>
      )}
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-12 sm:px-6 md:pb-20 md:pt-16">
        {eyebrow && <p className={`font-display text-(length:--text-sm) font-semibold tracking-widest uppercase ${photo ? "text-saffron" : "text-saffron-deep"}`}>{eyebrow}</p>}
        <h1 className={`font-display text-(length:--text-4xl) leading-tight ${photo ? "text-white" : "text-ribbon"} ${eyebrow ? "mt-2" : ""}`}>{title}</h1>
        {subtitle && <p className={`mt-3 max-w-prose text-(length:--text-lg) ${photo ? "text-white/92" : "text-cocoa-soft"}`}>{subtitle}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
      <RibbonDivider className="absolute inset-x-0 bottom-0 h-4" />
    </header>
  );
}
