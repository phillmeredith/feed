import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Masthead } from "@/components/Masthead";
import { Footer } from "@/components/Footer";
import { ListCard } from "@/components/cards";
import { PriceHistory } from "@/components/PriceHistory";
import {
  allModels,
  modelBySlug,
  blendedPrice,
  formatPrice,
  formatContext,
  formatModality,
  storiesAbout,
} from "@/lib/catalogue";
import { modelSlug } from "@/lib/openrouter";
import { history } from "@/lib/series";
import { allArchived } from "@/lib/archive";

/*
 * Entity pages read from the store and never call an external API, so they cost
 * a render rather than a fetch. Hourly revalidation is enough: the catalogue is
 * rewritten by a scheduled script, not by traffic.
 */
export const revalidate = 3600;

/*
 * The catalogue runs to hundreds of models and most are never opened. The
 * recent slice is prerendered; the tail renders on first request and is cached
 * from then on, which keeps the build to seconds rather than minutes.
 */
export function generateStaticParams() {
  return allModels()
    .slice(0, 40)
    .map((m) => ({ slug: modelSlug(m.id) }));
}

export async function generateMetadata({
  params,
}: PageProps<"/model/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const model = modelBySlug(slug);
  if (!model) return { title: "Model not found — The Dispatch" };
  return {
    title: `${model.name} — The Dispatch`,
    description: `${model.lab}. ${formatPrice(model.inputPrice)} in, ${formatPrice(model.outputPrice)} out per million tokens, ${formatContext(model.contextTokens)} context.`,
  };
}

function Spec({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="border-t-2 border-accent-dim pt-3">
      <dt className="kicker text-[9px] text-faint">{label}</dt>
      <dd className="display text-[26px] mt-1.5 tabular-nums">{value}</dd>
      {note && <p className="text-[13px] text-muted mt-1 leading-snug">{note}</p>}
    </div>
  );
}

export default async function ModelPage({ params }: PageProps<"/model/[slug]">) {
  const { slug } = await params;
  const model = modelBySlug(slug);
  if (!model) notFound();

  const stories = storiesAbout(model, allArchived());

  const inputHistory = history("model-pricing", model.id, "price.input");
  const outputHistory = history("model-pricing", model.id, "price.output");

  const siblings = allModels()
    .filter((m) => m.lab === model.lab && m.id !== model.id)
    .slice(0, 8);

  return (
    <>
      <Masthead compact />

      <main className="mx-auto max-w-[1400px] px-5 sm:px-8 py-10 flex-1 w-full">
        <div className="border-b border-rule pb-8">
          <p className="kicker text-[10px] text-accent">
            <Link href="/ai" className="hover:underline">AI Models</Link>
            <span className="mx-2 text-rule">/</span>
            {model.lab}
          </p>
          <h1 className="display text-[clamp(2.2rem,5.5vw,4rem)] mt-4">
            {model.name}
          </h1>
          {model.description && (
            <p className="font-serif text-lg sm:text-xl text-muted mt-4 max-w-3xl">
              {model.description.split(". ").slice(0, 2).join(". ")}
            </p>
          )}
        </div>

        <dl className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Spec
            label="Input"
            value={formatPrice(model.inputPrice)}
            note="per million tokens"
          />
          <Spec
            label="Output"
            value={formatPrice(model.outputPrice)}
            note="per million tokens"
          />
          <Spec
            label="Blended"
            value={formatPrice(blendedPrice(model))}
            note="at three parts in to one out"
          />
          <Spec
            label="Context"
            value={formatContext(model.contextTokens)}
            note={formatModality(model)}
          />
        </dl>

        <PriceHistory
          input={inputHistory}
          output={outputHistory}
          since={inputHistory[0]?.at}
        />

        {stories.length > 0 && (
          <section className="mt-16">
            <h2 className="kicker text-[11px] text-accent border-b border-rule pb-3">
              On this desk
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stories.map((a) => (
                <ListCard key={a.id} article={a} />
              ))}
            </div>
          </section>
        )}

        {siblings.length > 0 && (
          <section className="mt-16 border-t border-rule pt-8">
            <h2 className="kicker text-[11px] text-accent">
              Also from {model.lab}
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {siblings.map((m) => (
                <Link
                  key={m.id}
                  href={`/model/${modelSlug(m.id)}`}
                  className="kicker text-[10px] text-muted bg-surface border border-rule px-3 py-2 hover:text-accent hover:border-accent-dim transition-colors"
                >
                  {m.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <p className="mt-16 text-[13px] text-faint">
          Pricing and context from OpenRouter&apos;s public catalogue.{" "}
          <Link href="/model" className="text-accent hover:underline">
            Compare every model →
          </Link>
        </p>
      </main>

      <Footer />
    </>
  );
}
