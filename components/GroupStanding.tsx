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
import { ReleaseTimeline } from "./ReleaseTimeline";

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

/** What the labs have shipped, on an axis. */
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
    /*
     * Enough to fill the axis rather than a fixed eight. A list had to be
     * capped because it grew downwards; the axis grows sideways into columns
     * that are already there, and the months do the trimming.
     */
    .slice(0, 40);
  if (items.length === 0) return null;

  return (
    <Panel
      title="Latest releases"
      note="From the labs themselves"
      href="/model"
      cta="The model catalogue"
    >
      <ReleaseTimeline
        releases={items.map((model) => {
          const entry = matchByName(model.name);
          return {
            name: model.name,
            note: `${model.lab}${model.weights === "open" ? " · open weights" : ""}`,
            at: model.releasedAt,
            href: entry ? `/model/${modelSlug(entry.id)}` : undefined,
          };
        })}
      />
    </Panel>
  );
}

/** The last of the glass and bodies, straight off the directory. */
function RecentlyReleased() {
  const items = allGear().slice(0, 40);
  if (items.length === 0) return null;

  return (
    <Panel
      title="Recently released"
      note="Every body and lens on record"
      href="/gear"
      cta="The full directory"
    >
      <ReleaseTimeline
        releases={items.map((item) => ({
          name: item.name,
          note: `${item.kind === "lens" ? "Lens" : "Camera"}${item.independent ? " · third party" : ""}`,
          at: item.announcedAt,
          href: `/gear/${gearSlug(item.name)}`,
        }))}
      />
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
