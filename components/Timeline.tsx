import Link from "next/link";
import type { Article } from "@/lib/types";

/**
 * A product's whole arc, in order.
 *
 * The rumour, the announcement, the hands-on and the review are one story told
 * in instalments months apart, and every publisher throws away all but the
 * latest. The archive already holds them, so the only work is putting them in
 * order and marking the moment the thing became real.
 */
export function Timeline({
  articles,
  announcedAt,
  recordingSince,
}: {
  articles: Article[];
  announcedAt?: string;
  /** When this site started keeping stories, so an empty timeline can say why. */
  recordingSince?: string;
}) {
  if (articles.length === 0) {
    /*
     * Most of the catalogue predates the archive — the directory was imported
     * and reaches back years, the archive began weeks ago. Saying "the
     * reporting arrives when it does" promised coverage that is never coming
     * for those products, on 266 of 270 pages. Where the product is older than
     * the record, say that instead; the promise is only honest for the rest.
     */
    const predatesRecord =
      announcedAt && recordingSince && announcedAt < recordingSince;

    return (
      <section className="mt-12 border-t border-rule pt-6">
        <h2 className="kicker text-micro tracking-[0.26em] text-ink">Coverage</h2>
        <p className="font-serif italic text-lg text-muted mt-3 max-w-2xl">
          {predatesRecord
            ? `Announced before this site began keeping stories in ${new Date(recordingSince).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}. The catalogue entry stands on its own; there is no archive to draw on.`
            : "Nothing filed here about this one yet. The directory records it; the reporting arrives when it does."}
        </p>
      </section>
    );
  }

  const announced = announcedAt ? new Date(announcedAt).getTime() : null;

  return (
    <section className="mt-12 border-t border-rule pt-6">
      <h2 className="kicker text-micro tracking-[0.26em] text-ink">
        Coverage · {articles.length}{" "}
        {articles.length === 1 ? "story" : "stories"}
      </h2>

      <ol className="mt-6 border-l border-rule pl-6 flex flex-col gap-7">
        {articles.map((article) => {
          const at = new Date(article.publishedAt);
          const before = announced !== null && at.getTime() < announced;
          return (
            <li key={article.id} className="relative">
              <span
                className="absolute -left-[27px] top-2 w-2 h-2 rounded-full"
                style={{
                  background: before ? "var(--faint)" : "var(--accent)",
                }}
                aria-hidden="true"
              />
              <p className="kicker text-micro text-faint">
                {at.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                <span className="mx-2 text-rule">/</span>
                {article.source}
                {before && (
                  <>
                    <span className="mx-2 text-rule">/</span>
                    <span className="text-muted">before announcement</span>
                  </>
                )}
              </p>
              <h3 className="font-body font-semibold text-lede leading-snug mt-1.5">
                <Link
                  href={`/story/${article.id}`}
                  className="hover:text-accent transition-colors"
                >
                  {article.headline}
                </Link>
              </h3>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
