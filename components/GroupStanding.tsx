import Link from "next/link";
import { allGear } from "@/lib/gearspec";
import { gearSlug } from "@/lib/gearspec";
import { season, driverStandings, driverName } from "@/lib/f1";
import { latestEvent } from "@/lib/golf";
import { completedEvents } from "@/lib/ufc";
import { matchByName } from "@/lib/catalogue";
import { modelSlug } from "@/lib/openrouter";
import models from "@/data/models.json" with { type: "json" };
import { BandHead } from "./Band";

function month(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

/**
 * What a section is actually about, above the reporting about it.
 *
 * A section front made only of headlines tells you what was written this
 * week. These tell you where the subject itself stands — what has been
 * released, who is winning — which is the thing the desks underneath are
 * reporting on, and the reason to keep the section rather than a flat feed.
 *
 * Each group gets its own, because each group has different standing facts.
 * A group with none renders nothing rather than a placeholder.
 */
export function GroupStanding({ group }: { group: string }) {
  if (group === "photography") return <RecentlyReleased />;
  if (group === "sport") return <WhereThingsStand />;
  if (group === "technology") return <LatestModels />;
  return null;
}

/** What the labs have shipped, newest first. */
function LatestModels() {
  const items = (
    models.items as {
      name: string;
      lab: string;
      releasedAt: string;
      weights: string;
    }[]
  )
    .slice()
    .sort((a, b) => b.releasedAt.localeCompare(a.releasedAt))
    .slice(0, 8);
  if (items.length === 0) return null;

  return (
    <Panel
      title="Latest releases"
      note="From the labs themselves"
      href="/model"
      cta="The model catalogue"
    >
      <ul className="mt-6 columns-1 sm:columns-2 gap-x-12">
        {items.map((model) => {
          const entry = matchByName(model.name);
          const body = (
            <>
              <span className="font-body text-small group-hover:text-accent transition-colors">
                {model.name}
              </span>
              <span className="text-fine text-faint">
                {" "}
                — {model.lab}
                {model.weights === "open" ? ", open weights" : ""}
              </span>
            </>
          );

          return (
            <li key={model.name} className="break-inside-avoid py-2.5">
              <span className="group flex items-baseline gap-4">
                <span className="kicker text-micro text-faint w-20 shrink-0">
                  {month(model.releasedAt)}
                </span>
                <span className="min-w-0">
                  {entry ? (
                    <Link href={`/model/${modelSlug(entry.id)}`}>{body}</Link>
                  ) : (
                    body
                  )}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/** The last of the glass and bodies, straight off the directory. */
function RecentlyReleased() {
  const items = allGear().slice(0, 10);
  if (items.length === 0) return null;

  return (
    <Panel
      title="Recently released"
      note="Every body and lens on record"
      href="/gear"
      cta="The full directory"
    >
      <ul className="mt-6 columns-1 sm:columns-2 gap-x-12">
        {items.map((item) => (
          <li key={item.name} className="break-inside-avoid py-2.5">
            <Link
              href={`/gear/${gearSlug(item.name)}`}
              className="group flex items-baseline gap-4"
            >
              <span className="kicker text-micro text-faint w-20 shrink-0">
                {month(item.announcedAt)}
              </span>
              <span className="min-w-0">
                <span className="font-body text-small group-hover:text-accent transition-colors">
                  {item.name}
                </span>
                <span className="text-fine text-faint">
                  {" "}
                  — {item.kind === "lens" ? "lens" : "camera"}
                  {item.independent ? ", third party" : ""}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** Three sports, three sentences: who is winning what. */
function WhereThingsStand() {
  const f1 = season();
  const leader = driverStandings()[0];
  const lastRace = f1.races.filter((r) => r.results?.length).pop();
  const major = latestEvent();
  const card = completedEvents()[0];
  const headline = card?.fights[card.fights.length - 1];

  const lines = [
    leader && {
      href: "/f1",
      desk: "Formula One",
      lead: driverName(leader),
      detail: `leads on ${leader.points} points${
        lastRace?.winner ? `; ${lastRace.winner} won at ${lastRace.name.replace(" Grand Prix", "")}` : ""
      }`,
    },
    major?.winner && {
      href: "/golf",
      desk: major.major ? "Last major" : "Last played",
      lead: major.winner,
      detail: `won ${major.name}${major.venue ? ` at ${major.venue}` : ""}`,
    },
    headline?.winner && {
      href: "/ufc",
      desk: "Last card",
      lead: headline.winner,
      detail: `topped ${card!.name.replace(/^UFC (Fight Night: )?/, "")}`,
    },
  ].filter(Boolean) as {
    href: string;
    desk: string;
    lead: string;
    detail: string;
  }[];

  if (lines.length === 0) return null;

  return (
    <Panel title="Where things stand" note="Across the three desks">
      <div className="mt-6 grid gap-10 sm:grid-cols-3">
        {lines.map((line) => (
          <Link key={line.href} href={line.href} className="group block">
            <p className="kicker text-micro text-faint">{line.desk}</p>
            <p className="display text-2xl mt-2 group-hover:text-accent transition-colors">
              {line.lead}
            </p>
            <p className="font-serif text-small text-muted mt-1">
              {line.detail}
            </p>
          </Link>
        ))}
      </div>
    </Panel>
  );
}

/**
 * These opened on their own heading — an oxide label with an italic note
 * pushed to the right of it on a hairline — which was a fourth way of opening
 * a block on a page that already had three. It is a band like any other now.
 */
function Panel({
  title,
  note,
  href,
  cta,
  children,
}: {
  title: string;
  note: string;
  href?: string;
  cta?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <BandHead title={title} note={note} href={href} more={cta} />
      {children}
    </section>
  );
}
