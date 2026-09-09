import Link from "next/link";
import type { Metadata } from "next";
import { Masthead } from "@/components/Masthead";
import { SubNav } from "@/components/SubNav";
import { DeskTabs } from "@/components/DeskTabs";
import { Footer } from "@/components/Footer";
import { allGear, gearSlug, mounts } from "@/lib/gearspec";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Gear directory — The Dispatch",
  description:
    "Every camera body and lens the desk has recorded, newest first, each with its own page.",
};

export default function GearIndex() {
  const items = allGear();
  const lenses = items.filter((i) => i.kind === "lens");
  const bodies = items.filter((i) => i.kind === "body");
  const independent = lenses.filter((i) => i.independent);
  const byMount = mounts().slice(0, 10);

  // Newest first, grouped by the month they were announced in.
  const groups = new Map<string, typeof items>();
  for (const item of items) {
    const key = new Date(item.announcedAt).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }

  return (
    <>
      <Masthead />

      <main className="sheet py-10 flex-1 w-full">
        <div className="pb-2">
          <p className="display text-subhead text-muted">
            <Link href="/photography" className="hover:text-accent transition-colors">
              Photography
            </Link>
          </p>

          <SubNav group="photography" current="cameras" />
          <h1 className="display text-title mt-4">
            Gear directory
          </h1>
          <p className="font-serif text-lg sm:text-xl text-muted mt-4 max-w-2xl">
            Every body and lens the desk has recorded — {lenses.length} lenses,{" "}
            {bodies.length} bodies, {independent.length} of the glass from
            makers building for other people&apos;s mounts.
          </p>

          <DeskTabs desk="cameras" current="directory" />
        </div>

        <section className="mt-10">
          <h2 className="kicker text-micro text-faint">By mount</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {byMount.map((m) => (
              <span
                key={m.code}
                className="kicker text-micro text-muted bg-surface border border-rule px-3 py-2"
              >
                {m.name}
                <span className="ml-2 text-accent figures">{m.count}</span>
              </span>
            ))}
          </div>
        </section>

        <div className="mt-14 flex flex-col gap-12">
          {[...groups.entries()].map(([month, group]) => (
            <section key={month}>
              <h2 className="panel-title">
                {month}
                <span className="ml-3 text-faint figures">
                  {group.length}
                </span>
              </h2>
              <div className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.map((item) => (
                  <Link
                    key={item.name}
                    href={`/gear/${gearSlug(item.name)}`}
                    className="group border-t border-rule pt-3"
                  >
                    <p className="font-body font-semibold text-body leading-snug group-hover:text-accent transition-colors">
                      {item.name}
                    </p>
                    <p className="kicker text-micro text-faint mt-1.5">
                      {item.kind === "lens" ? "Lens" : "Body"}
                      {item.focal && (
                        <>
                          <span className="mx-2 text-rule">/</span>
                          {item.focal}
                        </>
                      )}
                      {item.independent && (
                        <>
                          <span className="mx-2 text-rule">/</span>
                          <span className="text-muted">third-party</span>
                        </>
                      )}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}
