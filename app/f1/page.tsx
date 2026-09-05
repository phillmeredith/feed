import Link from "next/link";
import type { Metadata } from "next";
import { Masthead } from "@/components/Masthead";
import { Footer } from "@/components/Footer";
import {
  season,
  driverStandings,
  constructorStandings,
  races,
  nextRace,
  driverName,
} from "@/lib/f1";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "The season — The Dispatch",
  description:
    "Formula 1 standings, calendar and every result so far this season.",
};

function raceDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export default function F1Season() {
  const s = season();
  const drivers = driverStandings();
  const teams = constructorStandings();
  const calendar = races();
  const next = nextRace();
  const run = calendar.filter((r) => r.results?.length);

  const leader = drivers[0];
  const second = drivers[1];
  const gap = leader && second ? leader.points - second.points : 0;

  return (
    <>
      <Masthead compact />

      <main className="mx-auto max-w-[1400px] px-5 sm:px-8 py-10 flex-1 w-full">
        <div className="border-b border-rule pb-8">
          <p className="kicker text-[10px] text-accent">
            <Link href="/sports" className="hover:underline">Sport</Link>
          </p>
          <h1 className="display text-[clamp(2.2rem,5.5vw,4rem)] mt-4">
            The {s.season} season
          </h1>
          <p className="font-serif text-lg sm:text-xl text-muted mt-4 max-w-2xl">
            {leader && (
              <>
                {driverName(leader)} leads by {gap}{" "}
                {gap === 1 ? "point" : "points"} after {run.length} of{" "}
                {calendar.length} rounds.
              </>
            )}
          </p>
          {next && (
            <p className="kicker text-[10px] text-faint mt-5">
              Next · round {next.round} · {next.name} · {raceDate(next.date)} ·{" "}
              {next.locality}, {next.country}
            </p>
          )}
        </div>

        <div className="mt-12 grid gap-14 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <section>
            <h2 className="kicker text-[11px] text-accent border-b border-rule pb-3">
              Drivers
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[420px] text-[14px]">
                <thead>
                  <tr className="border-b border-rule">
                    <th className="kicker text-[9px] text-faint text-left pb-3 pr-3">#</th>
                    <th className="kicker text-[9px] text-faint text-left pb-3 pr-4">Driver</th>
                    <th className="kicker text-[9px] text-faint text-left pb-3 pr-4">Team</th>
                    <th className="kicker text-[9px] text-faint text-right pb-3 pr-4">Wins</th>
                    <th className="kicker text-[9px] text-faint text-right pb-3">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((d) => (
                    <tr key={d.driverId} className="border-b border-rule group">
                      <td className="py-2.5 pr-3 text-faint tabular-nums">
                        {d.position}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Link
                          href={`/f1/${d.driverId}`}
                          className="font-body font-semibold group-hover:text-accent transition-colors"
                        >
                          {driverName(d)}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4 text-muted text-[13px]">
                        {d.constructor}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums text-muted">
                        {d.wins || "—"}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-accent font-semibold">
                        {d.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="kicker text-[11px] text-accent border-b border-rule pb-3">
              Constructors
            </h2>
            <div className="mt-4">
              <table className="w-full text-[14px]">
                <tbody>
                  {teams.map((t) => (
                    <tr key={t.constructorId} className="border-b border-rule">
                      <td className="py-2.5 pr-3 text-faint tabular-nums w-6">
                        {t.position}
                      </td>
                      <td className="py-2.5 pr-4 font-body font-semibold">
                        {t.name}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-accent font-semibold">
                        {t.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section className="mt-16">
          <h2 className="kicker text-[11px] text-accent border-b border-rule pb-3">
            Calendar
          </h2>
          <div className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {calendar.map((r) => {
              const done = Boolean(r.results?.length);
              const isNext = next?.round === r.round;
              return (
                <div
                  key={r.round}
                  className={`border-t pt-3 ${isNext ? "border-accent" : "border-rule"}`}
                >
                  <p className="kicker text-[9px] text-faint">
                    R{r.round}
                    <span className="mx-2 text-rule">/</span>
                    {raceDate(r.date)}
                    {isNext && (
                      <span className="ml-2 text-accent">next up</span>
                    )}
                  </p>
                  <p
                    className={`font-body font-semibold text-[15px] mt-1 ${done ? "" : "text-muted"}`}
                  >
                    {r.name}
                  </p>
                  {r.winner ? (
                    <p className="text-[13px] text-muted mt-0.5">{r.winner}</p>
                  ) : (
                    <p className="text-[13px] text-faint mt-0.5">
                      {r.locality}, {r.country}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <p className="mt-12 text-[13px] text-faint">
          Standings, calendar and results from the Jolpica F1 API.
        </p>
      </main>

      <Footer />
    </>
  );
}
