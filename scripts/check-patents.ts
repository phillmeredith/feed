/**
 * Checks the patents feed is returning real filings.
 *
 *   npm run patents:check
 */
import { getPatents } from "../lib/patents.ts";

for (const desk of ["hardware", "robotics", "cameras"] as const) {
  const filings = await getPatents(desk);
  console.log(`\n${desk}: ${filings.length} filings`);
  for (const f of filings.slice(0, 5)) {
    console.log(`  ${f.filedAt}  ${f.assignee.padEnd(22)} ${f.title.slice(0, 60)}`);
  }
}
