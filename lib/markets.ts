export interface Quote {
  symbol: string;
  label: string;
  price: number;
  changePct: number;
  currency: string;
  /** UK OEICs are quoted in pence, everything else in its own currency. */
  unit: "p" | "currency";
  /** When the price it carries was actually struck. */
  asOf: number | null;
}

/*
 * Morningstar-style "0P…" symbols are UK open-ended funds, which Yahoo prints
 * in pence even though it reports the currency as GBP. Rendering those with a
 * pound sign would overstate them a hundredfold, so they carry a pence unit —
 * the same convention the stocks dashboard uses for these holdings.
 */
function unitFor(symbol: string): "p" | "currency" {
  return /^0P/i.test(symbol) ? "p" : "currency";
}

/**
 * The holdings actually being tracked. Override with
 * MARKET_SYMBOLS="0P0000KSPA.L:US Equity,ETH-GBP:Ethereum".
 */
const DEFAULT_SYMBOLS: [string, string][] = [
  ["0P0000KSPA.L", "US Equity"],
  ["XMWX.L", "World ex-USA"],
  ["0P0000KM22.L", "Emerging Markets"],
  ["0P000185T1.L", "Global EM"],
  ["ETH-GBP", "Ethereum"],
];

function configuredSymbols(): [string, string][] {
  const raw = process.env.MARKET_SYMBOLS;
  if (!raw) return DEFAULT_SYMBOLS;
  return raw
    .split(",")
    .map((entry) => entry.split(":"))
    .filter((parts): parts is [string, string] => parts.length === 2)
    .map(([symbol, label]) => [symbol.trim(), label.trim()]);
}

/*
 * Yahoo rejects browser-like User-Agents on this endpoint with HTTP 429 — a
 * full Chrome UA string fails every time while this short one succeeds. Matches
 * what the stocks project uses to pull the same holdings.
 */
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)";

interface ChartMeta {
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  currency?: string;
}

interface ChartResult {
  meta?: ChartMeta;
  timestamp?: number[];
  indicators?: { quote?: { close?: (number | null)[] }[] };
}

/**
 * The daily bars, paired with their dates and stripped of the empty ones.
 *
 * A five-day window over a weekend comes back with nulls in it, and a UK fund
 * that prices once a day leaves today empty until it strikes. Reading the last
 * real bar is the only way to know both what the price is and when it was.
 */
function barsOf(result: ChartResult) {
  const stamps = result.timestamp ?? [];
  const closes = result.indicators?.quote?.[0]?.close ?? [];
  return stamps
    .map((t, i) => ({ at: t * 1000, close: closes[i] }))
    .filter((bar): bar is { at: number; close: number } =>
      typeof bar.close === "number"
    );
}

async function fetchQuote(symbol: string, label: string): Promise<Quote | null> {
  try {
    const res = await fetch(
      `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`,
      { headers: { "User-Agent": UA }, next: { revalidate: 900 } }
    );
    if (!res.ok) return null;

    const result = ((await res.json()) as { chart?: { result?: ChartResult[] } })
      .chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const bars = barsOf(result);
    const latest = bars.at(-1);

    const price = latest?.close ?? meta?.regularMarketPrice;
    if (typeof price !== "number") return null;

    /*
     * The change is measured against the previous bar, not against
     * `chartPreviousClose` — that field is the close before the whole
     * requested window, so over a five-day range it made a week's drift read
     * as today's move, and printed a rise on a day the price had fallen.
     */
    const previous = bars.at(-2)?.close;

    return {
      symbol,
      label,
      price,
      unit: unitFor(symbol),
      changePct:
        typeof previous === "number" && previous !== 0
          ? ((price - previous) / previous) * 100
          : 0,
      currency: meta?.currency ?? "",
      asOf: latest?.at ?? null,
    };
  } catch {
    return null;
  }
}

/** CoinGecko is keyless and reliable; used if Yahoo has no crypto print. */
async function fetchEthFallback(label: string): Promise<Quote | null> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=gbp&include_24hr_change=true",
      { next: { revalidate: 900 } }
    );
    if (!res.ok) return null;
    const row = ((await res.json()) as {
      ethereum?: { gbp?: number; gbp_24h_change?: number };
    }).ethereum;
    if (typeof row?.gbp !== "number") return null;

    return {
      symbol: "ETH-GBP",
      label,
      price: row.gbp,
      changePct: row.gbp_24h_change ?? 0,
      currency: "GBP",
      unit: "currency",
      asOf: Date.now(),
    };
  } catch {
    return null;
  }
}

export async function getMarkets(): Promise<Quote[]> {
  const quotes: Quote[] = [];

  // Sequential: Yahoo throttles bursts, and with a 15-minute cache the cost is
  // a second on refresh and nothing on a page view.
  for (const [symbol, label] of configuredSymbols()) {
    const quote =
      (await fetchQuote(symbol, label)) ??
      (symbol === "ETH-GBP" ? await fetchEthFallback(label) : null);
    if (quote) quotes.push(quote);
  }

  return quotes;
}

/**
 * How old a price is, when that is worth saying.
 *
 * UK funds strike once a day and lag; across a weekend the newest real price
 * can be four days old. Printing it beside a live crypto quote with no mark
 * says the market moved today when it didn't — the ticker was showing Friday's
 * close as Tuesday's price. Anything struck today or yesterday needs no note.
 */
export function staleness(quote: Quote): string | null {
  if (quote.asOf === null) return null;
  const days = Math.floor((Date.now() - quote.asOf) / 86_400_000);
  if (days < 1) return null;
  if (days === 1) return "yesterday";
  return new Date(quote.asOf).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function formatPrice(quote: Quote) {
  // Two decimals throughout, matching the stocks dashboard's own formatting.
  const value = quote.price.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (quote.unit === "p") return `${value}p`;

  const prefix = quote.currency === "GBP" ? "£" : quote.currency === "USD" ? "$" : "";
  return `${prefix}${value}`;
}
