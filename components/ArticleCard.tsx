import type { Article } from "@/lib/types";
import { categories } from "@/lib/categories";

function relativeDate(iso: string) {
  const then = new Date(iso);
  const hours = (Date.now() - then.getTime()) / 3_600_000;
  if (hours < 1) return "Just now";
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function categoryLabel(slug: Article["category"]) {
  return categories.find((c) => c.slug === slug)?.label ?? slug;
}

function Meta({ article }: { article: Article }) {
  return (
    <p className="kicker text-[10px] text-ink-faint">
      {article.source} <span className="text-rule">·</span>{" "}
      {relativeDate(article.publishedAt)}
    </p>
  );
}

function Thumb({
  article,
  ratio,
}: {
  article: Article;
  ratio: "wide" | "standard";
}) {
  if (!article.image) return null;
  return (
    <div className="overflow-hidden border border-rule bg-paper-raised">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={article.image}
        alt=""
        loading="lazy"
        className={`w-full object-cover grayscale-[15%] transition-all duration-700 group-hover:grayscale-0 group-hover:scale-[1.02] ${
          ratio === "wide" ? "aspect-[16/10]" : "aspect-[3/2]"
        }`}
      />
    </div>
  );
}

export function LeadCard({ article }: { article: Article }) {
  return (
    <article className="group">
      <a href={article.url} target="_blank" rel="noreferrer" className="block">
        <Thumb article={article} ratio="wide" />
        <p className="kicker text-[11px] text-accent mt-5">
          {categoryLabel(article.category)}
        </p>
        <h2 className="mt-2 font-display font-semibold text-4xl sm:text-5xl leading-[1.05] tracking-tight group-hover:text-accent transition-colors">
          {article.headline}
        </h2>
        {article.dek && (
          <p className="mt-4 text-lg leading-relaxed text-ink-soft max-w-2xl">
            {article.dek}
          </p>
        )}
        <div className="mt-3">
          <Meta article={article} />
        </div>
      </a>
    </article>
  );
}

export function StandardCard({ article }: { article: Article }) {
  const hasImage = Boolean(article.image);
  return (
    <article className="group">
      <a href={article.url} target="_blank" rel="noreferrer" className="block">
        <Thumb article={article} ratio="standard" />
        <h3
          className={`font-display font-semibold leading-snug group-hover:text-accent transition-colors ${
            hasImage ? "mt-4 text-xl" : "text-2xl"
          }`}
        >
          {article.headline}
        </h3>
        {article.dek && (
          <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
            {article.dek}
          </p>
        )}
        <div className="mt-3">
          <Meta article={article} />
        </div>
      </a>
    </article>
  );
}

export function CompactCard({ article }: { article: Article }) {
  return (
    <article className="group border-t border-rule pt-4">
      <a href={article.url} target="_blank" rel="noreferrer" className="block">
        <h3 className="font-display font-medium text-lg leading-snug group-hover:text-accent transition-colors">
          {article.headline}
        </h3>
        <div className="mt-2">
          <Meta article={article} />
        </div>
      </a>
    </article>
  );
}
