import Link from "next/link";

/**
 * The head of a band.
 *
 * Every division of the paper opens the same way: a thick rule, a label in
 * the meta face, an italic line saying what is in it, and — where the band is
 * a sample of something larger — the way through to the rest, set against the
 * right edge. The front page's "Also on the desks" is this; so is every
 * section block on every interior page.
 *
 * It was thirty-two hand-written variations before, which is why the same
 * heading was 11px in one component and 10px in another with a different rule
 * beneath it. One shape, one definition.
 */
export function BandHead({
  title,
  note,
  href,
  more,
}: {
  title: string;
  /** The italic line: what this band is, in a few words. */
  note?: string;
  /** Where the whole of it lives, if this is only a sample. */
  href?: string;
  /** What the link says — "All 42 stories", "The full table". */
  more?: string;
}) {
  const heading = (
    <h2 className="kicker text-micro tracking-[0.26em] text-ink">{title}</h2>
  );

  return (
    <div className="band-rule flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-rule-strong pt-4 pb-3.5">
      {href ? (
        <Link href={href} className="story">
          {heading}
        </Link>
      ) : (
        heading
      )}

      {note && (
        <p className="font-serif text-lede font-light italic text-faint">
          {note}
        </p>
      )}

      {href && more && (
        <Link
          href={href}
          className="ml-auto kicker text-micro tracking-[0.15em] text-faint transition-colors hover:text-accent"
        >
          {more} →
        </Link>
      )}
    </div>
  );
}

/**
 * A rail beside the main column: a heavy underlined label, then a list.
 *
 * The rail is the other half of the page's grammar — the wire down the side
 * of the front page, "also across this section", "also on this desk". They
 * were three different components with three different headings.
 */
export function RailHead({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="kicker mb-4 border-b-2 border-ink pb-2.5 text-micro tracking-[0.22em]">
      {children}
    </h2>
  );
}
