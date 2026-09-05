import Link from "next/link";
import type { Metadata } from "next";
import { Masthead } from "@/components/Masthead";
import { Footer } from "@/components/Footer";
import {
  allModels,
  labs,
  blendedPrice,
  formatPrice,
  formatContext,
  formatModality,
  catalogueUpdated,
} from "@/lib/catalogue";
import { modelSlug } from "@/lib/openrouter";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Every model, by what it costs — The Dispatch",
  description:
    "Token pricing, context window and modality for every generally available model, from OpenRouter's public catalogue.",
};

export default function ModelIndex() {
  const models = allModels();

  // Cheapest first on the blended figure, since that is the number that decides
  // what anything actually costs to run.
  const ranked = [...models]
    .filter((m) => (blendedPrice(m) ?? 0) > 0)
    .sort((a, b) => (blendedPrice(a) ?? 0) - (blendedPrice(b) ?? 0));

  const free = models.filter((m) => blendedPrice(m) === 0);
  const widest = [...models].sort((a, b) => b.contextTokens - a.contextTokens)[0];
  const updated = new Date(catalogueUpdated()).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });

  return (
    <>
      <Masthead compact />

      <main className="mx-auto max-w-[1400px] px-5 sm:px-8 py-10 flex-1 w-full">
        <div className="border-b border-rule pb-8">
          <p className="kicker text-[10px] text-accent">
            <Link href="/ai" className="hover:underline">AI Models</Link>
          </p>
          <h1 className="display text-[clamp(2.2rem,5.5vw,4rem)] mt-4">
            Every model, by what it costs
          </h1>
          <p className="font-serif text-lg sm:text-xl text-muted mt-4 max-w-2xl">
            The comparison no lab publishes about its rivals: token pricing,
            context and modality for {models.length} models across{" "}
            {labs().length} labs.
          </p>
          <p className="kicker text-[10px] text-faint mt-5">
            Updated {updated} · {free.length} free at point of use · widest
            context {formatContext(widest?.contextTokens ?? 0)}
          </p>
        </div>

        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[720px] text-[14px]">
            <thead>
              <tr className="border-b border-rule">
                <th className="kicker text-[9px] text-faint text-left pb-3 pr-4">Model</th>
                <th className="kicker text-[9px] text-faint text-left pb-3 pr-4">Lab</th>
                <th className="kicker text-[9px] text-faint text-right pb-3 pr-4">In</th>
                <th className="kicker text-[9px] text-faint text-right pb-3 pr-4">Out</th>
                <th className="kicker text-[9px] text-faint text-right pb-3 pr-4">Blended</th>
                <th className="kicker text-[9px] text-faint text-right pb-3 pr-4">Context</th>
                <th className="kicker text-[9px] text-faint text-left pb-3">Accepts</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((m) => (
                <tr key={m.id} className="border-b border-rule group">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/model/${modelSlug(m.id)}`}
                      className="font-body font-semibold group-hover:text-accent transition-colors"
                    >
                      {m.name}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-muted text-[13px]">{m.lab}</td>
                  <td className="py-3 pr-4 text-right tabular-nums text-muted">
                    {formatPrice(m.inputPrice)}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-muted">
                    {formatPrice(m.outputPrice)}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-accent">
                    {formatPrice(blendedPrice(m))}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-muted">
                    {formatContext(m.contextTokens)}
                  </td>
                  <td className="py-3 text-faint text-[12px]">
                    {formatModality(m)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-8 text-[13px] text-faint max-w-2xl">
          Blended is three parts input to one part output — a read-heavy ratio.
          Ranking on input price alone flatters models that charge five times as
          much to answer, which is most of them. Prices are USD per million
          tokens, from OpenRouter&apos;s public catalogue.
        </p>
      </main>

      <Footer />
    </>
  );
}
