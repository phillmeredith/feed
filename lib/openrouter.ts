import { cache } from "react";

/**
 * OpenRouter publishes, without a key, the one thing the labs never put in one
 * place: what every frontier model actually costs per token, alongside its
 * context window and modalities. It is the spine of the AI desk's reference
 * material, and the only price series on this site that can be collected for
 * nothing.
 */
export interface CatalogueModel {
  /** "anthropic/claude-opus-5" — stable, and used as the entity slug. */
  id: string;
  name: string;
  lab: string;
  /** USD per million tokens. */
  inputPrice: number | null;
  outputPrice: number | null;
  contextTokens: number;
  /** "text+image->text" as published. */
  modality: string;
  inputModalities: string[];
  releasedAt: string | null;
  description: string;
}

interface RawModel {
  id?: string;
  name?: string;
  created?: number;
  context_length?: number;
  description?: string;
  architecture?: {
    modality?: string;
    input_modalities?: string[];
  };
  pricing?: Record<string, unknown>;
}

/** Pricing arrives as per-token strings; a per-million figure is readable. */
function perMillion(raw: unknown): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return n * 1_000_000;
}

/** Vendor prefixes are lab names; tidy the ones that read badly. */
const LAB_NAMES: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  "meta-llama": "Meta",
  mistralai: "Mistral AI",
  "deepseek": "DeepSeek",
  qwen: "Alibaba (Qwen)",
  "x-ai": "xAI",
  microsoft: "Microsoft",
  nvidia: "NVIDIA",
  cohere: "Cohere",
  perplexity: "Perplexity",
  "moonshotai": "Moonshot AI",
  "z-ai": "Zhipu AI",
  amazon: "Amazon",
  ai21: "AI21",
};

function labOf(id: string) {
  const vendor = id.split("/")[0] ?? "";
  return LAB_NAMES[vendor.toLowerCase()] ?? vendor;
}

export function normalise(rows: RawModel[]): CatalogueModel[] {
  const models: CatalogueModel[] = [];
  for (const row of rows) {
    if (!row.id) continue;
    models.push({
      id: row.id,
      name: row.name?.replace(/^[^:]+:\s*/, "") ?? row.id,
      lab: labOf(row.id),
      inputPrice: perMillion(row.pricing?.prompt),
      outputPrice: perMillion(row.pricing?.completion),
      contextTokens: row.context_length ?? 0,
      modality: row.architecture?.modality ?? "",
      inputModalities: row.architecture?.input_modalities ?? [],
      releasedAt: row.created ? new Date(row.created * 1000).toISOString() : null,
      description: row.description ?? "",
    });
  }
  return models;
}

export async function fetchCatalogue(): Promise<CatalogueModel[]> {
  const res = await fetch("https://openrouter.ai/api/v1/models", {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const body = (await res.json()) as { data?: RawModel[] };
  return normalise(body.data ?? []);
}

/** Memoised per request, since several panels want the same list. */
export const getCatalogue = cache(async function getCatalogue() {
  try {
    return await fetchCatalogue();
  } catch {
    return [];
  }
});

/** Slug used for a model's own page: the vendor path, made URL-safe. */
export function modelSlug(id: string) {
  return id.replace(/[^a-z0-9]+/gi, "-").toLowerCase().replace(/^-|-$/g, "");
}
