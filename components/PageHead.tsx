import Link from "next/link";
import type { ReactNode } from "react";
import { SubNav } from "./SubNav";
import { DeskTabs } from "./DeskTabs";
import type { CategorySlug } from "@/lib/types";

/*
 * Two thirds and a third, and every other two-column block on these pages
 * uses the same split.
 *
 * They did not, and it showed: the head was 1.35:1 and the opener beneath it
 * 2:1, so the page drew two vertical rules a few centimetres apart and a few
 * centimetres out of line with each other. A rule down a page is a claim that
 * the columns either side of it are the columns of the page; two of them
 * disagreeing says neither is.
 */
const PAGE_COLUMNS = "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]";

/**
 * The head of an interior page.
 *
 * Eleven pages were each writing this out by hand — a section link, the desk
 * nav, a title, a standfirst, a line of counts, the desk tabs — and no two of
 * them agreed. The section link was `display text-subhead` on three pages and
 * `display text-2xl` on another; the title was `text-title` here and
 * `text-nameplate` there; two pages had the standfirst above the nav and the
 * rest below it. A reader moving between them was being shown a different
 * publication each time.
 *
 * The order is the hierarchy narrowing: the section, the desks inside it,
 * then this page and the tabs inside that. The title and the standfirst sit
 * either side of a rule, which is the same two-column head the front page
 * gives its dwell — an interior page opens like a page of the same paper.
 */
export function PageHead({
  section,
  subnav,
  title,
  standfirst,
  meta,
  tabs,
}: {
  /** The section this page belongs to, linked. */
  section?: { label: string; href: string };
  /** The desk nav for that section, marking the current desk. */
  subnav?: { group: string; current: string };
  title: string;
  standfirst?: ReactNode;
  /** Counts, timestamps — the line a reader checks rather than reads. */
  meta?: ReactNode;
  /** The tabs within this desk, marking the current one. */
  tabs?: { desk: CategorySlug; current?: string };
}) {
  return (
    <header>
      {section && (
        <Link href={section.href} className="story mb-6 inline-block">
          <h2 className="kicker text-micro tracking-[0.24em] text-accent">
            {section.label}
          </h2>
        </Link>
      )}

      {subnav && <SubNav group={subnav.group} current={subnav.current} />}

      <div className={`band-rule mt-7 grid items-start gap-x-gutter gap-y-5 pt-7 ${PAGE_COLUMNS}`}>
        <h1 className="display text-nameplate">{title}</h1>

        {(standfirst || meta) && (
          <div className="lg:rule-l">
            {standfirst && (
              <p className="standfirst text-[1.15rem] leading-[1.55]">
                {standfirst}
              </p>
            )}
            {meta && <p className="source mt-4">{meta}</p>}
          </div>
        )}
      </div>

      {tabs && <DeskTabs desk={tabs.desk} current={tabs.current} />}
    </header>
  );
}

/**
 * The head of an entity page — one lens, one model, one race, one card.
 *
 * The same two columns as a section head, opened by a breadcrumb rather than
 * a section name, because an entity is reached through something and a reader
 * needs the way back. Six pages were writing their own; the breadcrumb
 * separator alone was a slash on four of them and a middot on two.
 */
export function EntityHead({
  subnav,
  trail,
  title,
  note,
  meta,
  tabs,
  children,
}: {
  /** The desk nav for the section this entity sits in. */
  subnav?: { group: string; current: string };
  /** The way back, in order. The last item is where this page sits. */
  trail: { label: string; href?: string }[];
  title: string;
  /** The italic line under the title: a date, a venue, a nationality. */
  note?: ReactNode;
  meta?: ReactNode;
  /** The tabs within the desk this entity belongs to. */
  tabs?: { desk: CategorySlug; current?: string };
  /** Anything the entity needs in the right column instead of a note. */
  children?: ReactNode;
}) {
  return (
    <header>
      {subnav && <SubNav group={subnav.group} current={subnav.current} />}

      <p className={`kicker text-micro tracking-[0.24em] text-accent ${subnav ? "mt-7" : ""}`}>
        {trail.map((step, i) => (
          <span key={`${step.label}-${i}`}>
            {i > 0 && <span className="mx-2 text-rule-strong">·</span>}
            {step.href ? (
              <Link href={step.href} className="hover:underline">
                {step.label}
              </Link>
            ) : (
              <span className="text-faint">{step.label}</span>
            )}
          </span>
        ))}
      </p>

      <div className={`band-rule mt-6 grid items-start gap-x-gutter gap-y-5 pt-7 ${PAGE_COLUMNS}`}>
        <h1 className="display text-title">{title}</h1>

        {(note || meta || children) && (
          <div className="lg:rule-l">
            {note && (
              <p className="font-serif text-lede italic text-muted">{note}</p>
            )}
            {children}
            {meta && <p className="source mt-4">{meta}</p>}
          </div>
        )}
      </div>

      {tabs && <DeskTabs desk={tabs.desk} current={tabs.current} />}
    </header>
  );
}
