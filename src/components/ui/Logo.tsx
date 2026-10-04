/** Wordmark with a small ribbon bow. Replace the SVG when the real logo file arrives. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 whitespace-nowrap ${className}`}>
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
        <path d="M16 15c-3-6-9-9-12-6s0 8 6 8c3 0 5-1 6-2Z" fill="#B3202A" />
        <path d="M16 15c3-6 9-9 12-6s0 8-6 8c-3 0-5-1-6-2Z" fill="#B3202A" />
        <path d="M14.5 17 9 28l5-2.2 2 3.2 2-3.2 5 2.2-5.5-11Z" fill="#7E1420" />
        <circle cx="16" cy="15.5" r="3" fill="#B3202A" stroke="#FBF4E8" strokeWidth="1.2" />
      </svg>
      <span className="font-display text-(length:--text-lg) leading-none font-semibold tracking-tight text-ribbon">Ruban Rouge</span>
    </span>
  );
}
