# The Dispatch

An editorial-style front page for new releases across AI models, consumer hardware,
cameras and lenses, electric vehicles, sport (F1 and golf) and science — plus a
measured news wire and local weather. One page instead of thirty tabs.

## How it works

There is no database and no cron job. The page is a server component that fetches
every RSS feed in parallel on request, and Next.js caches the result:

```
lib/sources.ts   feed list, per-desk, with editorial weights and per-feed caps
lib/feed.ts      fetch → normalise → filter → de-duplicate → rank
lib/weather.ts   Open-Meteo current conditions and five-day forecast (no API key)
app/page.tsx     assembles the front page, revalidates every 30 minutes
```

Each item passes through a few editorial filters before it can appear:

- **Sensationalism** — tabloid verbs ("slams", "bombshell", "fury") are dropped.
- **Deals** — affiliate and discount roundups are dropped; they are not releases.
- **Re-desking** — broad outlets get their stories routed to the right section, so
  a 9to5Mac piece about GPT-6 files under AI Models rather than Hardware.
- **De-duplication** — the same story from several outlets collapses to one, with
  a shared product code ("xf400mm") treated as strong evidence of a match. The
  highest-weighted source wins.
- **Ranking** — recency dominates, with a boost for genuine launch language
  ("announces", "unveils", "now available").
- **Diversity** — no outlet may take more than three slots in a section, or two in
  the news wire.

## Running it

```bash
npm run dev
```

## Maintaining the feeds

Feeds break, move and start returning 403s. This checks all of them at once:

```bash
npm run check-feeds
```

Anything marked `BROKEN` needs a new URL in `lib/sources.ts` or should be removed.
For outlets with no usable RSS (Anthropic, Mistral), the list uses a Google News
search feed as a stand-in — a pattern worth reusing for any new source that lacks
a feed of its own.

## Configuration

Weather defaults to Newcastle upon Tyne. Override with environment variables:

```
WEATHER_LOCATION="Newcastle upon Tyne"
WEATHER_LAT=54.9783
WEATHER_LON=-1.6178
```

## Deploying

```bash
vercel        # preview deployment
vercel --prod # production
```

No environment variables are required for a default deploy — every data source is
public and keyless.
