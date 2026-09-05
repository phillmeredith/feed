import type { GearItem } from "./gear";
import { gearDirectory } from "./gear";
import type { Article } from "./types";

/**
 * What a product's name already tells you.
 *
 * There is no free, licensed catalogue of camera specifications — DPReview's
 * sits behind Cloudflare and isn't ours to republish. But photographers read
 * lens names as spec sheets, because that is what they are: "XF 400mm F4.5 R
 * LM OIS WR" states the focal length, the maximum aperture, the motor, the
 * stabilisation and the weather sealing. Parsing that is honest — every field
 * here is derived from the name on the box, and says so — and it covers most
 * of what you want to know before reading a review.
 *
 * Nothing is guessed. A field absent from the name is absent from the page.
 */
export interface DerivedSpec {
  label: string;
  value: string;
  /** Where this came from, so a licensing question has an answer. */
  from: "name" | "catalogue";
}

/** Manufacturer shorthand for image stabilisation. */
const STABILISATION: [RegExp, string][] = [
  [/\bOIS\b/, "Optical (OIS)"],
  [/\bOSS\b/, "Optical (OSS)"],
  [/\bVR\b/, "Vibration Reduction"],
  [/\bIS\b/, "Image Stabilizer"],
  [/\bVC\b/, "Vibration Compensation"],
  [/\bO\.?I\.?S\.?\b/, "Optical"],
  [/\bPower ?O\.?I\.?S\.?\b/, "Power OIS"],
];

/** Focus motors, which decide how a lens behaves more than its optics do. */
const MOTORS: [RegExp, string][] = [
  [/\bLM\b/, "Linear motor"],
  [/\bUSM\b/, "Ultrasonic (USM)"],
  [/\bSTM\b/, "Stepping (STM)"],
  [/\bSSM\b/, "Supersonic (SSM)"],
  [/\bHSM\b/, "Hypersonic (HSM)"],
  [/\bVXD\b/, "Linear (VXD)"],
  [/\bRXD\b/, "Stepping (RXD)"],
  [/\bDDSSM\b/, "Direct drive SSM"],
  [/\bVCM\b/, "Voice coil"],
  [/\bAF\b/, "Autofocus"],
];

const SEALING = /\b(WR|WP|weather[- ]sealed|Dust[- ]and[- ]Splash)\b/i;

/** Mounts that are APS-C or smaller, so the format can be stated honestly. */
const CROP_MOUNTS: Record<string, string> = {
  FujifilmX: "APS-C",
  SonyE: "APS-C / full frame",
  CanonEFM: "APS-C",
  CanonRFS: "APS-C",
  NikonZDX: "APS-C",
  MicroFourThirds: "Micro Four Thirds",
  MFT: "Micro Four Thirds",
};

/** Mount codes as the catalogue writes them, to how they read. */
const MOUNT_NAMES: Record<string, string> = {
  FujifilmX: "Fujifilm X",
  FujifilmG: "Fujifilm G",
  SonyE: "Sony E",
  SonyA: "Sony A",
  CanonRF: "Canon RF",
  CanonEF: "Canon EF",
  CanonEFM: "Canon EF-M",
  CanonRFS: "Canon RF-S",
  NikonZ: "Nikon Z",
  NikonF: "Nikon F",
  NikonZDX: "Nikon Z DX",
  LeicaL: "Leica L",
  LeicaM: "Leica M",
  MicroFourThirds: "Micro Four Thirds",
  PentaxK: "Pentax K",
};

export function mountName(code: string) {
  return MOUNT_NAMES[code] ?? code.replace(/([a-z])([A-Z])/g, "$1 $2");
}

/** "24-70mm" is a zoom; "400mm" is a prime. */
function focalKind(focal?: string) {
  if (!focal) return null;
  return /\d+\s*-\s*\d+/.test(focal) ? "Zoom" : "Prime";
}

