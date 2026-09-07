import type { ReactNode } from "react";

/**
 * A titled block of the page.
 *
 * The string `kicker text-[11px] text-accent border-b border-rule pb-3` was
 * written out in seven different components, which is how a heading ends up
 * 11px in one place and 10px in another for no reason anybody could name.
 * This is that heading, once.
 *
 * `note` is the thing to the right of the title — a count, a source, a date.
 * `action` is for a control belonging to the section, like the spoiler
 * switch, which had been squeezed into the heading markup at each call site.
 */
export function Panel({
  title,
  note,
  action,
  as: Heading = "h2",
  children,
}: {
  title: ReactNode;
  note?: ReactNode;
  action?: ReactNode;
  as?: "h2" | "h3";
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-6 flex-wrap border-b border-rule pb-3">
        <Heading className="kicker text-label text-accent">{title}</Heading>
        {note && (
          <p className="font-serif italic text-fine text-faint">{note}</p>
        )}
        {action}
      </div>
      {children}
    </section>
  );
}
