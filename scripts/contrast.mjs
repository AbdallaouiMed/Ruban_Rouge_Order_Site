// WCAG contrast checker for the Ruban Rouge palette.
// Usage: node scripts/contrast.mjs   (exits 1 if any required pair fails)

const palette = {
  ribbon: "#B3202A",
  garnet: "#7E1420",
  flour: "#FBF4E8",
  butter: "#F3E3C1",
  cocoa: "#2B1A14",
  "cocoa-soft": "#5A4338",
  saffron: "#D9962B",
  "saffron-deep": "#8A5A07",
  zellige: "#1F5E5B",
  white: "#FFFFFF",
  success: "#1E6B3A",
  danger: "#A3151F",
  // Colour-grade tones (src/app/globals.css). Gradients are checked at their lightest or darkest stop.
  peach: "#F9E6D0",
  honey: "#F3D3A6",
  "honey-deep": "#EEC08F",
  blush: "#F6D5CB",
  "ruby-deep": "#8E1620",
  "ruby-light": "#C23A2C",
  "cocoa-footer": "#34201A",
};

// [foreground, background, minimum ratio, usage]
const pairs = [
  ["white", "ribbon", 4.5, "Primary button text"],
  ["white", "garnet", 4.5, "Primary button hover text"],
  ["cocoa", "flour", 4.5, "Body text"],
  ["cocoa", "butter", 4.5, "Text on surface cards"],
  ["cocoa-soft", "flour", 4.5, "Secondary text"],
  ["ribbon", "flour", 4.5, "Links and red text on page background"],
  ["garnet", "butter", 4.5, "Red text on surface cards"],
  ["flour", "cocoa", 4.5, "Footer text"],
  ["saffron", "cocoa", 4.5, "Accent on dark footer"],
  ["cocoa", "saffron", 4.5, "Text on saffron badges"],
  ["saffron-deep", "flour", 4.5, "Accent text on light"],
  ["white", "zellige", 4.5, "Text on teal"],
  ["white", "success", 4.5, "Success banner"],
  ["white", "danger", 4.5, "Error banner"],
  ["ribbon", "flour", 3, "Focus ring / UI component boundary"],
  ["cocoa", "peach", 4.5, "Text on peach bands"],
  ["cocoa", "honey-deep", 4.5, "Text on the darkest stop of the honey gradient"],
  ["cocoa-soft", "honey-deep", 4.5, "Secondary text on honey"],
  ["garnet", "honey-deep", 4.5, "Red text on honey"],
  ["cocoa", "blush", 4.5, "Text on blush bands"],
  ["ribbon", "peach", 4.5, "Links on peach"],
  ["white", "ruby-deep", 4.5, "White text on the deep ruby stop"],
  ["white", "ribbon", 4.5, "White text on the ribbon-red middle stop"],
  ["white", "ruby-light", 4.5, "White text on the lightest ruby stop"],
  ["flour", "cocoa-footer", 4.5, "Footer text on the lighter cocoa stop"],
  ["saffron", "cocoa-footer", 4.5, "Saffron accents on the lighter cocoa stop"],
  // Saffron on flour is only 2.3:1, so it is decorative-only on light
  // backgrounds: never text, never a focus ring, never a control boundary.
  // Use saffron-deep for accent text on light, saffron on cocoa for dark.
];

const channel = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  );
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

let failed = 0;
for (const [fg, bg, min, usage] of pairs) {
  const r = ratio(palette[fg], palette[bg]);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${r.toFixed(2).padStart(5)}:1 (min ${min})  ${fg} on ${bg}  ${usage}`,
  );
}
if (failed) {
  console.error(`\n${failed} pair(s) failed.`);
  process.exit(1);
}
console.log("\nAll pairs pass.");
