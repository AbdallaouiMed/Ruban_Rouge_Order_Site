import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { defaultSiteImages, demoOccasionImages, demoProductImages, occasions } from "@/data/demo";
import { seedProducts } from "@/data/bakery";

const publicFile = (url: string) => join(process.cwd(), "public", url);

// Aspect ratio each slot is designed for (the components crop with object-cover).
const expectedRatio: Record<string, number> = {
  hero: 4 / 5,
  story: 16 / 7,
  occasions: 21 / 8,
  box: 21 / 8,
  cakes: 21 / 8,
  gift: 21 / 8,
};

const all = [
  ...Object.entries(defaultSiteImages).map(([k, url]) => ({ name: `site:${k}`, url, ratio: expectedRatio[k] })),
  ...Object.entries(demoProductImages).map(([k, url]) => ({ name: `product:${k}`, url, ratio: 4 / 3 })),
  ...Object.entries(demoOccasionImages).map(([k, url]) => ({ name: `occasion:${k}`, url, ratio: 4 / 3 })),
];

describe("demo photographs", () => {
  it("covers every product and every occasion", () => {
    for (const p of seedProducts) expect(demoProductImages[p.slug], p.slug).toBeTruthy();
    for (const o of occasions) expect(demoOccasionImages[o.id], o.id).toBeTruthy();
  });

  it.each(all)("$name exists, is WebP, has the slot's proportions and a sane weight", async ({ url, ratio }) => {
    const file = publicFile(url);
    expect(existsSync(file), `${url} is missing`).toBe(true);
    expect(url.endsWith(".webp")).toBe(true);
    const meta = await sharp(file).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width! / meta.height!).toBeCloseTo(ratio, 1);
    expect(meta.width!).toBeGreaterThanOrEqual(900); // sharp enough for a 2x phone
    expect(statSync(file).size, `${url} is heavy`).toBeLessThan(260 * 1024);
  });

  it("documents the source of every image in the credits file", () => {
    const credits = join(process.cwd(), "public/images/CREDITS.md");
    expect(existsSync(credits)).toBe(true);
    const text = readFileSync(credits, "utf8");
    for (const { url } of all) expect(text, `${url} has no credit line`).toContain(url.replace("/images/", ""));
  });
});
