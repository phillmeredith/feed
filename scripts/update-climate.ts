/**
 * Reads the three climate indicators from the agencies that publish them.
 *
 * All three are plain text or CSV over HTTPS with no key and no quota, which
 * is the whole reason this is possible: NOAA GML for CO2, NASA GISS for the
 * surface temperature anomaly, NOAA CPC for the Oceanic Nino Index.
 *
 *   npm run climate:update
 */
import { writeFileSync } from "node:fs";
import type { Indicator, Reading } from "../lib/climate.ts";

const STORE = new URL("../data/climate.json", import.meta.url);
const UA = "Mozilla/5.0 (compatible; TheDispatch/1.0)";

async function text(url: string) {
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

const indicators: Indicator[] = [];

// --- Carbon dioxide -------------------------------------------------------
try {
  const raw = await text(
    "https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_trend_gl.txt"
  );
  const rows = raw
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("#"))
    .map((l) => l.trim().split(/\s+/))
    .filter((c) => c.length >= 5)
    .map((c) => ({
      at: `${c[0]}-${c[1].padStart(2, "0")}-${c[2].padStart(2, "0")}`,
      // The seasonally adjusted trend, not the raw daily wobble.
      value: Number(c[4]),
    }))
    .filter((r) => Number.isFinite(r.value));

  const latest = rows[rows.length - 1];
  const yearAgo = rows[rows.length - 366];

  indicators.push({
    key: "co2",
    label: "Carbon dioxide",
    note: "Global average in the atmosphere. Before industrialisation it was about 280.",
    value: Number(latest.value.toFixed(2)),
    unit: "ppm",
    yearChange: yearAgo
      ? Number((latest.value - yearAgo.value).toFixed(2))
      : undefined,
    // Monthly points across two years keeps the sparkline honest and small.
    history: sample(rows.slice(-730), 24),
    source: "NOAA Global Monitoring Laboratory",
    updated: latest.at,
  });
  console.log(`  + CO2 ${latest.value} ppm (${latest.at})`);
} catch (error) {
  console.log(`  ! CO2: ${(error as Error).message}`);
}

// --- Surface temperature anomaly ------------------------------------------
/*
 * NASA's own host refuses connections often enough that a single source makes
 * this indicator unreliable rather than merely occasionally stale. The mirror
 * carries the same GISTEMP series — its 1880 values match GISS digit for
 * digit — so it stands in when the original won't answer.
 */
async function anomalyFromGiss(): Promise<Reading[]> {
  const raw = await text(
    "https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv"
  );
  const monthly: Reading[] = [];
  for (const line of raw.split("\n").slice(1)) {
    const cells = line.split(",");
    const year = Number(cells[0]);
    if (!Number.isFinite(year)) continue;
    for (let month = 1; month <= 12; month += 1) {
      const value = Number(cells[month]);
      if (!Number.isFinite(value)) continue;
      monthly.push({ at: `${year}-${String(month).padStart(2, "0")}`, value });
    }
  }
  return monthly;
}

async function anomalyFromMirror(): Promise<Reading[]> {
  const raw = await text("https://global-warming.org/api/temperature-api");
  const parsed = JSON.parse(raw) as {
    result: { time: string; land: string }[];
  };
  return parsed.result
    .map((row) => {
      // Decimal years: 2026.54 is the eighth month of 2026.
      const decimal = Number(row.time);
      const year = Math.floor(decimal);
      const month = Math.min(12, Math.round((decimal - year) * 12) + 1);
      return {
        at: `${year}-${String(month).padStart(2, "0")}`,
        value: Number(row.land),
      };
    })
    .filter((r) => Number.isFinite(r.value));
}

try {
  let monthly: Reading[] = [];
  try {
    monthly = await anomalyFromGiss();
  } catch {
    console.log("  ~ GISS unreachable, using the mirror");
    monthly = await anomalyFromMirror();
  }
  if (monthly.length === 0) throw new Error("no readings");

  const latest = monthly[monthly.length - 1];
  const yearAgo = monthly[monthly.length - 13];

  indicators.push({
    key: "anomaly",
    label: "Global temperature",
    note: "Above the 1951–1980 average, land and ocean surface combined.",
    value: Number(latest.value.toFixed(2)),
    unit: "°C",
    yearChange: yearAgo
      ? Number((latest.value - yearAgo.value).toFixed(2))
      : undefined,
    history: monthly.slice(-60),
    source: "NASA GISS",
    updated: latest.at,
  });
  console.log(`  + Anomaly +${latest.value}C (${latest.at})`);
} catch (error) {
  console.log(`  ! Anomaly: ${(error as Error).message}`);
}

// --- El Nino / La Nina ----------------------------------------------------
try {
  const raw = await text(
    "https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt"
  );
  const rows = raw
    .split("\n")
    .slice(1)
    .map((l) => l.trim().split(/\s+/))
    .filter((c) => c.length >= 4 && Number.isFinite(Number(c[3])))
    .map((c) => ({ at: `${c[0]} ${c[1]}`, value: Number(c[3]) }));

  const latest = rows[rows.length - 1];

  indicators.push({
    key: "enso",
    label: "El Niño / La Niña",
    note: "Pacific sea surface against its average — the biggest single control on a year's weather.",
    value: latest.value,
    unit: "ONI",
    history: rows.slice(-48),
    source: "NOAA Climate Prediction Center",
    updated: latest.at,
  });
  console.log(`  + ONI ${latest.value} (${latest.at})`);
} catch (error) {
  console.log(`  ! ONI: ${(error as Error).message}`);
}

/** Thin a long series down to n points without losing its shape. */
function sample(rows: Reading[], n: number): Reading[] {
  if (rows.length <= n) return rows;
  const step = (rows.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => rows[Math.round(i * step)]);
}

writeFileSync(
  STORE,
  `${JSON.stringify({ updated: new Date().toISOString(), indicators }, null, 2)}\n`
);
console.log(`\n${indicators.length} indicators recorded`);
