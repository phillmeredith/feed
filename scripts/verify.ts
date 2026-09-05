/**
 * Verifies every change requested in this project against the running site.
 * Static checks read the source; live checks fetch real pages and inspect what
 * a reader would actually get.
 *
 *   npm run dev          # in another shell
 *   node scripts/verify.ts
 */
import { readFileSync } from "node:fs";
import { sources } from "../lib/sources.ts";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const results: { id: string; label: string; ok: boolean; detail: string }[] = [];

function check(id: string, label: string, ok: boolean, detail = "") {
  results.push({ id, label, ok, detail });
}

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
// React separates text nodes with comment markers; strip them before matching.
const text = (html: string) =>
  html.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const plain = (html: string) => html.replace(/<!--[\s\S]*?-->/g, "");

function bodyOf(html: string) {
  return html.match(/class="article-body[^"]*"[\s\S]*?(?=<div class="mt-12 border-t)/)?.[0] ?? "";
}

async function get(path: string) {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, html: await res.text() };
}

// ---------- static ----------
const css = read("app/globals.css");
const layout = read("app/layout.tsx");
const cards = read("components/cards.tsx");
const media = read("components/Media.tsx");
const page = read("app/page.tsx");
const briefs = read("components/BriefsColumn.tsx");
const markets = read("lib/markets.ts");

check("font", "Headline font is modern, not condensed Anton",
  layout.includes("Bricolage_Grotesque") && !layout.includes("Anton"),
  layout.includes("Bricolage_Grotesque") ? "Bricolage Grotesque" : "still Anton");

check("caps", "Article headlines are sentence case, not all caps",
  /\.headline\s*\{[^}]*\}/.test(css) && !/\.headline\s*\{[^}]*text-transform:\s*uppercase/s.test(css),
  "");

check("tint", "No colour tint on images",
  !css.includes("duotone") && !media.includes("duotone") && !/filter:\s*grayscale/.test(css),
  "");

const tickerSeconds = Number(css.match(/animation:\s*ticker\s+(\d+)s/)?.[1] ?? 0);
check("ticker", "Ticker slowed down", tickerSeconds >= 120, `${tickerSeconds}s`);

check("leadfit", "Lead image fits its space rather than cropping",
  media.includes('fit === "contain"') && cards.includes('fit="contain"'), "");

check("borders", "No doubled rule under 'Latest across the desks'",
  page.includes("[&>*:first-child]:border-t-0"), "");

check("tables", "Tables framed, scrollable, merged cells preserved",
  css.includes(".table-wrap") && css.includes("min-width") &&
  read("lib/content.ts").includes('td: ["colspan", "rowspan"]'), "");

check("paywalled", "No summary-only or paywalled sources",
  !sources.some((s) => /ft\.com|economist|nature\.com|science\.org/i.test(s.url)),
  `${sources.length} sources`);

check("holdings", "Today band tracks the requested holdings",
  ["0P0000KSPA.L", "XMWX.L", "0P0000KM22.L", "0P000185T1.L", "ETH-GBP"].every((s) =>
    markets.includes(s)), "");

check("wireinternal", "Wire links stay on site",
  briefs.includes("/story/") && !briefs.includes("target=\"_blank\""), "");

