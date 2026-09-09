import Link from "next/link";

export interface Release {
  name: string;
  /** What it is and who made it — "OpenAI", "lens, third party". */
  note: string;
  /** When it was announced, ISO. */
  at: string;
  href?: string;
}

/*
 * The axis picks its own units.
 *
 * Months are right for the gear directory, which reaches back years. They are
 * useless for the model catalogue, where everything the labs have shipped so
 * far landed inside one September — bucketed by month that is a timeline with
 * one mark on it, which is a list with extra steps. So: bucket by month, and
 * if that produces fewer than three marks, bucket by day instead and let the
 * axis show the week a field moved rather than the year.
 */
const SCALES = {
  month: {
    key: (iso: string) => iso.slice(0, 7),
    label: (iso: string) =>
      new Date(iso).toLocaleDateString("en-GB", {
        month: "short",
        year: "numeric",
      }),
  },
  day: {
    key: (iso: string) => iso.slice(0, 10),
    label: (iso: string) =>
      new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
  },
} as const;

/** Below this many marks a month axis is not saying anything. */
const MIN_MARKS = 3;

function bucket(releases: Release[], key: (iso: string) => string) {
  const groups = new Map<string, Release[]>();
  for (const release of releases) {
    const k = key(release.at);
    groups.set(k, [...(groups.get(k) ?? []), release]);
  }
  return groups;
}

/**
 * What a field has shipped, on an axis.
 *
 * This was a two-column list of names with the month set beside each one, and
 * a list is the wrong shape for the question it answers. The question is not
 * "what came out" — the catalogue answers that in full — it is "how fast is
 * this moving", and a list cannot show a quiet month or three releases in a
 * week. An axis can: the months are the same width whether one thing shipped
 * in them or four, so the gaps are as legible as the entries.
 *
 * Read left to right, oldest first, which is the direction time is drawn in.
 */
export function ReleaseTimeline({
  releases,
  months = 5,
  perMonth = 4,
}: {
  releases: Release[];
  /** How many months of axis to draw. */
  months?: number;
  /** How many entries a month prints before it starts counting the rest. */
  perMonth?: number;
}) {
  const byMonth = bucket(releases, SCALES.month.key);
  const scale =
    byMonth.size >= MIN_MARKS
      ? SCALES.month
      : SCALES.day;
  const groups = byMonth.size >= MIN_MARKS ? byMonth : bucket(releases, scale.key);

  /*
   * The most recent marks, then reversed — the data arrives newest first
   * because that is how every list on the site is ordered, and an axis that
   * ran newest-to-oldest left to right would be the one thing on the page
   * running backwards.
   */
  const axis = [...groups.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, months)
    .reverse();

  if (axis.length === 0) return null;

  return (
    <div className="mt-8">
      {/* The months, above the axis. */}
      <div
        className="grid gap-x-gutter pb-3"
        style={{ gridTemplateColumns: `repeat(${axis.length}, minmax(0, 1fr))` }}
      >
        {axis.map(([key, items]) => (
          <p key={key} className="kicker text-micro tracking-[0.2em] text-faint">
            {scale.label(items[0].at)}
          </p>
        ))}
      </div>

      {/* The axis itself, with a tick where each month begins. */}
      <div
        className="grid gap-x-gutter border-t-2 border-ink"
        style={{ gridTemplateColumns: `repeat(${axis.length}, minmax(0, 1fr))` }}
      >
        {axis.map(([key, items]) => {
          const shown = items.slice(0, perMonth);
          const rest = items.length - shown.length;

          return (
            <div key={key} className="relative pt-6">
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 h-[9px] w-[9px] -translate-y-1/2 rounded-full bg-accent"
              />

              <ul className="flex flex-col gap-4">
                {shown.map((release) => {
                  const body = (
                    <>
                      <span className="headline block text-[1.05rem] font-medium leading-[1.2]">
                        {release.name}
                      </span>
                      <span className="source mt-1 block">{release.note}</span>
                    </>
                  );

                  return (
                    <li key={`${release.name}-${release.at}`}>
                      {release.href ? (
                        <Link
                          href={release.href}
                          className="group block transition-colors hover:text-accent"
                        >
                          {body}
                        </Link>
                      ) : (
                        body
                      )}
                    </li>
                  );
                })}

                {rest > 0 && (
                  <li className="source text-faint">
                    + {rest} more
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
