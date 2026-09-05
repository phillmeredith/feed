/**
 * Writes the model catalogue to disk.
 *
 * Entity pages read from `data/`, never from a live API. Desk pages already
 * run dynamic on a sixty-second budget, and the code comments record that
 * verifying 150 stories inside a request once exceeded Vercel's limits and
 * took them down. Hundreds of model pages each fetching a catalogue would be
 * the same mistake at greater scale, so the fetching happens here instead.
 *
 *   npm run catalogue:update
 */
import { writeFileSync } from "node:fs";
import { fetchCatalogue } from "../lib/openrouter.ts";

const STORE = new URL("../data/model-catalogue.json", import.meta.url);

const models = await fetchCatalogue();
if (models.length === 0) {
  console.error("catalogue empty — leaving the existing store alone");
  process.exit(1);
}

// Priced, generally available models only: the catalogue carries a long tail of
// routing aliases and free preview endpoints that aren't releases anyone means.
const priced = models
  .filter((m) => m.inputPrice !== null && m.outputPrice !== null)
  .sort((a, b) => (b.releasedAt ?? "").localeCompare(a.releasedAt ?? ""));

writeFileSync(
  STORE,
  JSON.stringify(
    {
      note: "Model catalogue from OpenRouter — pricing, context and modality. Written by npm run catalogue:update.",
      updated: new Date().toISOString(),
      items: priced,
    },
    null,
    2
  ) + "\n"
);

const labs = new Set(priced.map((m) => m.lab));
console.log(`${priced.length} priced models across ${labs.size} labs written to data/model-catalogue.json`);
