import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import { sanitizeArticleHtml, wordCount } from "./content.ts";
import { stripPromotionalNodes, vetArticleHtml } from "./vet.ts";

/**
 * Most publishers syndicate only a teaser to RSS (an audit put it at 4 feeds in
 * 36). The Dispatch is a personal reader, so it fetches the article page and
 * reads the body out of it — the same thing Instapaper or Readwise Reader do.
 *
 * This is why the deployment must stay access-protected: it is a reading tool
 * for one person, not a republisher.
 */
export interface Extracted {
  html: string;
  words: number;
  byline?: string;
  image?: string;
}

const BLOCKED = /ft\.com|economist\.com|science\.org|nature\.com|wsj\.com|bloomberg\.com/i;

export async function extractArticle(url: string): Promise<Extracted | null> {
  // Paywalled titles can't be read anyway; don't hammer them.
  if (BLOCKED.test(url) || /news\.google\.com/i.test(url)) return null;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    /*
     * Readability only needs the document structure, so stylesheets go before
     * parsing — it is faster and avoids CSS parsers choking on modern syntax.
     *
     * linkedom rather than jsdom: jsdom cannot be loaded in Vercel's runtime at
     * all (html-encoding-sniffer require()s an ES module and throws), which
     * took every dynamically rendered page down with a 500.
     */
    const html = (await res.text())
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi, "");

    const { document } = parseHTML(html);
    const article = new Readability(document as unknown as Document).parse();
    if (!article?.content) return null;

    const clean = vetArticleHtml(
      sanitizeArticleHtml(stripPromotionalNodes(article.content))
    );
    const words = wordCount(clean);
    if (words < 120) return null;

    // Readability has no lead-image field; take the first image in the body.
    const firstImage = clean.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];

    return {
      html: clean,
      words,
      byline: article.byline?.trim() || undefined,
      image: firstImage,
    };
  } catch {
    return null;
  }
}
