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

## The desk and the archive

A desk shows two pages — forty-eight stories — and no more. Everything older
is still here, under that desk's Archive tab, which is also where a story goes
the moment you file it by hand:

```
lib/archive.ts        the store, the two-page cut, and the trim to listing size
app/[desk]/archive/   one morgue per desk, grouped by month
```

Filing a story is the reader's own record, kept in `localStorage` and sent
nowhere — there is no account here and no database. One control does it: the
**Archive this** button beside the headline on a story's own page. Nothing is
filed automatically, and no card carries a control of its own — you file a
story from the story. Filed stories drop out of the front page, the section
fronts and the desks, and turn up in the archive instead, where **put back**
returns them.

Because every page is cached HTML shared by all readers, none of that can
happen on the server. Each group of slots on a page is drawn with two or three
reserves behind it — stories nothing else on the page is using — and the
browser decides which of them a particular reader sees:

```
components/Reading.tsx   the record, the control, and the folio's tally
components/Slots.tsx     shows the first N children the reader hasn't filed
```

Read a group's bench dry and the page falls back to its own pick, because a
front page with holes in it is worse than one you have already seen.

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

## Keeping it fast

Every page here is meant to be served from the edge, with the ten-minute cron
above eating the rebuilds. The site's one recurring bug is a page quietly
falling out of that arrangement — reading a query string, or being a dynamic
segment with no `generateStaticParams` — which costs every reader a full
render: forty feeds, extraction and artwork, three to seven seconds. It still
works, so it ships unnoticed, and the warm cron then warms nothing, because a
per-request page has no cache to warm.

It was found and fixed by hand three times before there was a check for it:

```bash
npm run build && npm run routes:check
```

That fails if any page renders per request without being named, with its
reason, in `DELIBERATE` in `scripts/check-routes.ts` — and warns if a desk has
been added without being added to the refresh workflow's warm list.

It runs in two places, deliberately. `deploy.yml` runs it between building and
shipping, so a regression stops before it reaches readers. `routes.yml` runs it
on every push and pull request, because Deploy needs Vercel credentials and
this does not — and a deploy workflow that cannot authenticate fails in ten
seconds and takes every check inside it down with it.

## Deploying

Production is shipped by `.github/workflows/deploy.yml`, not by Vercel's Git
integration — that integration stopped producing builds, and commits sat on
`main` undeployed without anything saying so. The workflow runs on a push to
`main`, from the Actions tab by hand, and after the daily store update, which a
push trigger cannot catch: a commit made with `GITHUB_TOKEN` never starts
another workflow, and the model, gear and F1 pages are prerendered from those
stores.

It needs three repository secrets, under Settings › Secrets and variables ›
Actions:

```
VERCEL_TOKEN       vercel.com/account/tokens
VERCEL_ORG_ID      project settings, or .vercel/project.json after `vercel link`
VERCEL_PROJECT_ID  the same two places
```

From a terminal it is still just:

```bash
vercel        # preview deployment
vercel --prod # production
```

No application environment variables are required — every data source is public
and keyless.
