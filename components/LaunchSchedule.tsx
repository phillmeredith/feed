import { upcoming, providers, precisionNote, type Launch } from "@/lib/launches";
import { SITE_TIME_ZONE } from "@/lib/format";

/**
 * What is going up, and how firmly anyone is saying so.
 *
 * Every launch calendar prints a date. Most of those dates are guesses — a
 * payload "in Q4" and a Soyuz with a confirmed T-0 to the second are not the
 * same claim, and showing them identically is a small lie the reader has no
 * way to catch. The schedule carries its own precision, so this prints it.
 */
export function LaunchSchedule() {
  const rows = upcoming();
  if (rows.length === 0) return null;

  const next = rows[0];
  const byProvider = providers().slice(0, 6);

  return (
    <section>
      <div className="flex items-baseline justify-between gap-6 flex-wrap border-b border-rule pb-3">
        <h2 className="kicker text-label text-accent">On the pad</h2>
        <p className="font-serif italic text-xs text-faint">
          {rows.length} on the books
        </p>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-start">
        <div>
          <p className="kicker text-micro text-faint">Next up</p>
          <p className="display text-headline leading-none mt-3">
            {countdown(next.net)}
          </p>
          <p className="font-body font-semibold text-lede mt-4">{next.rocket}</p>
          <p className="text-fine text-muted mt-1">
            {next.mission || next.name}
          </p>
          <p className="kicker text-micro text-faint mt-4">
            {next.provider}
          </p>
          <p className="kicker text-micro text-faint mt-1">
            {when(next)} · {next.location}
          </p>
        </div>

        <ol className="flex flex-col">
          {rows.slice(0, 14).map((launch) => {
            const note = precisionNote(launch.precision);
            return (
              <li
                key={launch.id}
                className="border-t border-rule py-3 flex flex-wrap items-baseline gap-x-5 gap-y-1"
              >
                <span className="kicker text-micro text-faint w-[8.5rem] shrink-0 tabular-nums">
                  {when(launch)}
                </span>
                <span className="font-body font-semibold text-fine min-w-0 flex-1">
                  {launch.rocket}
                  {launch.mission && (
                    <span className="text-muted font-normal">
                      {" · "}
                      {launch.mission}
                    </span>
                  )}
                </span>
                {note && (
                  <span className="kicker text-micro text-faint">{note}</span>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-10 border-t border-rule pt-5 flex flex-wrap gap-x-8 gap-y-2">
        <span className="kicker text-micro text-faint">Who is flying</span>
        {byProvider.map((p) => (
          <span key={p.name} className="kicker text-micro text-muted">
            {p.name.replace(/\s*\([^)]*\)\s*/, " ").trim()}
            <span className="ml-2 text-accent tabular-nums">{p.count}</span>
          </span>
        ))}
      </div>
    </section>
  );
}

function when(launch: Launch) {
  const at = new Date(launch.net);
  const p = launch.precision.toLowerCase();

  // Don't print a clock time the schedule doesn't actually claim.
  if (p.includes("second") || p.includes("minute") || p.includes("hour")) {
    return at.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: SITE_TIME_ZONE,
    });
  }
  return at.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: at.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
    timeZone: SITE_TIME_ZONE,
  });
}

function countdown(net: string) {
  const ms = new Date(net).getTime() - Date.now();
  if (ms <= 0) return "now";
  const hours = ms / 3_600_000;
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}
