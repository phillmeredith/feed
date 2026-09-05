import Link from "next/link";
import type { GearItem } from "@/lib/gear";

function when(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

/** "SonyE|SonyFE" reads better as "Sony E · FE". */
function mountLabel(mounts: string[]) {
  return mounts
    .map((m) => m.replace(/([a-z])([A-Z])/g, "$1 $2"))
    .join(" · ");
}

function Row({ item }: { item: GearItem }) {
  const detail = [item.focal, item.mounts ? mountLabel(item.mounts) : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="flex items-baseline gap-3 py-1.5">
      <span className="kicker text-[9px] text-faint w-16 shrink-0">
        {when(item.announcedAt)}
      </span>
      <span className="min-w-0">
        {item.storyId ? (
          <Link
            href={`/story/${item.storyId}`}
            className="font-body text-[15px] hover:text-accent transition-colors"
          >
            {item.name}
          </Link>
        ) : (
          <span className="font-body text-[15px]">{item.name}</span>
        )}
        {detail && (
          <span className="font-body text-[13px] text-faint"> — {detail}</span>
        )}
      </span>
    </li>
  );
}

function ByBrand({ items }: { items: GearItem[] }) {
  // Brands ordered by their most recent release.
  const brands = [...new Set(items.map((i) => i.brand))];

  return (
    <div className="mt-6 grid gap-x-12 gap-y-10 sm:grid-cols-2">
      {brands.map((brand) => (
        <div key={brand} className="break-inside-avoid">
          <h4 className="display text-base text-accent border-b border-rule pb-1">
            {brand}
          </h4>
          <ul className="mt-2">
            {items
              .filter((i) => i.brand === brand)
              .map((item) => (
                <Row key={item.name} item={item} />
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Group({
  title,
  count,
  items,
}: {
  title: string;
  count: string;
  items: GearItem[];
}) {
  if (items.length === 0) return null;
  return (
    <details className="today group border-t border-rule py-6">
      <summary className="flex flex-wrap items-baseline justify-between gap-4 cursor-pointer list-none">
        <span className="flex items-baseline gap-3">
          <h3 className="display text-xl">{title}</h3>
          <span className="kicker text-[10px] text-accent">{count}</span>
        </span>
        <span className="kicker text-[10px] text-muted">
          <span className="group-open:hidden">Show →</span>
          <span className="hidden group-open:inline">Hide ↑</span>
        </span>
      </summary>
      <ByBrand items={items} />
    </details>
  );
}

/**
 * The catalogue, from DPReview's product database, newest first. Entries link
 * to the story here when this desk covered the announcement.
 */
export function GearDirectory({ items }: { items: GearItem[] }) {
  if (items.length === 0) return null;

  const bodies = items.filter((i) => i.kind === "body");
  const oem = items.filter((i) => i.kind === "lens" && !i.independent);
  const thirdParty = items.filter((i) => i.kind === "lens" && i.independent);

  return (
    <section className="mt-20 border-t border-rule pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4 pb-2">
        <h2 className="display text-2xl sm:text-3xl">The directory</h2>
        <p className="font-serif italic text-sm text-muted">
          {bodies.length} cameras · {oem.length + thirdParty.length} lenses ·
          newest first
        </p>
      </div>

      <Group
        title="Cameras"
        count={`${bodies.length} bodies`}
        items={bodies}
      />
      <Group
        title="Lenses — own brand"
        count={`${oem.length}`}
        items={oem}
      />
      <Group
        title="Lenses — third party"
        count={`${thirdParty.length}`}
        items={thirdParty}
      />
    </section>
  );
}
