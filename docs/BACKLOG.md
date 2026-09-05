# The Dispatch — running backlog

The hard rule, which everything else serves:

> A reader must be able to read everything in full on this site. They never
> click through to a third party. No page carries junk from comments, adverts
> or affiliate rails. Every page should read as though an editorial team
> curated it.

Enforced by scripts, not by memory:

| Command | What it proves |
|---|---|
| `npm run verify` | Every change requested in this project, checked against the running site. 22/22 passing. |
| `npm run validate` | Every source can be shown in full. Fails the build if one regresses. |
| `npm run check-images` | Artwork dimensions per source, so thumbnails can't creep back. |
| `npm run check-feeds` | Feed health, for when a publisher moves a URL. |

## Done

| # | Change | Where |
|---|---|---|
| 1 | Dark editorial redesign (Off Crypto reference) | `app/globals.css` |
| 2 | Each desk its own page; homepage previews only | `app/[desk]`, `app/page.tsx` |
| 3 | Spacious story pages | `app/story/[id]` |
| 4 | Headline face swapped off condensed Anton to Bricolage Grotesque, sentence case | `globals.css`, `cards.tsx` |
| 5 | Colour tint removed from all images | `components/Media.tsx` |
| 6 | Ticker slowed (48s → 150s) | `globals.css` |
| 7 | Sport image quality — BBC 240px thumbnails upgraded to 976px | `lib/content.ts` |
| 8 | Science image quality — 90px thumbnails discarded for og:image | `lib/feed.ts` |
| 9 | Lead image no longer cropped to fit | `Media.tsx` (`fit="contain"`) |
| 10 | Double border under "Latest across the desks" | `app/page.tsx` |
| 11 | Tables: framed, spaced, merged cells preserved, scroll inside own frame | `globals.css`, `lib/vet.ts` |
| 12 | DPReview promo footer and comment scaffolding stripped | `lib/content.ts` |
| 13 | Samsung trademark glyphs and footnote links stripped | `lib/content.ts` |
| 14 | DeepMind audio-player scaffolding and `[[placeholders]]` stripped | `lib/content.ts` |
| 15 | Hero image no longer repeats as first body image | `lib/content.ts` |
| 16 | Vendor first-person headlines re-voiced editorially | `lib/content.ts` |
| 17 | Corporate PR filtered (Samsung Young Leaders, awards, earnings) | `lib/feed.ts` |
| 18 | Full article text on every story page | `lib/extract.ts` |
| 19 | Paywalled/summary-only sources dropped, full-text ones swapped in | `lib/sources.ts` |
| 20 | The Wire made a real desk — its links stay on site | `lib/feed.ts`, `BriefsColumn.tsx` |
| 21 | Vetting layer: affiliate rails, link farms, comment prompts | `lib/vet.ts` |
| 22 | Homepage "Today" band — weather plus tracked funds and ETH | `components/TodayBand.tsx` |
| 23 | Systematic vetting rather than per-site patches: link density, commerce destinations, tail-section detection | `lib/vet.ts` |
| 24 | Readability verified at ingest — an unreadable story never reaches a listing | `lib/feed.ts` |

## Patents — waiting on a free key

USPTO retired its keyless APIs in 2025. The old PatentsView (`api.patentsview.org`)
and `developer.uspto.gov/ds-api` hosts now redirect to a transition guide, and
everything runs through the Open Data Portal, which returns 401 without a key.
EPO's OPS is the same. Patent-news feeds (IPWatchdog, JUVE) cover IP law rather
than filings by manufacturer, so they don't answer the question.

The client is written and wired into the hardware, robotics and cameras desks;
it returns nothing and renders nothing until a key exists.

1. Get a free key at https://data.uspto.gov
2. `USPTO_API_KEY=xxxx npm run patents:check` — proves the response shape
3. Add `USPTO_API_KEY` in the Vercel project settings

## Open — needs a decision from you

| # | Item | Blocker |
|---|---|---|
| A | Relevant social posts at the foot of the story sidebar | X/Twitter search needs a paid API tier (~$100/mo). Bluesky's public API is free and would work today. Which? |
| B | Camera directory: bodies by brand in release order → that body's lenses (OEM vs third party) → reviews and trusted YouTube reviews | No feed provides this. Needs a curated dataset I seed and maintain, plus a YouTube Data API key (free tier) for the video links. Sizeable feature — worth scoping on its own. |

## Open — mine to finish

| # | Item |
|---|---|
| C | Confirm fund prices resolve from Vercel (Yahoo rate-limits my local IP) |
| D | Commit the work and promote to production with access protection left on |
| E | Fund prices: confirm Yahoo resolves from Vercel's IPs (local IP is rate-limited) |
