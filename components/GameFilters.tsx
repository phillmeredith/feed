import { SORTS, type Query } from "@/lib/gamesearch";

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
    <form method="GET" action="/games" className="band-rule mt-8 pt-6">
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
  );
}
