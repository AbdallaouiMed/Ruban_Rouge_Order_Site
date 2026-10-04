/**
 * Illustrated placeholders for products that have no photo yet. Flat shapes in the brand palette,
 * so the catalogue still looks intentional. Real photos (uploaded in the admin) replace them.
 */
const C = {
  crust: "#D9962B",
  crustDark: "#B8791E",
  crumb: "#F3E3C1",
  cream: "#FFF8EA",
  cocoa: "#4A2B1F",
  cocoaDark: "#2B1A14",
  ribbon: "#B3202A",
  garnet: "#7E1420",
  pink: "#F2C9C4",
};

type Kind = string;

function Art({ kind }: { kind: Kind }) {
  switch (kind) {
    case "croissant-au-beurre":
      return (
        <g>
          <path d="M28 98c6-34 30-52 72-52s66 18 72 52c-10-6-18-6-26 0-10-12-24-18-46-18s-36 6-46 18c-8-6-16-6-26 0Z" fill={C.crust} />
          <path d="M60 62c8 6 12 16 13 30M100 56v36M140 62c-8 6-12 16-13 30" stroke={C.crustDark} strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M34 98c8-2 14 0 22 6-10 6-22 6-30 0 0-2 2-4 8-6Zm132 0c-8-2-14 0-22 6 10 6 22 6 30 0 0-2-2-4-8-6Z" fill={C.crustDark} />
        </g>
      );
    case "pain-au-chocolat":
      return (
        <g>
          <rect x="34" y="52" width="132" height="62" rx="26" fill={C.crust} />
          <rect x="52" y="74" width="96" height="14" rx="7" fill={C.cocoa} />
          <path d="M56 58c-2 14-2 40 0 52M88 54c-2 16-2 42 0 58M120 54c2 16 2 42 0 58M148 58c2 14 2 40 0 52" stroke={C.crustDark} strokeWidth="4" strokeLinecap="round" fill="none" />
        </g>
      );
    case "baguette":
      return (
        <g transform="rotate(-18 100 80)">
          <rect x="12" y="62" width="176" height="36" rx="18" fill={C.crust} />
          {[44, 76, 108, 140].map((x) => (
            <path key={x} d={`M${x} 68l14 24`} stroke={C.crumb} strokeWidth="7" strokeLinecap="round" />
          ))}
        </g>
      );
    case "pain-tradition":
      return (
        <g>
          <ellipse cx="100" cy="86" rx="70" ry="42" fill={C.crust} />
          <ellipse cx="100" cy="80" rx="58" ry="30" fill={C.crustDark} opacity="0.25" />
          {[70, 100, 130].map((x) => (
            <path key={x} d={`M${x - 8} 66q8 18 16 40`} stroke={C.crumb} strokeWidth="6" strokeLinecap="round" fill="none" />
          ))}
        </g>
      );
    case "mille-feuille":
      return (
        <g>
          <rect x="34" y="96" width="132" height="14" rx="4" fill={C.crust} />
          <rect x="34" y="84" width="132" height="12" fill={C.cream} />
          <rect x="34" y="72" width="132" height="12" rx="2" fill={C.crust} />
          <rect x="34" y="60" width="132" height="12" fill={C.cream} />
          <rect x="34" y="46" width="132" height="14" rx="5" fill={C.cream} stroke={C.crumb} />
          <path d="M42 53h116" stroke={C.cocoa} strokeWidth="4" strokeLinecap="round" strokeDasharray="14 8" />
          <circle cx="100" cy="36" r="6" fill={C.ribbon} />
        </g>
      );
    case "eclair-au-chocolat":
      return (
        <g>
          <rect x="26" y="70" width="148" height="34" rx="17" fill={C.crust} />
          <path d="M26 82c0-14 12-24 28-24h92c16 0 28 10 28 24 0 6-6 8-12 4-8-6-16-2-24 2s-18 0-26-4-18-4-26 0-18 6-26 2-16-4-22 0c-8 4-12 0-12-4Z" fill={C.cocoa} />
          <rect x="40" y="96" width="120" height="6" rx="3" fill={C.cream} />
        </g>
      );
    case "truffes-artisanales":
      return (
        <g>
          {[
            [66, 92, 26],
            [112, 80, 28],
            [146, 106, 22],
          ].map(([x, y, r]) => (
            <g key={`${x}${y}`}>
              <circle cx={x} cy={y} r={r} fill={C.cocoa} />
              <circle cx={x - r * 0.3} cy={y - r * 0.35} r={r * 0.28} fill={C.cocoaDark} opacity="0.45" />
              <circle cx={x + r * 0.35} cy={y + r * 0.2} r="2" fill={C.crumb} opacity="0.7" />
            </g>
          ))}
          <path d="M24 122c26 8 126 8 152 0" stroke={C.ribbon} strokeWidth="6" strokeLinecap="round" fill="none" />
        </g>
      );
    case "glace-vanille":
      return (
        <g>
          <path d="M72 80h56l-28 62Z" fill={C.crust} />
          <path d="M82 92l36 0M88 106h24" stroke={C.crustDark} strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="64" r="34" fill={C.cream} stroke={C.crumb} strokeWidth="3" />
          <path d="M72 70c6 8 14 8 18 2 6 8 14 8 20 0 4 6 12 6 18-2" stroke={C.crumb} strokeWidth="4" strokeLinecap="round" fill="none" />
          <circle cx="112" cy="40" r="7" fill={C.ribbon} />
        </g>
      );
    default:
      // Cake, boxes and bundles: a tiered cake tied with the red ribbon
      return (
        <g>
          <rect x="52" y="98" width="96" height="34" rx="8" fill={C.pink} />
          <rect x="66" y="68" width="68" height="32" rx="8" fill={C.cream} stroke={C.crumb} />
          <rect x="80" y="44" width="40" height="26" rx="8" fill={C.pink} />
          <circle cx="100" cy="36" r="7" fill={C.ribbon} />
          <rect x="52" y="108" width="96" height="9" fill={C.ribbon} />
          <path d="M100 108c-10-12-24-10-24 0s16 6 24 0Zm0 0c10-12 24-10 24 0s-16 6-24 0Z" fill={C.garnet} />
        </g>
      );
  }
}

export function PastryArt({ kind, className = "" }: { kind: Kind; className?: string }) {
  return (
    <svg viewBox="0 0 200 150" role="presentation" aria-hidden="true" className={className} preserveAspectRatio="xMidYMid meet">
      <ellipse cx="100" cy="132" rx="64" ry="7" fill="#2B1A14" opacity="0.1" />
      <Art kind={kind} />
    </svg>
  );
}
