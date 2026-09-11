/**
 * Fails the build when a page has quietly stopped being cached.
 *
 * This site's one recurring performance bug has had the same shape every time.
 * A route does something that makes Next render it per request — reads a query
 * string, or is a dynamic segment with no `generateStaticParams` — and nothing
 * says so. The page still works, so nobody notices; it just costs three to
 * seven seconds of feed fetching for every reader instead of being served from
 * the edge, and the ten-minute warm cron quietly warms nothing, because a
 * per-request page has no cache to warm.
 *
 * It has been found and fixed by hand three times: the desk pages, the story
 * pages, and then the games directory and the paged desks together. Each fix
 * was correct and none of them stopped the next one, because the thing that
 * was missing was not a fix but a check.
 *
 * So: after a build, every page route must appear in the prerender manifest —
 * as a prerendered path or as an ISR dynamic route. Anything that does not is
 * rendered per request, and has to be named below with a reason.
 *
 *   npm run build && npm run routes:check
 */
import { readFileSync } from "node:fs";
import { categories, groups } from "../lib/categories.ts";

/**
 * Routes that are rendered per request on purpose.
 *
 * The bar for this list is not "it is dynamic" — it is "it is dynamic AND a
 * render is cheap". A route here must not touch `getFeed`: forty RSS feeds and
 * their extraction is the cost that makes an uncached page unbearable, and any
 * route paying it per reader is a bug however deliberate the dynamism.
 */
const DELIBERATE: Record<string, string> = {
  "/games":
    "Reads the filter query string, which opts a route out of caching. Kept " +
    "that way on purpose: the directory works with no JavaScript and a " +
    "filtered view is a link you can send. It reads the games store and " +
    "nothing else — no feed — which took it from six seconds to under one. " +
    "It is still the slowest page on the site, because an uncached route " +
    "pays a cold start the edge would have absorbed; that is the price of " +
    "the query string, and it is worth it here and nowhere else.",
};

/** Route handlers are not pages and have no business being prerendered. */
const isApi = (route: string) => route.startsWith("/api/");

/**
 * The other half of the same bug.
 *
 * A page can be cached and still be slow for the reader who happens to arrive
 * first after the window turns over — that is what the ten-minute warm cron is
 * for. Its list of paths is written out by hand in the workflow, and it has
 * drifted behind the site twice: the gaming desk was added, never added there,
 * and shipped cold. The desks are enumerated in `lib/categories.ts`, so the
 * drift is checkable.
 *
 * A warning rather than a failure: a cold page costs one reader one rebuild,
 * which is a different order of problem from a page that is never cached at
 * all, and a deploy should not be blocked on it.
 */
function warmCoverage() {
  const workflow = ".github/workflows/refresh.yml";
  let yaml: string;
  try {
    yaml = readFileSync(workflow, "utf8");
  } catch {
    console.warn(`Can't read ${workflow} — skipping the warm-list check.`);
    return;
  }

  const list = /for path in ([^;]*);/.exec(yaml);
  if (!list) {
    console.warn(
      `Can't find the path list in ${workflow} — if its shape changed, update` +
        " the pattern in scripts/check-routes.ts."
    );
    return;
  }

  const warmed = new Set(
    list[1]
      .split(/\s+/)
      .map((path) => path.replace(/^"|"$/g, "").trim())
      .map((path) => `/${path.replace(/^\//, "")}`)
  );

  const wanted = [
    "/",
    ...groups.map((group) => `/${group.slug}`),
    ...categories.flatMap((c) => [`/${c.slug}`, `/${c.slug}/archive`]),
  ];

  const cold = wanted.filter((path) => !warmed.has(path));
  if (cold.length > 0) {
    console.warn(
      `\n${cold.length} page(s) the refresh cron never warms: ${cold.join(", ")}`
    );
    console.warn(`Add them to the path list in ${workflow}.\n`);
  }
}

const manifest = (name: string) => {
  try {
    return JSON.parse(readFileSync(`.next/${name}`, "utf8"));
  } catch {
    console.error(
      `Can't read .next/${name} — run \`npm run build\` before this check.`
    );
    process.exit(1);
  }
};

const prerender = manifest("prerender-manifest.json") as {
  routes: Record<string, unknown>;
  dynamicRoutes: Record<string, unknown>;
};
const appPaths = manifest("app-path-routes-manifest.json") as Record<
  string,
  string
>;

const cached = new Set([
  ...Object.keys(prerender.routes ?? {}),
  ...Object.keys(prerender.dynamicRoutes ?? {}),
]);

const pages = Object.entries(appPaths)
  .filter(([file]) => file.endsWith("/page"))
  .map(([, route]) => route)
  .filter((route) => !isApi(route));

const uncached = pages.filter((route) => !cached.has(route));
const unexpected = uncached.filter((route) => !(route in DELIBERATE));
const expected = uncached.filter((route) => route in DELIBERATE);

warmCoverage();

console.log(`${pages.length} page routes, ${cached.size} cache entries`);
for (const route of expected) {
  console.log(`  per request, by design: ${route}`);
}

if (unexpected.length === 0) {
  console.log("Every other page is served from the cache.");
  process.exit(0);
}

console.error("");
console.error(
  `${unexpected.length} page route(s) render per request and shouldn't:`
);
for (const route of unexpected) console.error(`  ${route}`);
console.error("");
console.error("Each one costs every reader a full render — on this site that");
console.error("means forty RSS feeds, extraction and artwork, three to seven");
console.error("seconds, and the refresh cron cannot warm it. Usually one of:");
console.error("");
console.error("  · the page reads `searchParams` — put the state in the path");
console.error("    instead, the way /cameras/page/2 does;");
console.error("  · a dynamic segment has no `generateStaticParams` — declare");
console.error("    it, returning [] if the paths aren't known at build time;");
console.error("  · something calls `cookies()`, `headers()` or sets");
console.error("    `dynamic = 'force-dynamic'`.");
console.error("");
console.error("If it is deliberate and a render is genuinely cheap, add it to");
console.error("DELIBERATE in scripts/check-routes.ts with the reason.");
process.exit(1);
