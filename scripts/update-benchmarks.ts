/**
 * Reads benchmark results from Epoch AI's benchmarking hub.
 *
 * Epoch run the evaluations themselves and publish a zip of CSVs — one per
 * benchmark, plus a metadata table giving each one's score column, its scale,
 * what a model gets by guessing and what the highest attainable score is.
 * That metadata is the reason this is usable rather than a pile of numbers:
 * without it a 0.25 on GPQA reads as a poor score rather than as chance.
 *
 * Published under CC-BY, which is why every page that renders this credits
 * them by name and links to the hub.
 *
 *   npm run benchmarks:update
 */
import { writeFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Benchmark, Score } from "../lib/benchmarks.ts";

const STORE = new URL("../data/benchmarks.json", import.meta.url);
const ZIP = "https://epoch.ai/data/benchmark_data.zip";
const SOURCE = "Epoch AI · AI Benchmarking Hub";
const LICENCE = "CC BY 4.0";
const UA = "Mozilla/5.0 (compatible; TheDispatch/1.0)";

/*
 * The benchmarks worth a column, and what each is actually asking.
 *
 * Not all 85 in the hub: most are either superseded, saturated years ago, or
 * measure something too narrow to sit beside the others. These are the ones a
 * reader choosing or watching a model would recognise — and where a benchmark
 * has been beaten and retired, it is kept precisely because that is the
 * finding.
 */
const WANTED: { file: string; key: string; asks: string; retired?: string }[] = [
  { file: "gpqa_diamond", key: "gpqa", asks: "PhD-level science questions written to resist a web search." },
  { file: "swe_bench_verified", key: "swe-bench", asks: "Real GitHub issues, resolved against the repository's own tests." },
  { file: "terminalbench_external", key: "terminal-bench", asks: "Tasks completed from a command line, unaided." },
  { file: "arc_agi_2_external", key: "arc-agi-2", asks: "Novel visual puzzles, designed to be easy for people and hard to memorise." },
  { file: "hle_external", key: "hle", asks: "Humanity's Last Exam: questions the writers expected no model to answer." },
  { file: "frontiermath_tiers_1_3_v2", key: "frontiermath", asks: "Research-level mathematics, unpublished so it cannot be trained on." },
  { file: "aider_polyglot_external", key: "aider", asks: "Editing existing code correctly across six languages." },
  { file: "os_world_external", key: "osworld", asks: "Driving a real desktop: files, browsers, applications." },
  { file: "simpleqa_verified", key: "simpleqa", asks: "Short factual questions — a measure of making things up." },
  { file: "math_level_5", key: "math", asks: "The hardest tier of competition mathematics.", retired: "Effectively solved; kept for the shape of the curve." },
  { file: "mmlu_external", key: "mmlu", asks: "Multiple-choice knowledge across 57 school and professional subjects.", retired: "Retired in 2024 once the leaders crowded the ceiling." },
  { file: "gsm8k_external", key: "gsm8k", asks: "Grade-school arithmetic word problems.", retired: "Solved in 2024; the first benchmark this field outgrew." },
];

/** Minimal CSV reader: quoted fields, embedded commas, doubled quotes. */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }

  const [head, ...body] = rows.filter((r) => r.some((c) => c !== ""));
  if (!head) return [];
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

const work = mkdtempSync(join(tmpdir(), "bench-"));

try {
  console.log(`Fetching ${ZIP}`);
  const res = await fetch(ZIP, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const zip = join(work, "bench.zip");
  writeFileSync(zip, Buffer.from(await res.arrayBuffer()));

  // Node has no zip reader; unzip is present on macOS and on the runner.
  execFileSync("unzip", ["-o", "-q", zip, "-d", work]);

  const meta = new Map<string, Record<string, string>>();
  for (const m of parseCsv(readFileSync(join(work, "benchmark_metadata.csv"), "utf8"))) {
    meta.set((m.source_file ?? "").replace(/\.csv$/, ""), m);
  }

  const benchmarks: Benchmark[] = [];

  for (const want of WANTED) {
    const m = meta.get(want.file);
    if (!m) { console.log(`  ! ${want.file}: not in the metadata table`); continue; }

    let rows: Record<string, string>[];
    try {
      rows = parseCsv(readFileSync(join(work, `${want.file}.csv`), "utf8"));
    } catch {
      console.log(`  ! ${want.file}: no such file in the archive`);
      continue;
    }

    /*
     * `scale` turns the published column into a 0–1 fraction: some sheets are
     * percentages and some are already fractions, and mixing them would put a
     * 62% model below a 0.62 one on the same axis.
     */
    const scale = Number(m.scale) || 1;
    const column = m.score_column;

    const best = new Map<string, Score>();
    for (const r of rows) {
      const raw = Number(r[column]);
      const at = r["Release date"];
      const model = r["Model version"];
      if (!Number.isFinite(raw) || !at || !model) continue;
      const score = raw * scale;
      // One row per model: the sheets carry a run per scorer and per attempt.
      const seen = best.get(model);
      if (!seen || score > seen.score) {
        best.set(model, { model, org: r.Organization || "—", at, score });
      }
    }

    const scores = [...best.values()].sort((a, b) => a.at.localeCompare(b.at));
    if (scores.length === 0) { console.log(`  ! ${want.key}: no usable rows`); continue; }

    benchmarks.push({
      key: want.key,
      name: m.benchmark,
      asks: want.asks,
      baseline: Number(m.random_baseline) || 0,
      ceiling: Number(m.score_ceiling) || 1,
      retired: want.retired,
      scores,
    });

    const top = scores.reduce((a, b) => (b.score > a.score ? b : a));
    console.log(
      `  + ${m.benchmark}: ${scores.length} models, best ${(top.score * 100).toFixed(1)}% (${top.model})`
    );
  }

  if (benchmarks.length === 0) throw new Error("nothing parsed; store left alone");

  writeFileSync(
    STORE,
    `${JSON.stringify(
      { updated: new Date().toISOString(), source: SOURCE, licence: LICENCE, benchmarks },
      null,
      2
    )}\n`
  );
  console.log(`\n${benchmarks.length} benchmarks recorded`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
