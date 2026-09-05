import { getMarkets, formatPrice } from "../lib/markets.ts";
const quotes = await getMarkets();
for (const q of quotes) {
  console.log(`${q.label.padEnd(12)} ${formatPrice(q).padStart(12)}  ${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%`);
}
console.log(`\n${quotes.length} quotes returned`);
