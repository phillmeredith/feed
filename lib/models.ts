import { cache } from "react";
import store from "../data/models.json" with { type: "json" };

export interface ModelRelease {
  id: string;
  name: string;
  lab: string;
  releasedAt: string;
  likes: number;
  downloads: number;
  url: string;
  /** Open weights on the Hub, or a closed model known only from reporting. */
  weights: "open" | "closed";
  /** For closed models, the story here that reported the release. */
  storyId?: string;
}

/** Labs whose names are worth showing in full rather than as an org slug. */
const LAB_NAMES: Record<string, string> = {
  "meta-llama": "Meta",
  google: "Google",
  "deepseek-ai": "DeepSeek",
  Qwen: "Alibaba (Qwen)",
  "zai-org": "Zhipu AI",
  mistralai: "Mistral AI",
  microsoft: "Microsoft",
  nvidia: "NVIDIA",
  openai: "OpenAI",
  "allenai": "Allen Institute",
  "HuggingFaceTB": "Hugging Face",
  "stabilityai": "Stability AI",
  "black-forest-labs": "Black Forest Labs",
  "moonshotai": "Moonshot AI",
  "tencent": "Tencent",
  "baidu": "Baidu",
  "ibm-granite": "IBM",
};

interface HfModel {
  modelId?: string;
  id?: string;
  createdAt?: string;
  likes?: number;
  downloads?: number;
}

const MAX_AGE_DAYS = 120;

/**
 * Only first-party lab uploads. The Hub's like counts are dominated by
 * community merges, quantisations and fine-tunes, none of which are what
 * anyone means by "a new model came out".
 */
const LAB_ORGS = new Set(Object.keys(LAB_NAMES).map((o) => o.toLowerCase()));

/** Fine-tune and derivative markers, in case a lab org ever publishes one. */
const DERIVATIVE =
  /\b(uncensored|abliterated|heretic|merge|merged|fusion|distill|lora|gguf|awq|int[48]|fp8|mlx|onnx|exl2|turbo|coder-max)\b/i;

/**
 * Open-weight releases, straight from the Hub. Sorted by the past week's likes
 * rather than raw recency — the Hub takes thousands of uploads a day and almost
 * none of them are releases anyone means when they say "a new model came out".
 */
export const getModelReleases = cache(async function getModelReleases(): Promise<
  ModelRelease[]
> {
  try {
    const res = await fetch(
      "https://huggingface.co/api/models?sort=likes7d&direction=-1&limit=60",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];

    const rows = (await res.json()) as HfModel[];
    const cutoff = Date.now() - MAX_AGE_DAYS * 86_400_000;
    const seen = new Set<string>();
    const releases: ModelRelease[] = [];

    for (const row of rows) {
      const id = row.modelId ?? row.id;
      if (!id || !row.createdAt) continue;

      const released = new Date(row.createdAt);
      if (Number.isNaN(released.getTime()) || released.getTime() < cutoff) continue;

      const [org, ...rest] = id.split("/");
      const name = rest.join("/") || org;
      if (!name) continue;
      if (!LAB_ORGS.has(org.toLowerCase())) continue;
      if (DERIVATIVE.test(name)) continue;

      // One row per model family: the base weights, not every quantisation.
      const family = name.replace(/[-_](gguf|awq|int[48]|fp8|mlx|onnx|exl2).*$/i, "");
      const key = `${org}/${family}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      releases.push({
        id,
        name: family,
        lab: LAB_NAMES[org] ?? org,
        releasedAt: released.toISOString(),
        likes: row.likes ?? 0,
        downloads: row.downloads ?? 0,
        url: `https://huggingface.co/${id}`,
        weights: "open",
      });
    }

    return releases
      .sort((a, b) => b.releasedAt.localeCompare(a.releasedAt))
      .slice(0, 15);
  } catch {
    return [];
  }
});

/*
 * Closed models publish no machine-readable release record — there is no Hub
 * entry for GPT-6 Astra or Gemini 3.8 Flash. They are recovered from the desk's
 * own reporting instead, which is the only place their releases are recorded.
 */
const FAMILIES: [RegExp, string][] = [
  [/\bGPT-[\w.]+(?:\s+(?:Astra|Turbo|Pro|Mini|Ultra|Omni))?/i, "OpenAI"],
  [/\bGemini\s+[\w.]+(?:\s+(?:Flash|Pro|Ultra|Nano|Cyber|Thinking))*/i, "Google DeepMind"],
  [/\bClaude\s+(?:Opus|Sonnet|Haiku|Fable|Mythos)\s*[\w.]*/i, "Anthropic"],
  [/\bLlama\s+[\w.]+/i, "Meta"],
  [/\bGrok\s+[\w.]+/i, "xAI"],
  [/\bo\d(?:-\w+)?\b/, "OpenAI"],
];

const RELEASE_VERB =
  /\b(releas\w*|launch\w*|unveil\w*|introduc\w*|announc\w*|ship\w*|roll\w*\s+out|now available|debut\w*)\b/i;

interface CoverageArticle {
  id: string;
  category: string;
  headline: string;
  publishedAt: string;
}

export function modelsFromCoverage(articles: CoverageArticle[]): ModelRelease[] {
  const found = new Map<string, ModelRelease>();

  for (const article of articles) {
    if (article.category !== "ai") continue;
    if (!RELEASE_VERB.test(article.headline)) continue;

    for (const [pattern, lab] of FAMILIES) {
      const match = article.headline.match(pattern);
      if (!match) continue;

      const name = match[0].replace(/\s+/g, " ").trim();
      const key = name.toLowerCase();
      const existing = found.get(key);
      // Keep the earliest report: that's the release.
      if (existing && existing.releasedAt <= article.publishedAt) break;

      found.set(key, {
        id: `coverage:${key}`,
        name,
        lab,
        releasedAt: article.publishedAt,
        likes: 0,
        downloads: 0,
        url: `/story/${article.id}`,
        weights: "closed",
        storyId: article.id,
      });
      break;
    }
  }

  return [...found.values()];
}

/**
 * The table as shown: open weights from the Hub, plus closed models — those
 * seen in today's coverage merged over everything recorded previously, since a
 * publisher's feed drops a release within days of announcing it.
 */
export async function getAllModelReleases(
  articles: CoverageArticle[]
): Promise<ModelRelease[]> {
  const open = await getModelReleases();

  const closed = new Map<string, ModelRelease>();
  for (const item of store.items as ModelRelease[]) {
    closed.set(item.name.toLowerCase(), item);
  }
  // Live coverage wins: it carries the story link.
  for (const item of modelsFromCoverage(articles)) {
    closed.set(item.name.toLowerCase(), item);
  }

  return [...closed.values(), ...open]
    .sort((a, b) => b.releasedAt.localeCompare(a.releasedAt))
    .slice(0, 18);
}
