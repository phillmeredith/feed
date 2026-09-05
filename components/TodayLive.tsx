import Link from "next/link";
import type { Article } from "@/lib/types";
import { categoryBySlug } from "@/lib/categories";

function time(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Row({ article }: { article: Article }) {
  const desk = categoryBySlug(article.category);
  return (
    <li>
      <Link href={`/story/${article.id}`} className="group flex gap-4 py-3">
        <span className="kicker text-[9px] text-faint pt-1 w-10 shrink-0 tabular-nums">
          {time(article.publishedAt)}
        </span>
        <span className="min-w-0 truncate">
          <span className="kicker text-[9px] text-accent mr-2">
            {desk?.short}
          </span>
          <span className="font-body text-[15px] leading-snug group-hover:text-accent transition-colors">
            {article.headline}
          </span>
        </span>
      </Link>
    </li>
  );
}

function Column({ title, items }: { title: string; items: Article[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="kicker text-[10px] text-muted border-b border-rule pb-2">
        {title}
      </h3>
      <ul className="mt-1 divide-y divide-[var(--rule)]">
        {items.map((a) => (
          <Row key={a.id} article={a} />
        ))}
      </ul>
    </div>
  );
}

/**
 * What has actually happened today: launches on the left, everything else of
 * consequence on the right. Falls back to the last 24 hours early in the
 * morning, when "today" is still nearly empty.
 */
export function TodayLive({
  releases,
  breaking,
  windowLabel,
}: {
  releases: Article[];
  breaking: Article[];
  windowLabel: string;
}) {
  if (releases.length === 0 && breaking.length === 0) return null;

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const count = releases.length + breaking.length;

  /*
   * A native <details> rather than a client component: collapsed by default,
   * no JavaScript, and it still server-renders its contents.
   */
  return (
    <details className="today group border-b border-rule pb-6">
      <summary className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 cursor-pointer list-none">
        <span className="flex items-baseline gap-3">
          <h2 className="display text-2xl sm:text-3xl">Today</h2>
          <span className="kicker text-[10px] text-accent">
            {count} {count === 1 ? "item" : "items"}
          </span>
        </span>
        <span className="kicker text-[10px] text-faint">
          {today} · {windowLabel}
          <span className="ml-3 text-muted group-open:hidden">Show →</span>
          <span className="ml-3 text-muted hidden group-open:inline">Hide ↑</span>
        </span>
      </summary>

      <div className="mt-8 grid gap-10 md:grid-cols-2 pb-4">
        <Column title="Releases & launches" items={releases} />
        <Column title="Also of consequence" items={breaking} />
      </div>
    </details>
  );
}