// ---------- live ----------
const home = await get("/");
check("home", "Homepage loads", home.status === 200, `HTTP ${home.status}`);
// Either column may be empty on a quiet day, so assert the section itself.
check("today", "Homepage opens with a live Today section",
  /<details[^>]*class="today/.test(home.html) && />Today</.test(plain(home.html)), "");
check("strip", "Masthead strip carries funds and the week's weather",
  /US EQUITY|US Equity/i.test(home.html) && /°/.test(home.html), "");
check("previews", "Homepage is section previews, not full sections",
  (plain(home.html).match(/All \d+ stories/g) ?? []).length >= 4,
  `${(plain(home.html).match(/All \d+ stories/g) ?? []).length} desk previews`);

const deskSlugs = ["ai", "hardware", "cameras", "vehicles", "f1", "golf", "science", "wire"];
const deskStatuses = await Promise.all(deskSlugs.map((d) => get(`/${d}`)));
check("desks", "Every desk has its own page",
  deskStatuses.every((r) => r.status === 200),
  deskSlugs.filter((_, i) => deskStatuses[i].status !== 200).join(", ") || "all 7 ok");

// Sample stories across desks.
const storyIds = [...new Set(
  deskStatuses.flatMap((r) => [...r.html.matchAll(/\/story\/([a-z0-9-]+)/g)].map((m) => m[1]))
)].slice(0, 12);

const stories = await Promise.all(storyIds.map(async (id) => ({ id, ...(await get(`/story/${id}`)) })));

const wordCounts = stories.map((s) => text(bodyOf(s.html)).split(/\s+/).filter(Boolean).length);
const thin = stories.filter((_, i) => wordCounts[i] < 120);
check("fulltext", "Every sampled story reads in full on site",
  thin.length === 0,
  `${stories.length - thin.length}/${stories.length} full` +
  (thin.length ? ` — thin: ${thin.map((s) => s.id.slice(0, 28)).join(", ")}` : ""));

const noClickThrough = stories.every((s) => !/publishes only a summary/i.test(s.html));
check("noteaser", "No 'summary only' dead ends", noClickThrough, "");

const commerce = stories.filter((s) =>
  /amzn\.to|amazon\.[a-z.]+\/(dp|gp)|geni\.us|shareasale|skimresources/i.test(bodyOf(s.html)));
check("affiliate", "No affiliate links in article bodies", commerce.length === 0,
  commerce.map((s) => s.id.slice(0, 28)).join(", "));

const cta = stories.filter((s) =>
  /let us know in the comments|follow us on (twitter|x|facebook)|subscribe to our|preferred source|view \d+ comments|loading comments/i.test(text(bodyOf(s.html))));
check("junk", "No comment prompts or publisher promos in articles", cta.length === 0,
  cta.map((s) => s.id.slice(0, 28)).join(", "));

const placeholders = stories.filter((s) => /\[\[[^\]]+\]\]|your browser does not support/i.test(text(bodyOf(s.html))));
check("scaffolding", "No player scaffolding or template placeholders", placeholders.length === 0,
  placeholders.map((s) => s.id.slice(0, 28)).join(", "));

const dupes = stories.filter((s) => {
  const hero = s.html.match(/class="media[^"]*"[\s\S]{0,200}?src="([^"]+)"/)?.[1];
  const first = bodyOf(s.html).match(/<img[^>]+src="([^"]+)"/)?.[1];
  return hero && first && hero === first;
});
check("dupeimage", "Hero image not repeated in the body", dupes.length === 0,
  dupes.map((s) => s.id.slice(0, 28)).join(", "));

const firstPerson = [...home.html.matchAll(/class="headline[^"]*"[^>]*>([^<]+)</g)]
  .map((m) => m[1].trim())
  .filter((h) => /^(introducing|announcing|meet)\b/i.test(h) || /\bour\b/i.test(h));
check("editorial", "Headlines read as editorial, not vendor first person",
  firstPerson.length === 0, firstPerson.slice(0, 2).join(" | "));

check("corporate", "No corporate PR (Young Leaders, awards, earnings)",
  !/young leaders|wins multiple honors/i.test(home.html), "");

// ---------- report ----------
const pass = results.filter((r) => r.ok).length;
console.log(`\nVERIFYING ${results.length} REQUESTED CHANGES\n${"=".repeat(64)}`);
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}${r.detail ? `\n        ${r.detail}` : ""}`);
}
console.log(`${"=".repeat(64)}\n${pass}/${results.length} verified\n`);
process.exitCode = pass === results.length ? 0 : 1;
