import { cache } from "react";
import Parser from "rss-parser";
import type { Article, CategorySlug } from "./types";
import {
  editorialiseHeadline,
  removeDuplicateLeadImage,
  sanitizeArticleHtml,
  upgradeImage,
  wordCount,
} from "./content";
import { extractArticle } from "./extract";
import { fetchOgImage, isTrackingPixel, looksLowResolution } from "./content";
import { stripPromotionalNodes, vetArticleHtml } from "./vet";
import { sources, type Source } from "./sources";
import { archivedStory } from "./archive";
import unreadable from "../data/unreadable.json" with { type: "json" };

/** Stories known to defeat extraction; never published, never linked. */
const UNREADABLE = new Set<string>(unreadable.urls as string[]);

const REVALIDATE_SECONDS = 600;

/** Anything shorter isn't the article; extraction is tried instead. */
const MIN_BODY_WORDS = 130;

const parser: Parser<Record<string, unknown>, RawItem> = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["content:encoded", "contentEncoded"],
      ["source", "feedSource"],
    ],
  },
});

interface RawItem {
  title?: string;
  link?: string;
  isoDate?: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
  contentEncoded?: string;
  summary?: string;
  enclosure?: { url?: string };
  mediaContent?: { $?: { url?: string; medium?: string } };
  mediaThumbnail?: { $?: { url?: string } };
  feedSource?: string | { _?: string };
}

const SENSATIONAL =
  /\b(slams?|blasts?|shock(ing|ed)?|bombshell|fury|furious|savage|brutal|destroys?|humiliat\w*|meltdown|chaos|panic|outrage|erupts?|slammed|blasted|you won'?t believe|here'?s why you|goes viral|stuns?|stunned)\b/i;

export const RELEASE_TERMS =
  /\b(announce\w*|launch\w*|unveil\w*|introduc\w*|releas\w*|ships?|shipping|debut\w*|reveal\w*|now available|goes on sale|available now|first look|hands[- ]on|price[ds]?|specs?)\b/i;

/** Affiliate/deals posts and shopping roundups — not releases. */
const DEALS =
  /^green deals|\b\d+%\s*off\b|\bdeals?\b[^.]*\b(off|save|\$\d|£\d)|\b(save|off)\b[^.]*\bdeals?\b|\bbest (deals|prices)\b|\b(labor|labour) day (sale|deals)|\bprime day\b|\bblack friday\b|\bgiveaway\b/i;

/**
 * Corporate PR that shares a feed with product news — CSR programmes, award
 * ceremonies, appointments, earnings. None of it is a release.
 */
const CORPORATE_NOISE =
  /\b(young leaders|scholarship|fellowship|internship|volunteer\w*|donat\w*|charit\w*|philanthrop\w*|community (program|programme|outreach)|sustainability report|esg\b|diversity|inclusion|csr\b|wins? (multiple )?(honors|honours|awards?)|honou?red at|named (to|one of)|celebrat\w* (its )?\d+(th|st|nd|rd) anniversary|appoints?|appointment of|steps down|board of directors|quarterly (results|earnings)|earnings call|shareholders?|dividend)\b/i;

/** Streaming/entertainment noise that leaks out of consumer-tech feeds. */
const ENTERTAINMENT =
  /\b(trailer|season \d+|episode \d+|streaming|netflix|apple tv\+?|podcast|box office)\b/i;

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  quot: '"',
  apos: "'",
  lsquo: "'",
  rsquo: "'",
  ldquo: '"',
  rdquo: '"',
  hellip: "…",
  ndash: "–",
  mdash: "—",
  lt: "<",
  gt: ">",
};

function decodeEntities(input: string) {
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (match, name: string) =>
      NAMED_ENTITIES[name.toLowerCase()] ?? match
    );
}

