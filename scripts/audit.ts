/**
 * Scans published story pages for anything that shouldn't be in an article:
 * adverts, affiliate rails, comment prompts, player scaffolding, related-link
 * stubs, tracking images, or a body too thin to count as the whole piece.
 *
 * This is the systematic check behind the site's editorial rule — new junk
 * shows up here rather than on the page.
 *
 *   npm run dev      # in another shell
 *   npm run audit
 */
import { readFileSync, writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const RECORD = process.argv.includes("--record");
const STORE = new URL("../data/unreadable.json", import.meta.url);
const DESKS = ["ai", "hardware", "cameras", "vehicles", "sports", "science", "robotics", "screen", "wire"];
const PER_DESK = Number(process.env.AUDIT_PER_DESK ?? 4);

const CHECKS: [string, RegExp][] = [
  // "sponsored by X" inside a piece about a programme is disclosure, not an
  // advert. Only promotional framing counts.
  ["advert", /energysage|outbrain|taboola|sponsored (content|post|link)|this post is sponsored|advertisement/i],
  ["affiliate", /amzn\.to|amazon\.[a-z.]+\/(dp|gp)|geni\.us|shareasale|skimresources|howl\.link/i],
  ["promo copy", /get started here|free to use|pre-?vetted|no sales calls|save \d+-\d+%|sign up (today|now)/i],
  ["comment prompt", /let us know in the comments|view \d+ comments|loading comments|forum view/i],
  ["publisher plug", /preferred source|subscribe to (our|the)|follow us on (twitter|x|facebook)|become a (member|supporter)/i],
  ["scaffolding", /your browser does not support|listen to this article|\[\[[^\]]+\]\]|enable javascript/i],
  ["related stub", /^\s*(read more|see also|related)\s*:/im],
];

const text = (html: string) =>
  html.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

function bodyOf(html: string) {
  return html.match(/class="article-body[^"]*"[\s\S]*?(?=<div class="mt-12 border-t)/)?.[0] ?? "";
}

const stories = new Map<string, string>();
const sourceUrls = new Map<string, string>();
for (const desk of DESKS) {
  const html = await (await fetch(`${BASE}/${desk}`)).text();
  const ids = [...new Set([...html.matchAll(/\/story\/([a-z0-9-]+)/g)].map((m) => m[1]))];
  for (const id of ids.slice(0, PER_DESK)) stories.set(id, desk);
}

console.log(`auditing ${stories.size} stories across ${DESKS.length} desks\n`);

let clean = 0;
const problems: string[] = [];

for (const [id, desk] of stories) {
  const page = await (await fetch(`${BASE}/story/${id}`)).text();
  const body = bodyOf(page);
  const plain = text(body);
  const words = plain.split(/\s+/).filter(Boolean).length;

  const hits = CHECKS.filter(([, re]) => re.test(body) || re.test(plain)).map(([n]) => n);
  if (words < 120) hits.push(`thin (${words}w)`);
  // A trailing image is only suspicious when it is a link — that is a banner.
  // A bare closing photograph is normal in a product story.
  if (/<a\b[^>]*>\s*(?:<[^>]+>\s*)*<img[^>]*>[\s\S]{0,80}$/i.test(body.trim())) {
    hits.push("trailing banner");
  }

  // Record the source URL so an unreadable story can be filtered for good.
  if (words < 120) {
    const href = page.match(/href="(https?:\/\/[^"]+)"[^>]*class="kicker[^"]*inline-block bg-accent/)
      ?? page.match(/Open at [^<]*<\/a>/);
    const openAt = page.match(/<a href="(https?:\/\/[^"]+)"[^>]*target="_blank"/);
    if (openAt) sourceUrls.set(id, openAt[1]);
  }

  if (hits.length === 0) {
    clean += 1;
  } else {
    problems.push(`  ${desk.padEnd(9)} ${id.slice(0, 44).padEnd(46)} ${hits.join(", ")}`);
  }
}

if (problems.length) {
  console.log("PROBLEMS");
  console.log(problems.join("\n"));
}
console.log(`\n${clean}/${stories.size} stories clean`);

if (RECORD && sourceUrls.size) {
  const store = JSON.parse(readFileSync(STORE, "utf8")) as { note: string; urls: string[] };
  const urls = new Set(store.urls);
  for (const url of sourceUrls.values()) urls.add(url);
  writeFileSync(STORE, `${JSON.stringify({ ...store, urls: [...urls] }, null, 2)}\n`);
  console.log(`recorded ${sourceUrls.size} unreadable source URL(s); ${urls.size} total`);
}

process.exitCode = problems.length ? 1 : 0;
