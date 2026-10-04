export function RibbonDivider({ className = "", animate = false }: { className?: string; animate?: boolean }) {
  return <div role="presentation" aria-hidden="true" className={`ribbon-divider ${animate ? "ribbon-animate" : ""} ${className}`} />;
}