function stripHtml(input: string) {
  return decodeEntities(input.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function cleanDek(input: string) {
  return stripHtml(input)
    .replace(/The post .+ appeared first on .+$/i, "")
    .replace(/\b(continue reading|read more|more…|more\.\.\.)\s*$/i, "")
    .replace(/\s*\|\s*$/, "")
    .trim();
}

function truncate(text: string, max = 180) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max).replace(/[,;:.\-–—]$/, "")}…`;
}

function cleanTitle(title: string) {
  // Google News appends " - Publisher" to every headline.
  return title.replace(/\s+-\s+[^-]{2,40}$/, "").trim();
}

function extractImage(item: RawItem): string | null {
  const media = item.mediaContent?.$;
  const html = item.contentEncoded || item.content || "";

  // In feed order of preference, skipping analytics beacons — several
  // publishers put a counter pixel ahead of the real artwork.
  const candidates = [
    media?.medium === "audio" ? null : media?.url,
    item.mediaThumbnail?.$?.url,
    item.enclosure?.url,
    ...[...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]),
  ];

  return candidates.find((url): url is string => Boolean(url) && !isTrackingPixel(url!)) ?? null;
}

function publisherOf(item: RawItem, fallback: string) {
  const raw = item.feedSource;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (raw && typeof raw === "object" && raw._) return raw._;
  return fallback;
}

async function fetchFeed(url: string): Promise<RawItem[]> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return [];
    const feed = await parser.parseString(await res.text());
    return feed.items ?? [];
  } catch {
    return [];
  }
}

function itemDate(item: RawItem) {
  const raw = item.isoDate || item.pubDate;
  const date = raw ? new Date(raw) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function ageInDays(date: Date) {
  return (Date.now() - date.getTime()) / 86_400_000;
}

/**
 * Recency dominates — this is a "what's new" page, so a fresh story from a
 * lesser outlet should outrank a fortnight-old one from a first-party source.
 */
function score(headline: string, weight: number, date: Date) {
  const freshness = Math.max(0, 1 - ageInDays(date) / 14) ** 1.5;
  const releaseBoost = RELEASE_TERMS.test(headline) ? 1.35 : 1;
  return (freshness * 24 + weight) * releaseBoost;
}

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with", "at",
  "by", "is", "its", "it", "as", "new", "this", "that", "from", "has", "have",
  "will", "can", "you", "your", "how", "why", "what", "after", "says", "said",
]);

function tokenize(headline: string) {
  return new Set(
    headline
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      // Normalise product codes so "xf400mmf4" and "xf400mm" match.
      .map((w) => w.replace(/mm[f\d]*$/, "mm"))
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  );
}

/**
 * Containment rather than plain Jaccard, so a terse headline still matches the
 * longer write-up of the same story.
 */
function similarity(a: Set<string>, b: Set<string>) {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / Math.min(a.size, b.size);
}

/** Re-desks stories that broad-remit outlets file under the wrong section. */
const ROUTES: [RegExp, CategorySlug][] = [
  [/\b(gpt|chatgpt|claude|gemini|llama|mistral|llm|openai|anthropic|deepmind|hugging face|copilot)\b/i, "ai"],
  [/\b(lens|mirrorless|medium format|\d+mm|f\/\d|camera sensor|photographer)\b/i, "cameras"],
  [/\b(electric (car|vehicle|suv|truck)|\bev\b|charging network|rivian|polestar)\b/i, "vehicles"],
];

function routeCategory(headline: string, source: Source): CategorySlug {
  if (!source.generalist) return source.category;
  for (const [pattern, category] of ROUTES) {
    if (pattern.test(headline)) return category;
  }
  return source.category;
}

/** FNV-1a — short, stable, dependency-free. */
function hash(input: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** Readable, stable, URL-safe id for a story page. */
function makeId(headline: string, url: string) {
  const slug = headline
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 9)
    .join("-");
  return `${slug || "story"}-${hash(url)}`;
}

function toArticle(item: RawItem, source: Source): Article | null {
  const title = item.title ? cleanTitle(stripHtml(item.title)) : "";
  const link = item.link;
  const date = itemDate(item);
  if (!title || !link || !date) return null;
  if (ageInDays(date) > 45) return null;
  if (SENSATIONAL.test(title) || DEALS.test(title) || CORPORATE_NOISE.test(title)) {
    return null;
  }

  const category = routeCategory(title, source);
  if (category === "hardware" && ENTERTAINMENT.test(title)) return null;

  const rawDek = cleanDek(item.contentSnippet || item.summary || item.content || "");

  // Many publishers syndicate the whole piece in content:encoded. Where they do,
  // the story page can read as an article rather than a stub.
  const body = vetArticleHtml(
    sanitizeArticleHtml(stripPromotionalNodes(item.contentEncoded || item.content || ""))
  );
  const words = wordCount(body);

  const publisher = publisherOf(item, source.name);
  const headline = editorialiseHeadline(title, publisher, source.firstParty ?? false);

  return {
    id: makeId(headline, link),
    category,
    headline,
    dek: truncate(rawDek),
    excerpt: truncate(rawDek, 600),
    body: words >= MIN_BODY_WORDS ? body : undefined,
    words: words >= MIN_BODY_WORDS ? words : undefined,
    source: publisher,
    url: link,
    // Thumbnail-only feeds, and any image that is plainly a thumbnail, are
    // dropped here so og:image enrichment can replace them below.
    image: (() => {
      if (source.thumbnailsOnly) return "";
      const upgraded = upgradeImage(extractImage(item) ?? "");
      return looksLowResolution(upgraded) ? "" : upgraded;
    })(),
    publishedAt: date.toISOString(),
  };
}

const MODEL_CODE = /^(?=.*[a-z])(?=.*\d)[a-z0-9]{4,}$/;

function sharesModelCode(a: Set<string>, b: Set<string>) {
  for (const token of a) {
    if (MODEL_CODE.test(token) && b.has(token)) return true;
  }
  return false;
}

function dedupe(articles: Article[], weightOf: Map<string, number>) {
  const seenUrl = new Set<string>();
  const kept: { article: Article; tokens: Set<string> }[] = [];

  for (const article of articles) {
    if (seenUrl.has(article.url)) continue;
    seenUrl.add(article.url);

    const tokens = tokenize(article.headline);
    const match = kept.find((k) => {
      if (k.article.category !== article.category) return false;
      const overlap = similarity(tokens, k.tokens);
      // A shared product code ("xf400mm", "gfx100") is strong evidence of the
      // same story even when the two outlets word the headline differently.
      return overlap >= 0.5 || (overlap >= 0.25 && sharesModelCode(tokens, k.tokens));
    });

    if (!match) {
      kept.push({ article, tokens });
      continue;
    }
    if (
      (weightOf.get(article.source) ?? 0) >
      (weightOf.get(match.article.source) ?? 0)
    ) {
      match.article = article;
      match.tokens = tokens;
    }
  }

  return kept.map((k) => k.article);
}

/** Keeps one outlet from filling a whole column or section. */
function perOutletLimit(max: number, scopeByCategory = false) {
  const counts = new Map<string, number>();
  return (article: Article) => {
    const key = scopeByCategory
      ? `${article.category}:${article.source}`
      : article.source;
    const seen = counts.get(key) ?? 0;
    if (seen >= max) return false;
    counts.set(key, seen + 1);
    return true;
  };
}

/**
 * Half the feeds ship no artwork, and a few ship 90px thumbnails. Both look
 * broken on a magazine front page, so the highest-ranked stories missing a
 * usable image get theirs from the article's own og:image tag. Capped, because
 * each one is an extra request — the stories further down get one when they
 * rise, or on their own page.
 */
const ARTWORK_BUDGET = 20;
const ARTWORK_BATCH = 10;

async function enrichArtwork(articles: Article[]) {
  const needing = articles.filter((a) => !a.image).slice(0, ARTWORK_BUDGET);

  for (let i = 0; i < needing.length; i += ARTWORK_BATCH) {
    const batch = needing.slice(i, i + ARTWORK_BATCH);
    const found = await Promise.all(batch.map((a) => fetchOgImage(a.url)));
    batch.forEach((article, j) => {
      if (found[j]) article.image = found[j];
    });
  }
}

/**
 * Checks the leading stories can actually be shown in full, and drops the ones
 * that can't. Capped, because each check is a fetch — stories below the cap are
 * verified when they rise into it, or when opened.
 */
/*
 * Verification costs one fetch and one parse per story, inside the request that
 * regenerates the page. At 150 stories that exceeded Vercel's function limits
 * and took the desk pages down, so it is capped hard and bounded by a deadline.
 * Stories below the cap are checked when opened instead.
 */
const VERIFY_BUDGET = 12;
const VERIFY_BATCH = 6;
const VERIFY_DEADLINE_MS = 8000;

async function verifyReadable(articles: Article[]): Promise<Article[]> {
  const head = articles.slice(0, VERIFY_BUDGET);
  const tail = articles.slice(VERIFY_BUDGET);
  const keep: Article[] = [];
  const deadline = Date.now() + VERIFY_DEADLINE_MS;

  for (let i = 0; i < head.length; i += VERIFY_BATCH) {
    if (Date.now() > deadline) {
      // Out of time: publish the rest unverified rather than fail the page.
      keep.push(...head.slice(i));
      break;
    }
    const batch = head.slice(i, i + VERIFY_BATCH);
    const results = await Promise.all(
      batch.map(async (article) => {
        if (article.body) return article;
        const extracted = await extractArticle(article.url);
        if (!extracted) return null;
        return {
          ...article,
          body: extracted.html,
          words: extracted.words,
          byline: extracted.byline,
          image: article.image || extracted.image || "",
        };
      })
    );
    for (const article of results) if (article) keep.push(article);
  }

  return [...keep, ...tail];
}

export interface FeedData {
  articles: Article[];
  /** The wire desk's stories, surfaced in the front-page rail. */
  briefs: Article[];
  lastUpdated: string;
}

/** Memoised per request, so the masthead and page body share one build. */
export const getFeed = cache(async function getFeed(): Promise<FeedData> {
  const articleBatches = await Promise.all(
    sources.map(async (source) => {
      const items = await fetchFeed(source.url);
      return items
        .slice(0, source.cap ?? 12)
        .map((item) => toArticle(item, source))
        .filter((a): a is Article => a !== null);
    })
  );

  const weightOf = new Map<string, number>();
  for (const s of sources) {
    weightOf.set(s.name, Math.max(weightOf.get(s.name) ?? 0, s.weight));
  }

  const scoreOf = new Map<string, number>();
  const flat = articleBatches.flat();
  articleBatches.forEach((batch, i) => {
    for (const article of batch) {
      scoreOf.set(
        article.url,
        score(article.headline, sources[i].weight, new Date(article.publishedAt))
      );
    }
  });

  const articles = dedupe(flat.filter((a) => !UNREADABLE.has(a.url)), weightOf)
    .sort((a, b) => (scoreOf.get(b.url) ?? 0) - (scoreOf.get(a.url) ?? 0))
    .filter(perOutletLimit(3, true));

  await enrichArtwork(articles);

  // The hard rule, enforced before anything reaches a listing: the stories most
  // likely to be read are checked now, and any that can't be shown in full are
  // dropped rather than published as a dead end. The extracted body is kept, so
  // opening one of them costs nothing.
  const verified = await verifyReadable(articles);

  // Feature the strongest story in each of the four release-led categories.
  const featureOrder: CategorySlug[] = ["ai", "hardware", "cameras", "vehicles"];
  for (const category of featureOrder) {
    const top = verified.find((a) => a.category === category);
    if (top) top.featured = true;
  }

  // The wire is a desk like any other, so its items are full stories with
  // pages of their own — nothing in the rail leaves the site.
  const briefs = verified
    .filter((a) => a.category === "wire")
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .filter(perOutletLimit(2))
    .slice(0, 8);

  return { articles: verified, briefs, lastUpdated: new Date().toISOString() };
});

export async function getDesk(category: CategorySlug) {
  const { articles } = await getFeed();
  return articles.filter((a) => a.category === category);
}

export async function getStory(id: string) {
  const { articles } = await getFeed();
  // Fall back to the archive: most stories outlive their publisher's feed.
  const story = articles.find((a) => a.id === id) ?? archivedStory(id);
  if (!story) return null;

  // The hard rule: a story page always carries the whole piece. Where the feed
  // gave only a teaser, read the article itself. Done on demand rather than at
  // ingest, so only stories actually opened are fetched.
  let full: Article = story;
  if (!story.body) {
    const extracted = await extractArticle(story.url);
    if (extracted) {
      full = {
        ...story,
        body: extracted.html,
        words: extracted.words,
        byline: extracted.byline,
        image: story.image || extracted.image || "",
      };
    }
  }

  // The lead image is displayed above the headline, so strip the body's copy.
  if (full.body && full.image) {
    full = { ...full, body: removeDuplicateLeadImage(full.body, full.image) };
  }

  const related = articles
    .filter((a) => a.category === story.category && a.id !== story.id)
    .slice(0, 5);

  return { story: full, related };
}
