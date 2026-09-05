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
}: {
  articles: Article[];
  announcedAt?: string;
}) {
  if (articles.length === 0) {
    return (
      <section className="mt-12 border-t border-rule pt-6">
        <h2 className="kicker text-[11px] text-accent">Coverage</h2>
        <p className="font-serif italic text-lg text-muted mt-3 max-w-2xl">
          Nothing filed here about this one yet. The directory records it;
          the reporting arrives when it does.
        </p>
      </section>
    );
  }

  const announced = announcedAt ? new Date(announcedAt).getTime() : null;

  return (
    <section className="mt-12 border-t border-rule pt-6">
      <h2 className="kicker text-[11px] text-accent">
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
              <p className="kicker text-[9px] text-faint">
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
              <h3 className="font-body font-semibold text-[17px] leading-snug mt-1.5">
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
