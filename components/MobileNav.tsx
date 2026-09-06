"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Phone navigation. The desk list used to run along a horizontally scrolling
 * strip beneath the masthead, which on a 390px screen left the last three
 * desks off the right edge with nothing to suggest they were there. A button
 * costs one tap and shows the whole paper.
 */
export function MobileNav({
  items,
}: {
  items: { slug: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const button = useRef<HTMLButtonElement>(null);

  /*
   * Following a link re-renders the page under the panel rather than
   * unmounting it, so the panel has to be told the reader has left. Adjusting
   * during render rather than in an effect: React re-runs this component
   * before touching the DOM, so the panel never paints over the new page.
   */
  const [shownFor, setShownFor] = useState(pathname);
  if (pathname !== shownFor) {
    setShownFor(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("keydown", onKey);

    /* The panel covers the page, and a covered page that still scrolls under
       the finger is the standard iOS overlay complaint. */
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const bar =
    "absolute left-0 h-[1.5px] w-6 bg-paper transition-all duration-200";

  return (
    <div className="lg:hidden">
      <button
        ref={button}
        type="button"
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        aria-controls="desk-menu"
        aria-label={open ? "Close sections" : "Sections"}
        /* Sits above its own panel so the same control closes it. */
        className="relative z-50 -mr-2 flex h-11 w-11 items-center justify-center"
      >
        <span className="relative block h-[14px] w-6">
          <span
            className={`${bar} ${
              open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
            }`}
          />
          <span
            className={`${bar} top-1/2 -translate-y-1/2 ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`${bar} ${
              open
                ? "top-1/2 -translate-y-1/2 -rotate-45"
                : "top-full -translate-y-full"
            }`}
          />
        </span>
      </button>

      {open && (
        <div
          id="desk-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Sections"
          className="fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-void"
        >
          <nav className="flex min-h-full flex-col px-5 pt-24 pb-16">
            <Link href="/" className="kicker border-b border-rule pb-4 text-[10px]">
              {/* Anchors take `color: inherit` site-wide, so the colour has to
                  go on something inside the link rather than on the link. */}
              <span className="text-faint">Front page</span>
            </Link>

            {items.map((item) => {
              const here = pathname === `/${item.slug}`;
              return (
                <Link
                  key={item.slug}
                  href={`/${item.slug}`}
                  aria-current={here ? "page" : undefined}
                  className="display border-b border-rule py-4 text-[clamp(1.75rem,7.5vw,2.25rem)]"
                >
                  <span className={here ? "text-accent" : "text-paper"}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
