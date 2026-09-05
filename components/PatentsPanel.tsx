import type { PatentFiling } from "@/lib/patents";

function when(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Recent filings by the manufacturers this desk covers. Reference material,
 * so entries carry no outbound link — the application number is enough to
 * look one up.
 */
export function PatentsPanel({ filings }: { filings: PatentFiling[] }) {
  if (filings.length === 0) return null;

  return (
    <section className="mt-20 border-t border-rule pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="display text-2xl sm:text-3xl">Patents filed</h2>
        <p className="font-serif italic text-sm text-muted">
          Recent applications · USPTO
        </p>
      </div>

      <ul className="mt-8 divide-y divide-[var(--rule)]">
        {filings.map((filing) => (
          <li key={filing.id} className="flex gap-4 py-3">
            <span className="kicker text-[9px] text-faint w-16 shrink-0 pt-1">
              {when(filing.filedAt)}
            </span>
            <span className="min-w-0">
              <span className="font-body text-[15px] leading-snug">
                {filing.title}
              </span>
              <span className="kicker text-[9px] text-accent ml-2">
                {filing.assignee}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
