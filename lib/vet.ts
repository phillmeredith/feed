/**
 * Editorial vetting for extracted article bodies.
 *
 * Publishers bolt commerce and engagement furniture onto their articles —
 * affiliate accessory lists, "let us know in the comments", newsletter pitches,
 * related-reading rails. Extraction keeps it because structurally it looks like
 * article content. This module removes it by what it *is* rather than by
 * matching one publisher's markup: heading intent, link density and link
 * destination.
 *
 * `auditArticleHtml` runs the same signals without editing, so the audit script
 * can report what would leak through before a reader ever sees it.
 */

/** Destinations that mark a link as commerce rather than reference. */
const COMMERCE_LINK =
  /amzn\.to|amazon\.[a-z.]+\/(dp|gp|s\?)|[?&]tag=[a-z0-9-]+-\d{2}|geni\.us|shareasale|skimresources|go\.redirectingat|bestbuy\.com|apple\.com\/(shop|store)|ebay\.[a-z.]+|awin1\.com|anrdoezrs|impact\.com|howl\.link|shop-links\.co/i;

/** Headings that begin a tail section rather than continue the article. */
const TAIL_HEADING =
  /^\s*((the\s+)?(best|top)\b.*\b(accessories|deals|picks|gifts|cases|chargers)|related|more from|you may also like|recommended|further reading|read more|see also|more coverage|editor'?s picks|shop|where to buy|our picks)\b/i;

/** Engagement prompts that are never part of the reporting. */
const CTA_TEXT =
  /let us know in the comments|tell us in the comments|what do you think\?|sound off in the comments|follow us on (twitter|x|facebook|instagram|threads|bluesky)|subscribe to (our|the)[^.]{0,40}(newsletter|channel|feed|podcast)|join our newsletter|sign up for (our|the)|add \w+ as a preferred source|support our journalism|become a (member|supporter)|for more videos\.?$/i;

const BLOCK = /<(p|li|ul|ol|div|h[2-6]|figure|blockquote)\b[^>]*>[\s\S]*?<\/\1>/gi;

/*
 * Publishers label their own promotional furniture in the markup — the class
 * and id attributes say "sponsored", "affiliate", "related", "newsletter".
 * Those attributes are the most reliable signal available, but sanitising
 * strips them, so this pass has to run on the raw extracted HTML first.
 */
const PROMO_ATTR =
  /\b(class|id)="[^"]*\b(sponsor\w*|promo\w*|advert\w*|\bads?\b|ad-(?:slot|unit|container|wrapper)|affiliate|partner-?(?:content|link)|newsletter|subscribe|signup|related-?(?:posts?|articles?|links?)|read-?more|inline-?cta|cta-|shortcode|widget|jetpack|outbrain|taboola)[^"]*"/i;

/** Marketing register, which reads nothing like reporting. */
const PROMO_COPY =
  /\b(get started here|free to use|pre-?vetted|competitive pricing|no sales calls|save \d+-\d+%|find a trusted|compare (?:quotes|prices) online|click here to|sign up (?:today|now)|limited time offer|exclusive discount)\b/i;

/** A paragraph whose whole job is pointing at another article. */
const STUB_LINK = /^\s*(read more|see also|related|more like this|watch)\s*:/i;

/**
 * Removes promotional nodes using the publisher's own markup, before that
 * markup is sanitised away. Also drops banner images, which are always a link
 * wrapping an image and never part of the reporting.
 */
/**
 * A promotional unit is a small part of a page, never most of it.
 *
 * Readability wraps its output in a container div, and this pass matched that
 * container — testing the whole article's text against the promo patterns, so
 * a single marketing phrase anywhere in a piece silently deleted the piece.
 * Electrek lost every article this way, and it cost the other feeds theirs
 * intermittently, depending on whether a stray phrase happened to appear.
 */
const WRAPPER_SHARE = 0.6;

export function stripPromotionalNodes(html: string): string {
  if (!html) return html;

  const whole = textOf(html).length;

  let out = html.replace(
    /<(div|section|aside|p|figure|ul)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
    (match, _tag: string, attrs: string, inner: string) => {
      const text = inner.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      // Anything holding most of the text is structure, not an advert.
      if (whole > 0 && text.length / whole > WRAPPER_SHARE) return match;
      if (PROMO_ATTR.test(`${attrs}`)) return "";
      if (PROMO_COPY.test(text)) return "";
      if (STUB_LINK.test(text)) return "";
      return match;
    }
  );

  // Banner ads: an anchor whose entire content is an image.
  out = out.replace(/<a\b[^>]*>\s*(?:<[^>]+>\s*)*<img\b[^>]*>\s*(?:<\/[^>]+>\s*)*<\/a>/gi, "");

  // Anything the publisher flagged to search engines as paid.
  out = out.replace(/<[^>]+rel="[^"]*sponsored[^"]*"[^>]*>[\s\S]*?<\/[a-z]+>/gi, "");

  return out;
}

function textOf(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function anchorTextOf(html: string) {
  const anchors = html.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) ?? [];
  return anchors.map(textOf).join(" ");
}

/**
 * A block that is mostly hyperlink is a navigation or shopping module, not
 * prose. Real paragraphs cite sources; they aren't built out of them.
 */
function isLinkFarm(html: string) {
  const text = textOf(html);
  if (text.length < 20) return false;

  const linkCount = (html.match(/<a\b/gi) ?? []).length;
  if (linkCount < 2) return false;

  const density = anchorTextOf(html).length / text.length;
  return density > 0.6;
}

function isJunkBlock(html: string) {
  const text = textOf(html);
  if (!text) return false;
  if (CTA_TEXT.test(text)) return true;
  if (COMMERCE_LINK.test(html) && isLinkFarm(html)) return true;
  if (isLinkFarm(html) && /\b(buy|shop|deal|discount|% off|only \$)\b/i.test(text)) {
    return true;
  }
  return false;
}

/**
 * Where the article genuinely ends.
 *
 * A "Related" or "Recommended" heading near the end marks the tail. The same
 * heading a few paragraphs in does not — Al Jazeera and others inject related
 * story blocks mid-article, and truncating there threw away most of the piece.
 * Only a marker in the closing stretch is treated as the end.
 */
const TAIL_ZONE = 0.65;

function tailStart(html: string): number {
  let cut = -1;

  for (const match of html.matchAll(/<h[2-6]\b[^>]*>([\s\S]*?)<\/h[2-6]>/gi)) {
    const start = match.index ?? 0;
    if (start < html.length * TAIL_ZONE) continue;
    if (TAIL_HEADING.test(textOf(match[1]))) {
      cut = start;
      break;
    }
  }

  // A commerce link farm near the end marks the same boundary.
  for (const match of html.matchAll(BLOCK)) {
    const start = match.index ?? 0;
    if (start < html.length * TAIL_ZONE) continue;
    if (COMMERCE_LINK.test(match[0]) && isLinkFarm(match[0])) {
      if (cut === -1 || start < cut) cut = start;
      break;
    }
  }

  return cut;
}

/**
 * Removes a related-stories module that sits inside the article: the heading
 * plus the list of links that follows it.
 */
function removeInlineRelated(html: string): string {
  return html.replace(
    /<h[2-6]\b[^>]*>([\s\S]*?)<\/h[2-6]>\s*(?:<(ul|ol|div|figure)\b[^>]*>[\s\S]*?<\/\2>\s*)?/gi,
    (match, heading: string) => (TAIL_HEADING.test(textOf(heading)) ? "" : match)
  );
}

export function vetArticleHtml(html: string): string {
  if (!html) return html;

  const cut = tailStart(html);
  let vetted = cut > 0 ? html.slice(0, cut) : html;

  vetted = removeInlineRelated(vetted);
  vetted = vetted.replace(BLOCK, (block) => (isJunkBlock(block) ? "" : block));

  // Unwrap any surviving commerce links so the text reads but doesn't sell.
  vetted = vetted.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (match, attrs: string, inner: string) =>
    COMMERCE_LINK.test(attrs) ? inner : match
  );

  vetted = vetted.replace(/(<p>\s*<\/p>|<li>\s*<\/li>|<ul>\s*<\/ul>)/gi, "");

  // Wrap tables so a wide spec table scrolls inside its own frame rather than
  // forcing the page sideways. Done after sanitising, so the markup is trusted.
  return vetted
    .replace(/<table\b/gi, '<div class="table-wrap"><table')
    .replace(/<\/table>/gi, "</table></div>")
    .trim();
}

export interface AuditIssue {
  kind: "commerce-link" | "cta-text" | "tail-section" | "link-farm";
  detail: string;
}

/** Reports what vetting would still let through. Used by `npm run audit`. */
export function auditArticleHtml(html: string): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const text = textOf(html);

  const commerce = html.match(new RegExp(COMMERCE_LINK, "gi"));
  if (commerce) {
    issues.push({ kind: "commerce-link", detail: commerce.slice(0, 3).join(", ") });
  }

  const cta = text.match(new RegExp(CTA_TEXT, "gi"));
  if (cta) issues.push({ kind: "cta-text", detail: cta.slice(0, 2).join(" / ") });

  for (const match of html.matchAll(/<h[2-6]\b[^>]*>([\s\S]*?)<\/h[2-6]>/gi)) {
    const heading = textOf(match[1]);
    if (TAIL_HEADING.test(heading)) {
      issues.push({ kind: "tail-section", detail: heading.slice(0, 50) });
      break;
    }
  }

  for (const match of html.matchAll(BLOCK)) {
    if (isLinkFarm(match[0])) {
      issues.push({ kind: "link-farm", detail: textOf(match[0]).slice(0, 50) });
      break;
    }
  }

  return issues;
}
