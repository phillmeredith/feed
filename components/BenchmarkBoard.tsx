import Link from "next/link";
import {
  allBenchmarks,
  standing,
  BENCHMARK_SOURCE,
  BENCHMARK_LICENCE,
  type Benchmark,
} from "@/lib/benchmarks";
import { BenchmarkMap } from "./BenchmarkMap";
import { BenchmarkSpark } from "./BenchmarkSpark";
import { Leaderboard } from "./Leaderboard";
import { BandHead } from "./Band";

/** The one drawn large. The longest-running benchmark still worth running. */
const HEADLINE = "gpqa";

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function Standing({ benchmark }: { benchmark: Benchmark }) {
  const { top, first, saturated } = standing(benchmark);
  if (!top) return null;

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b-2 border-ink pb-2.5">
        <h3 className="kicker text-micro tracking-[0.2em] text-ink">
          {benchmark.name}
        </h3>
        <span className="source figures">
          {pct(top.score)}
          {saturated && <span className="ml-2 text-accent">at the ceiling</span>}
          {benchmark.retired && !saturated && (
            <span className="ml-2 text-faint">retired</span>
          )}
        </span>
      </div>

      <p className="standfirst mt-3 text-small">{benchmark.asks}</p>

      <BenchmarkSpark benchmark={benchmark} />

      <p className="source mt-2">
        <b>{top.model}</b> · {top.org} ·{" "}
        {new Date(top.at).toLocaleDateString("en-GB", {
          month: "short",
          year: "numeric",
        })}
      </p>
      <p className="source mt-1 text-faint">
        {benchmark.scores.length} models scored, from{" "}
        {new Date(first.at).toLocaleDateString("en-GB", {
          month: "short",
          year: "numeric",
        })}
        {benchmark.retired ? ` · ${benchmark.retired}` : ""}
      </p>
    </section>
  );
}

export function BenchmarkBoard() {
  const benchmarks = allBenchmarks();
  const headline = benchmarks.find((b) => b.key === HEADLINE) ?? benchmarks[0];
  const rest = benchmarks.filter((b) => b.key !== headline.key);

  const live = rest.filter((b) => !b.retired);
  const beaten = rest.filter((b) => b.retired);
  const { top } = standing(headline);

  /* The three a reader is most likely to be choosing on: general reasoning,
     real software work, and running a machine unaided. */
  const highlights = ["gpqa", "swe-bench", "terminal-bench"]
    .map((k) => benchmarks.find((b) => b.key === k))
    .filter((b): b is Benchmark => Boolean(b));

  return (
    <>
      {/*
        * Who leads, before how it got that way.
        *
        * The charts below answer the historical question and answer it well,
        * and a reader arriving at this page is usually asking a much shorter
        * one — which of these should I use. That question deserves the top of
        * the page and a number they can read without tracing a line.
        */}
      <section>
        <BandHead
          weight="major"
          title="Where it stands today"
          note="The leaders on the three boards worth choosing on."
        />
        <div className="ruled mt-8 grid grid-cols-1 items-start gap-y-12 md:grid-cols-2 2xl:grid-cols-3">
          {highlights.map((b) => (
            <Leaderboard key={b.key} benchmark={b} />
          ))}
        </div>
      </section>

      <section className="mt-16">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2 className="headline text-headline">{headline.name}</h2>
          <p className="source">
            best so far <b className="figures">{pct(top?.score ?? 0)}</b> ·{" "}
            {top?.model}
          </p>
        </div>
        <p className="standfirst mt-3 max-w-[46em] text-[1.15rem]">
          {headline.asks} Every model Epoch have run it against, placed by the
          day the model was released — and the stepped line through the ones
          that beat everything before them.
        </p>

        <BenchmarkMap benchmark={headline} />

        <p className="source mt-3 text-faint">
          {headline.scores.length} models · a dot is one model&apos;s best
          recorded score · the shaded band is what guessing scores
        </p>
      </section>

      <div className="mt-16">
        <BandHead
          weight="major"
          title="The rest of the board"
          note="The same picture, at a glance, for everything else being run."
        />
        <div className="ruled mt-8 grid grid-cols-1 items-start gap-y-12 lg:grid-cols-2 2xl:grid-cols-3">
          {live.map((b) => (
            <Standing key={b.key} benchmark={b} />
          ))}
        </div>
      </div>

      {beaten.length > 0 && (
        <div className="mt-16">
          <BandHead
            weight="major"
            title="Benchmarks this field outgrew"
            note="Kept because a curve that stops rising at the ceiling is the finding."
          />
          <p className="standfirst mt-6 max-w-[46em] text-small">
            A leader crowding the top of one of these does not mean progress
            stopped. It means the test stopped being able to tell the models
            apart — which is why the ones above exist, and why in two years
            they will be down here too.
          </p>
          <div className="ruled mt-8 grid grid-cols-1 items-start gap-y-12 lg:grid-cols-2 2xl:grid-cols-3">
            {beaten.map((b) => (
              <Standing key={b.key} benchmark={b} />
            ))}
          </div>
        </div>
      )}

      {/*
        * Credit, because the licence requires it and because a page of
        * numbers should say who counted them.
        */}
      <p className="standfirst mt-14 max-w-[46em] border-t border-rule-strong pt-5 text-small">
        Scores from{" "}
        <Link
          href="https://epoch.ai/benchmarks"
          className="underline underline-offset-2 hover:text-accent"
        >
          {BENCHMARK_SOURCE}
        </Link>
        , who run the evaluations and publish the results under {BENCHMARK_LICENCE}.
        Nothing here is estimated: where a model has not been run against a
        benchmark, it is absent from that chart rather than guessed at.
      </p>
    </>
  );
}
