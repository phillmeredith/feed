import Link from "next/link";
import type { Metadata } from "next";
import { Masthead } from "@/components/Masthead";
import { Footer } from "@/components/Footer";
import { getFeed } from "@/lib/feed";
import { withArchive } from "@/lib/archive";
import { rumoursFrom, tally, type Confidence } from "@/lib/rumours";

/*
 * This one is a feed view rather than an entity page: it reads today's wire
 * merged over the archive, so it needs the pipeline and stays dynamic.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "The rumour board — The Dispatch",
  description:
    "Camera kit that hasn't been announced yet, graded by confidence, and marked when it turns out to be true.",
};

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  confirmed: "Leaked / confirmed",
  likely: "Reported",
  speculative: "Speculative",
};

function ConfidenceChip({ level }: { level: Confidence }) {
  const colour =
    level === "confirmed"
      ? "text-accent border-accent-dim"
      : level === "speculative"
        ? "text-faint border-rule"
        : "text-muted border-rule";
  return (
    <span className={`kicker text-[9px] border px-2 py-1 ${colour}`}>
      {CONFIDENCE_LABEL[level]}
    </span>
  );
}

export default async function RumourBoard() {
  const { articles } = await getFeed();
  const rumours = rumoursFrom(withArchive(articles));
  const counts = tally(rumours);

  const outstanding = rumours.filter((r) => !r.resolved);
  const resolved = rumours.filter((r) => r.resolved);

  return (
    <>
      <Masthead compact />

      <main className="mx-auto max-w-[1400px] px-5 sm:px-8 py-10 flex-1 w-full">
        <div className="border-b border-rule pb-8">
          <p className="kicker text-[10px] text-accent">
            <Link href="/photography" className="hover:underline">Photography</Link>
          </p>
          <h1 className="display text-[clamp(2.2rem,5.5vw,4rem)] mt-4">
            The rumour board
          </h1>
          <p className="font-serif text-lg sm:text-xl text-muted mt-4 max-w-2xl">
            Kit that hasn&apos;t been announced yet, graded by how firmly it is
            being reported — and marked when it turns out to be true. Rumour
            sites delete this the moment it becomes checkable.
          </p>
          <p className="kicker text-[10px] text-faint mt-5">
            {counts.outstanding} outstanding · {counts.resolved} since announced
          </p>
        </div>

        {outstanding.length > 0 && (
          <section className="mt-12">
            <h2 className="kicker text-[11px] text-accent border-b border-rule pb-3">
              Still to come
            </h2>
            <div className="mt-6 flex flex-col">
              {outstanding.map((r) => (
                <article
                  key={r.id}
                  className="group border-b border-rule py-5 flex flex-wrap items-baseline gap-x-5 gap-y-2"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-body font-semibold text-[17px] leading-snug">
                      <Link
                        href={`/story/${r.storyId}`}
                        className="group-hover:text-accent transition-colors"
                      >
                        {r.headline}
                      </Link>
                    </h3>
                    <p className="kicker text-[9px] text-faint mt-2">
                      {r.source}
                      <span className="mx-2 text-rule">/</span>
                      first heard{" "}
                      {new Date(r.firstHeard).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <ConfidenceChip level={r.confidence} />
                </article>
              ))}
            </div>
          </section>
        )}

        {resolved.length > 0 && (
          <section className="mt-16">
            <h2 className="kicker text-[11px] text-accent border-b border-rule pb-3">
              Since announced
            </h2>
            <div className="mt-6 flex flex-col">
              {resolved.map((r) => (
                <article
                  key={r.id}
                  className="group border-b border-rule py-5 flex flex-wrap items-baseline gap-x-5 gap-y-2"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-body text-[16px] leading-snug text-muted">
                      {r.headline}
                    </h3>
                    <p className="kicker text-[9px] text-faint mt-2">
                      {r.source}
                      <span className="mx-2 text-rule">/</span>
                      {(() => {
                        const days = Math.max(
                          0,
                          Math.round(
                            (new Date(r.resolved!.announcedAt).getTime() -
                              new Date(r.firstHeard).getTime()) /
                              86_400_000
                          )
                        );
                        return days === 0
                          ? "called it the same day"
                          : `${days} ${days === 1 ? "day" : "days"} ahead of the announcement`;
                      })()}
                    </p>
                  </div>
                  <Link
                    href={`/gear/${r.resolved!.slug}`}
                    className="kicker text-[9px] text-accent border border-accent-dim px-2 py-1 hover:bg-surface transition-colors"
                  >
                    {r.resolved!.name} →
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}

        {rumours.length === 0 && (
          <p className="mt-16 font-serif italic text-xl text-muted">
            Nothing on the board right now.
          </p>
        )}
      </main>

      <Footer />
    </>
  );
}
