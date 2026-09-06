import Link from "next/link";
import { navItems } from "@/lib/categories";
import { getMarkets, formatPrice } from "@/lib/markets";
import { getWeather } from "@/lib/weather";
import { Dateline } from "./Dateline";
import { MobileNav } from "./MobileNav";

function Wordmark({ small = false }: { small?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-baseline gap-1 group">
      <span
        className={`font-serif italic text-accent leading-none ${
          small ? "text-xl" : "text-3xl sm:text-4xl"
        }`}
      >
        The
      </span>
      <span
        className={`display text-paper leading-none group-hover:text-accent transition-colors ${
          small ? "text-xl" : "text-3xl sm:text-4xl"
        }`}
      >
        Dispatch
      </span>
    </Link>
  );
}

function Change({ pct }: { pct: number }) {
  const flat = Math.abs(pct) < 0.005;
  return (
    <span
      className={`kicker text-[9px] ${
        flat ? "text-faint" : pct > 0 ? "text-accent" : "text-negative"
      }`}
    >
      {flat ? "—" : `${pct > 0 ? "▲" : "▼"}${Math.abs(pct).toFixed(2)}%`}
    </span>
  );
}

export async function Masthead({ compact = false }: { compact?: boolean }) {
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
    <header className="border-b border-rule">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-10 py-8 sm:py-10 flex items-center justify-between gap-6">
        <Wordmark small={compact} />

        {/* The full desk list plus the wordmark and dateline needs a little
            over 1000px to sit on one line, so it waits for `lg`. Below that —
            a phone in landscape, a tablet in portrait — the burger takes it. */}
        <nav className="hidden lg:flex items-center gap-6 kicker text-[11px] text-muted">
          {navItems().map((item) => (
            <Link
              key={item.slug}
              href={`/${item.slug}`}
              className="hover:text-accent transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Today's temperature sits with the dateline, where a masthead
            traditionally carries the weather. */}
        <p className="hidden sm:flex items-baseline gap-3 whitespace-nowrap">
          {weather && (
            <span className="font-body font-semibold text-sm">
              {weather.tempC}°
            </span>
          )}
          <Dateline since={lastUpdated} />
        </p>

        <MobileNav items={navItems()} />
      </div>

      {/* The day's numbers: holdings, then the week's weather. */}
      <div className="border-t border-rule overflow-hidden">
        <div className="flex whitespace-nowrap">
          <div className="ticker-track flex shrink-0">
            {[0, 1].map((pass) => (
              <span key={pass} className="flex shrink-0">
                {markets.map((quote) => (
                  <span
                    key={`${pass}-${quote.symbol}`}
                    className="flex items-baseline gap-2 pr-10 py-3"
                  >
                    <span className="kicker text-[9px] text-faint">
                      {quote.label}
                    </span>
                    <span className="font-body font-semibold text-[13px]">
                      {formatPrice(quote)}
                    </span>
                    <Change pct={quote.changePct} />
                  </span>
                ))}

                {weather?.forecast.map((day) => (
                  <span
                    key={`${pass}-${day.day}`}
                    className="flex items-baseline gap-2 pr-10 py-3"
                  >
                    <span className="kicker text-[9px] text-faint">{day.day}</span>
                    <span className="font-body font-semibold text-[13px]">
                      {day.high}°
                    </span>
                    <span className="font-body text-[13px] text-faint">
                      {day.low}°
                    </span>
                    <span className="kicker text-[9px] text-faint">
                      {day.condition}
                    </span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
