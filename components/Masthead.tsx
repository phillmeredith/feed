import Link from "next/link";
import { navItems } from "@/lib/categories";
import { getMarkets, formatPrice, staleness } from "@/lib/markets";
import { getWeather } from "@/lib/weather";
import { SITE_TIME_ZONE } from "@/lib/format";
import { Dateline } from "./Dateline";
import { MobileNav } from "./MobileNav";

/*
 * The paper has been publishing daily since the repository's first commit, so
 * the issue number is simply how many days that is. It is furniture rather
 * than data — but furniture that counts something real, which is the only
 * kind worth printing.
 */
const FIRST_ISSUE = Date.UTC(2026, 8, 4);

function issueNumber() {
  const today = new Date();
  const days = Math.floor(
    (Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) -
      FIRST_ISSUE) /
      86_400_000
  );
  return Math.max(1, days + 1);
}

function editionDate() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: SITE_TIME_ZONE,
  });
}

function Change({ pct }: { pct: number }) {
  const flat = Math.abs(pct) < 0.005;
  return (
    <span className={flat ? "text-faint" : pct > 0 ? "text-positive" : "text-negative"}>
      {flat ? "—" : `${pct > 0 ? "▲" : "▼"}${Math.abs(pct).toFixed(2)}%`}
    </span>
  );
}

/**
 * The masthead.
 *
 * There was a nameplate band here for a while — the name set across the whole
 * sheet at 130px with the date on one rail and the issue on the other, which
 * is what a broadsheet does because a broadsheet is bought off a newsstand and
 * has to be recognised at four feet. A reader arriving at a URL has already
 * chosen the paper. That band cost the top third of the first screen and
 * bought nothing, so it is gone: one line carrying the name, the desks and the
 * date, and then straight into the fold.
 *
 * The same band on every page, front and interior. The old `compact` variant
 * existed to shrink the nameplate on the way in; with nothing left to shrink,
 * there is one masthead and it is this one.
 */
export async function Masthead({
  stories,
}: {
  /** Filed today, for the right-hand rail. The front page is the only page
      that has already counted them, so everywhere else simply omits it. */
  stories?: number;
}) {
  /*
   * The dateline used to be seeded from the feed's build time, which meant
   * every page that carries a masthead — including a static entity page — had
   * to run the whole fifty-feed pipeline first. Since the dateline now follows
   * the reader's own clock after mount, render time is a perfectly good seed,
   * and entity pages cost a render instead of a crawl.
   */
  const [markets, weather] = await Promise.all([getMarkets(), getWeather()]);
  const lastUpdated = new Date().toISOString();

  return (
    <header>
      {/*
        * The utility strip: conditions on the left, the day's numbers running
        * through the middle, the clock on the right. It is the thinnest band
        * on the page and carries the most volatile things on it, which is the
        * arrangement every front page has settled on independently.
        */}
      <div className="sheet border-b border-rule">
        <div className="flex items-baseline gap-8 py-2.5 kicker text-micro font-medium tracking-[0.08em] text-faint">
          {weather && (
            <span className="shrink-0 whitespace-nowrap">
              {/* The place is only worth naming where there is room for it —
                  on a phone the whole strip is the reader's own weather and
                  the town's name pushes the clock off the right edge. */}
              <span className="hidden sm:inline">{weather.location} · </span>
              {weather.tempC}° · {weather.condition}
            </span>
          )}

          <div className="hidden md:flex min-w-0 flex-1 overflow-hidden">
            <div className="ticker-track flex shrink-0 whitespace-nowrap">
              {[0, 1].map((pass) => (
                <span key={pass} className="flex shrink-0">
                  {markets.map((quote) => (
                    <span key={`${pass}-${quote.symbol}`} className="pr-8">
                      {quote.label} {formatPrice(quote)}{" "}
                      <Change pct={quote.changePct} />
                      {/* A fund that struck on Friday shouldn't read as today. */}
                      {staleness(quote) && (
                        <span className="text-faint"> {staleness(quote)}</span>
                      )}
                    </span>
                  ))}

                  {weather?.forecast.map((day) => (
                    <span key={`${pass}-${day.day}`} className="pr-8">
                      {day.day} {day.high}°/{day.low}° {day.condition}
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>

          <span className="ml-auto shrink-0 md:ml-0">
            <Dateline since={lastUpdated} />
          </span>
        </div>
      </div>

      <div className="sheet">
        {/*
          * Name, desks, date — one line. The nav is centred in the row rather
          * than packed against the name, so the row still reads as a masthead
          * and not as a toolbar, and it scrolls rather than wraps on a narrow
          * screen for the reason every nav on this site does: a wrapped row
          * separates the marker from the rule it is measured against.
          */}
        <div className="flex items-center gap-6 py-4">
          <Link href="/" className="story shrink-0">
            <h1 className="nameplate text-[clamp(1.5rem,2.1vw,2.1rem)] whitespace-nowrap">
              The Dispatch
            </h1>
          </Link>

          <nav
            aria-label="Desks"
            className="nav-scroll hidden lg:flex min-w-0 flex-1 justify-center"
          >
            <div className="flex gap-[clamp(18px,2.6vw,44px)] font-meta text-[12px] font-semibold uppercase tracking-[0.22em] whitespace-nowrap">
              {navItems().map((item) => (
                <Link
                  key={item.slug}
                  href={`/${item.slug}`}
                  className="text-muted transition-colors hover:text-accent"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <p className="ml-auto hidden shrink-0 text-right kicker text-micro font-medium tracking-[0.14em] text-faint sm:block lg:ml-0">
            <span className="text-muted">{editionDate()}</span>
            <span className="mx-2 text-rule-strong">·</span>
            No. {issueNumber()}
            {stories ? (
              <>
                <span className="mx-2 text-rule-strong">·</span>
                {stories} stories
              </>
            ) : null}
          </p>

          <MobileNav items={navItems()} />
        </div>

        <div className="double-rule" />
      </div>
    </header>
  );
}
