// Lists every TODO_OWNER placeholder in src/data. Exits 1 if any remain and
// --strict is passed (used by the production build gate).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../src/data", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
// Strict (build fails) when asked explicitly, on a Vercel production deploy, or with RR_LAUNCH=1.
const strict = process.argv.includes("--strict") || process.env.VERCEL_ENV === "production" || process.env.RR_LAUNCH === "1";
const hits = [];

const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|json)$/.test(name)) {
      readFileSync(p, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if ((line.includes("TODO_OWNER") || line.includes("confirmed: false")) && !/^\s*(\/\/|\*|\/\*)/.test(line) && !line.includes("export const TODO_OWNER") && !line.includes("export type Todo")) {
            hits.push(`${name}:${i + 1}  ${line.trim().slice(0, 110)}`);
          }
        });
    }
  }
};
walk(root);

console.log(hits.length ? hits.join("\n") : "No TODO_OWNER placeholders.");
console.log(`\n${hits.length} placeholder line(s).`);

// Demo mode ships fake prices, a fake admin login and browser-only orders: never in a launch build.
const demoOn = process.env.NEXT_PUBLIC_DEMO_MODE !== "0";
if (demoOn) console.log("Demo mode is ON (NEXT_PUBLIC_DEMO_MODE is not 0): placeholder prices, demo admin and browser-only orders are active.");

if (strict && (hits.length || demoOn)) {
  if (hits.length) console.error("Refusing to build for launch while TODO_OWNER placeholders or unconfirmed content remain.");
  if (demoOn) console.error("Refusing to build for launch with demo mode on: set NEXT_PUBLIC_DEMO_MODE=0 after the real admin and backend exist.");
  process.exit(1);
}
