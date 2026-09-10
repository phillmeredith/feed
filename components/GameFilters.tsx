import Link from "next/link";
import { SORTS, type Query } from "@/lib/gamesearch";

/*
 * The three questions this directory exists to answer, as links.
 *
 * There was a separate "calm games" tab doing the first of these, which was
 * the same list with a filter already applied — a second door into one room.
 * The filters below can express all of it; these are just the shortcuts worth
 * putting a name to.
 */
const PRESETS: { label: string; href: string; note: string }[] = [
  {
    label: "Calm games",
    href: "/games?calm=1&sort=calm",
    note: "nothing chasing you",
  },
  {
    label: "Buried gems",
    href: "/games?calm=1&sort=gems",
    note: "loved, and hardly played",
  },
  {
    label: "Best liked",
    href: "/games?calm=1&sort=regard",
    note: "the safest bets",
  },
  {
    label: "Newest calm",
    href: "/games?calm=1&sort=newest",
    note: "quietly, lately",
  },
];

/**
 * The filter bar: one plain form, submitted by GET.
 *
 * No client state and no JavaScript. Everything it does ends up in the URL,
 * so a filtered directory is a link somebody can send, the back button works,
 * and the page is the same page whether or not the script ran.
 */
export function GameFilters({
  query,
  platforms,
  tags,
  showing,
  total,
}: {
  query: Query;
  platforms: string[];
  tags: string[];
  showing: number;
  total: number;
}) {
  const field =
    "w-full border border-rule-strong bg-transparent px-3 py-2.5 font-meta text-[13px] text-ink focus:border-ink focus:outline-none";
  const label = "kicker block text-micro text-faint mb-1.5";

  return (
    <>
    <div className="band-rule mt-8 flex flex-wrap gap-x-gutter gap-y-4 pt-6">
      {PRESETS.map((preset) => (
        <Link key={preset.href} href={preset.href} className="story group">
          <h3 className="headline text-[1.15rem] font-medium">{preset.label}</h3>
          <p className="source mt-1 text-faint">{preset.note}</p>
        </Link>
      ))}
    </div>

    <form method="GET" action="/games" className="mt-8 border-t border-rule-strong pt-6">
      <div className="grid gap-x-gutter gap-y-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label className={label} htmlFor="q">
            Search
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={query.q ?? ""}
            placeholder="A name, a studio, or a tag like “cozy”"
            className={field}
          />
        </div>

        <div>
          <label className={label} htmlFor="platform">
            Platform
          </label>
          <select id="platform" name="platform" defaultValue={query.platform ?? ""} className={field}>
            <option value="">Any</option>
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label} htmlFor="tag">
            Tag
          </label>
          <select id="tag" name="tag" defaultValue={query.tag ?? ""} className={field}>
            <option value="">Any</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label} htmlFor="sort">
            Order
          </label>
          <select id="sort" name="sort" defaultValue={query.sort ?? "calm"} className={field}>
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-2.5 kicker text-micro text-muted">
          <input
            type="checkbox"
            name="calm"
            value="1"
            defaultChecked={query.calm}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Calm games only
        </label>

        <div className="flex items-center gap-5">
          <span className="source">
            {showing === total ? `${total} games` : `${showing} of ${total}`}
          </span>
          <button
            type="submit"
            className="kicker border-2 border-ink px-5 py-2 text-micro text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Apply
          </button>
        </div>
      </div>
    </form>
    </>
  );
}