/** Maximum aperture as written: F4.5, f/1.2, F2.8-4. */
function maxAperture(name: string) {
  const match = name.match(/\bF\/?(\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?)\b/i);
  return match ? `f/${match[1].replace(/\s/g, "")}` : null;
}

export function specsFor(item: GearItem): DerivedSpec[] {
  const specs: DerivedSpec[] = [];
  const name = item.name;

  specs.push({ label: "Brand", value: item.brand, from: "catalogue" });
  specs.push({
    label: "Type",
    value: item.kind === "lens" ? "Lens" : "Camera body",
    from: "catalogue",
  });

  if (item.focal) {
    const kind = focalKind(item.focal);
    specs.push({
      label: "Focal length",
      value: kind ? `${item.focal} · ${kind}` : item.focal,
      from: "catalogue",
    });
  }

  const aperture = maxAperture(name);
  if (aperture) {
    specs.push({ label: "Maximum aperture", value: aperture, from: "name" });
  }

  if (item.mounts?.length) {
    specs.push({
      label: item.mounts.length > 1 ? "Mounts" : "Mount",
      value: item.mounts.map(mountName).join(", "),
      from: "catalogue",
    });
    const format = item.mounts.map((m) => CROP_MOUNTS[m]).find(Boolean);
    if (format) {
      specs.push({ label: "Format", value: format, from: "catalogue" });
    }
  }

  const stabilisation = STABILISATION.find(([re]) => re.test(name));
  if (stabilisation) {
    specs.push({ label: "Stabilisation", value: stabilisation[1], from: "name" });
  }

  const motor = MOTORS.find(([re]) => re.test(name));
  if (motor) {
    specs.push({ label: "Focus motor", value: motor[1], from: "name" });
  }

  if (SEALING.test(name)) {
    specs.push({ label: "Weather sealing", value: "Sealed", from: "name" });
  }

  if (item.independent) {
    specs.push({
      label: "Maker",
      value: "Third-party glass",
      from: "catalogue",
    });
  }

  return specs;
}

/** Readable, stable, URL-safe id for a product page. */
export function gearSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** The directory as stored, without today's coverage merged in. */
export function allGear(): GearItem[] {
  return gearDirectory([]);
}

export function gearBySlug(slug: string): GearItem | null {
  return allGear().find((item) => gearSlug(item.name) === slug) ?? null;
}

/**
 * Everything ever filed about this product.
 *
 * A product's page is worth more than its announcement: the rumour, the launch,
 * the hands-on and the review are one story told in instalments, and the site
 * already holds them all. Matched on the distinctive part of the name — brand
 * plus model — since "Sigma 85mm" alone would collect every 85mm ever made.
 */
export function coverageFor(item: GearItem, articles: Article[]): Article[] {
  const tokens = item.name
    .toLowerCase()
    .replace(/[^a-z0-9.\s/-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);

  if (tokens.length < 2) return [];

  return articles
    .filter((a) => {
      const haystack = `${a.headline} ${a.dek}`.toLowerCase();
      // Every token must appear: a product is identified by its whole name.
      return tokens.every((t) => haystack.includes(t));
    })
    .sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
}

/** Other glass for the same mount, or other bodies from the same brand. */
export function relatedGear(item: GearItem, limit = 10): GearItem[] {
  const all = allGear().filter((g) => g.name !== item.name);

  if (item.kind === "lens" && item.mounts?.length) {
    const mounts = new Set(item.mounts);
    const sameMount = all.filter(
      (g) => g.kind === "lens" && g.mounts?.some((m) => mounts.has(m))
    );
    if (sameMount.length >= 3) return sameMount.slice(0, limit);
  }

  return all.filter((g) => g.brand === item.brand).slice(0, limit);
}

/** Every mount in the directory, most glass first. */
export function mounts(): { code: string; name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const item of allGear()) {
    for (const m of item.mounts ?? []) {
      counts.set(m, (counts.get(m) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([code, count]) => ({ code, name: mountName(code), count }))
    .sort((a, b) => b.count - a.count);
}
