/**
 * Reads the upcoming launch schedule into data/launches.json.
 *
 * Launch Library is keyless but rate-limited to a handful of calls an hour on
 * the anonymous tier, so this runs on a schedule and the pages read the store.
 *
 *   npm run launches:update
 */
import { writeFileSync } from "node:fs";
import type { Launch } from "../lib/launches.ts";

const STORE = new URL("../data/launches.json", import.meta.url);
const ENDPOINT =
  "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=40&mode=list";

interface RawLaunch {
  id: string;
  name: string;
  mission?: string;
  mission_type?: string;
  lsp_name?: string;
  pad?: string;
  location?: string;
  net?: string;
  net_precision?: { name?: string };
  status?: { name?: string; description?: string };
  image?: string;
}

const res = await fetch(ENDPOINT, {
  headers: { Accept: "application/json", "User-Agent": "TheDispatch/1.0" },
});
if (!res.ok) {
  console.error(`Launch Library → HTTP ${res.status}; leaving the store alone`);
  process.exit(1);
}

const body = (await res.json()) as { results?: RawLaunch[] };
const rows = body.results ?? [];
if (rows.length === 0) {
  console.error("no launches returned; leaving the store alone");
  process.exit(1);
}

/** "Soyuz 2.1b | Progress MS-35" — the rocket is the half before the pipe. */
function rocketOf(name: string) {
  return name.split("|")[0]?.trim() ?? name;
}

const items: Launch[] = rows.map((l) => ({
  id: l.id,
  name: l.name,
  mission: l.mission ?? "",
  missionType: l.mission_type ?? "",
  provider: l.lsp_name ?? "",
  rocket: rocketOf(l.name),
  pad: l.pad ?? "",
  location: l.location ?? "",
  net: l.net ?? "",
  precision: l.net_precision?.name ?? "",
  status: l.status?.name ?? "",
  statusNote: l.status?.description ?? "",
  image: l.image ?? undefined,
}));

writeFileSync(
  STORE,
  JSON.stringify(
    {
      note: "Upcoming launches from The Space Devs' Launch Library. Written by npm run launches:update.",
      updated: new Date().toISOString(),
      items,
    },
    null,
    2
  ) + "\n"
);

const soon = items.filter((i) => new Date(i.net) > new Date()).length;
console.log(`${items.length} launches written, ${soon} still ahead`);
