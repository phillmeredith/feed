import type { Category, CategorySlug, Group } from "./types";

export const categories: Category[] = [
  {
    slug: "ai",
    group: "technology",
    label: "AI Models",
    short: "AI",
    dek: "New releases from the labs",
    standfirst:
      "Frontier and open-weight model releases, tracked from the labs themselves rather than the commentary around them.",
  },
  {
    slug: "hardware",
    group: "technology",
    label: "Hardware",
    short: "Hardware",
    dek: "Apple, Samsung & the rest",
    standfirst:
      "Phones, laptops, silicon and everything else worth knowing about — straight from the newsrooms that announce it.",
  },
  {
    slug: "cameras",
    group: "photography",
    label: "Cameras & Lenses",
    short: "Cameras",
    dek: "Full-frame, medium format, glass",
    standfirst:
      "Bodies, sensors and glass: full-frame, medium format and the rumour mill that runs ahead of both.",
  },
  {
    slug: "vehicles",
    group: "technology",
    label: "Electric Vehicles",
    short: "EVs",
    dek: "New models, new ranges",
    standfirst:
      "New models, new platforms, new range figures — and the charging infrastructure catching up with them.",
  },
  {
    slug: "lenses",
    group: "photography",
    label: "Lenses",
    short: "Lenses",
    dek: "Glass, mounts and optics",
    standfirst:
      "Lens announcements and reviews — first-party glass and the third-party makers building for everyone else's mounts.",
  },
  {
    slug: "technique",
    group: "photography",
    label: "Technique",
    short: "Technique",
    dek: "Craft, process and the work itself",
    standfirst:
      "How pictures actually get made: light, process, post-production and the photographers explaining their own work.",
  },
  {
    slug: "sports",
    label: "Sport",
    short: "Sport",
    dek: "Formula 1 & golf",
    standfirst: "Formula 1 and golf: results, technical developments and the season as it turns.",
  },
  {
    slug: "science",
    label: "Science",
    short: "Science",
    dek: "Health & materials breakthroughs",
    standfirst:
      "Health, materials and physics — findings that matter, from journals and research groups.",
  },
  {
    slug: "robotics",
    group: "technology",
    label: "Robotics",
    short: "Robotics",
    dek: "Humanoids, autonomy & the factory floor",
    standfirst:
      "Humanoid and industrial robotics — Tesla, Figure, Boston Dynamics and the rest — from the outlets that cover the field rather than the hype around it.",
  },
  {
    slug: "weather",
    label: "Weather",
    short: "Weather",
    dek: "The forecast, and the planet behind it",
    standfirst:
      "Today's forecast in full, then the science underneath it — the climate system, El Niño and the ocean, and what the record is actually showing.",
  },
  {
    slug: "screen",
    label: "Screen",
    short: "Screen",
    dek: "Film, television & what's newly watchable",
    standfirst:
      "Film and television worth the time, led by critics rather than trade announcements — plus the reporting on how it all actually circulates.",
  },
  {
    slug: "wire",
    label: "The Wire",
    short: "Wire",
    dek: "Measured reporting, no noise",
    standfirst:
      "Independent and nonprofit reporting — ProPublica, The Conversation, The Markup, Bellingcat — chosen for evidence over volume, and capped so no single outlet sets the agenda.",
  },
];

export const groups: Group[] = [
  {
    slug: "technology",
    label: "Technology",
    dek: "Models, machines and what ships",
    standfirst:
      "The AI labs, the hardware makers, the robotics field and the cars — every desk where something new actually ships.",
    desks: ["ai", "hardware", "robotics", "vehicles"],
  },
  {
    slug: "photography",
    label: "Photography",
    dek: "Cameras, glass and craft",
    standfirst:
      "Bodies, lenses and the craft of using them — announcements, reviews and the directory of what has been released.",
    desks: ["cameras", "lenses", "technique"],
  },
];

export function groupBySlug(slug: string) {
  return groups.find((g) => g.slug === slug);
}

/** Nav entries: groups first, then any desk that stands on its own. */
export function navItems(): { slug: string; label: string }[] {
  const grouped = new Set(groups.flatMap((g) => g.desks));
  return [
    ...groups.map((g) => ({ slug: g.slug, label: g.label })),
    ...categories
      .filter((c) => !grouped.has(c.slug))
      .map((c) => ({ slug: c.slug, label: c.short })),
  ];
}

/** Desks that get their own block on the front page. The wire sits in the rail. */
export const desks = categories.filter((c) => c.slug !== "wire");

export function categoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function isCategorySlug(slug: string): slug is CategorySlug {
  return categories.some((c) => c.slug === slug);
}
