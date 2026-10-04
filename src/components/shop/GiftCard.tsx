import type { GiftInfo } from "@/lib/demo/types";

const styles: Record<GiftInfo["cardStyle"], string> = {
  ribbon: "bg-ribbon text-white",
  floral: "bg-butter text-garnet ring-4 ring-saffron/60 ring-inset",
  classic: "bg-white text-cocoa ring-2 ring-cocoa/30 ring-inset",
};

/** The personal message card that goes in the box. Shown live while the sender writes it. */
export function GiftCard({ style, to, message, from, labels }: { style: GiftInfo["cardStyle"]; to: string; message: string; from: string; labels: { to: string; from: string; placeholder: string } }) {
  return (
    <figure className={`relative overflow-hidden rounded-md p-6 shadow-lift ${styles[style]}`} aria-label={labels.to}>
      {style === "ribbon" && <div aria-hidden="true" className="absolute inset-y-0 end-8 w-5 bg-white/25" />}
      <figcaption className="font-display text-(length:--text-lg)">{to ? labels.to.replace("{name}", to) : labels.to.replace("{name}", "…")}</figcaption>
      <blockquote className="my-4 min-h-16 font-display text-(length:--text-xl) leading-snug whitespace-pre-wrap">{message || <span className="opacity-60">{labels.placeholder}</span>}</blockquote>
      <p className="text-end text-(length:--text-sm) font-semibold">{labels.from.replace("{name}", from || "…")}</p>
    </figure>
  );
}
