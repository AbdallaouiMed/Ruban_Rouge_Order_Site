import { describe, expect, it } from "vitest";
import fr from "../../messages/fr.json";
import en from "../../messages/en.json";
import ar from "../../messages/ar.json";

type Tree = { [k: string]: string | Tree };
const keys = (o: Tree, prefix = ""): string[] =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === "string" ? [prefix + k] : keys(v, `${prefix}${k}.`)));
const leaves = (o: Tree): [string, string][] =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === "string" ? [[k, v] as [string, string]] : leaves(v)));
// Matches `{name}` and `{name, plural, ...}` but not plural branch labels like `one {# item}`.
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\s*[,}]/g)].map((m) => m[1]).sort().join(",");

describe("translations", () => {
  const base = keys(fr as Tree).sort();

  it.each([
    ["en", en],
    ["ar", ar],
  ])("%s has exactly the same keys as fr", (_l, messages) => {
    expect(keys(messages as Tree).sort()).toEqual(base);
  });

  it("uses the same ICU placeholders in every language", () => {
    const flat = (m: Tree) => Object.fromEntries(keys(m).map((k) => [k, k.split(".").reduce<string | Tree>((a, p) => (a as Tree)[p], m) as string]));
    const [f, e, a] = [flat(fr as Tree), flat(en as Tree), flat(ar as Tree)];
    for (const k of base) {
      expect(placeholders(e[k]), `en ${k}`).toBe(placeholders(f[k]));
      expect(placeholders(a[k]), `ar ${k}`).toBe(placeholders(f[k]));
    }
  });

  it("has no empty strings", () => {
    for (const m of [fr, en, ar]) for (const [k, v] of leaves(m as Tree)) expect(v.trim(), k).not.toBe("");
  });
});
