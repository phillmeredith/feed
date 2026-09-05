import { cache } from "react";
import type { CategorySlug } from "./types";
import store from "../data/patents.json" with { type: "json" };

export interface PatentFiling {
  id: string;
  title: string;
  assignee: string;
  filedAt: string;
  publicationNumber: string;
  desk: CategorySlug;
}

/**
 * Who each desk watches. Google Patents matches assignee names loosely, so the
 * common name works better here than the registered legal entity.
 */
export const WATCHED: Partial<Record<CategorySlug, string[]>> = {
  hardware: ["Apple Inc", "Samsung Electronics", "Google LLC", "Qualcomm", "Intel"],
  robotics: ["Tesla", "Boston Dynamics", "Figure AI", "Agility Robotics", "Skydio"],
  cameras: ["Canon", "Nikon", "Sony Group", "Fujifilm", "Panasonic"],
};

/*
 * USPTO retired its keyless APIs in 2025 — the Open Data Portal returns 401
 * without a key, and EPO's OPS 403s. Google Patents' own search backend needs
 * neither, and carries the same records: assignee, filing date, publication
 * number and title.
 */
const ENDPOINT = "https://patents.google.com/xhr/query";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";
const LOOKBACK_DAYS = 400;

interface GooglePatent {
  title?: string;
  assignee?: string;
  filing_date?: string;
  publication_number?: string;
}

interface GoogleResponse {
  results?: {
    user_error?: string;
    cluster?: { result?: { patent?: GooglePatent }[] }[];
  };
}

/** Search terms come back with the matched words wrapped in <b>. */
function clean(text: string) {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .replace(/,?\s*(inc|llc|corp(oration)?|ltd|kabushiki kaisha|co)\.?$/i, "")
    .trim();
}

export async function filingsFor(
  assignee: string,
  since: string,
  desk: CategorySlug
): Promise<PatentFiling[]> {
  // Encoded exactly once. Encoding the assignee and then the whole query
  // double-escaped the separators and Google rejected it as a syntax error.
  const query = `assignee=${assignee.replace(/ /g, "+")}&country=US&after=filing:${since}&sort=new`;

  try {
    const res = await fetch(`${ENDPOINT}?url=${encodeURIComponent(query)}&exp=`, {
      headers: { "User-Agent": UA },
      cache: "no-store",
    });
    if (!res.ok) return [];

    const data = (await res.json()) as GoogleResponse;
    if (data.results?.user_error) return [];

    const rows = data.results?.cluster?.[0]?.result ?? [];
    return rows.flatMap((row) => {
      const p = row.patent;
      if (!p?.title || !p.filing_date || !p.publication_number) return [];
      return [
        {
          id: p.publication_number,
          title: clean(p.title),
          assignee: clean(p.assignee ?? assignee),
          filedAt: p.filing_date,
          publicationNumber: p.publication_number,
          desk,
        },
      ];
    });
  } catch {
    return [];
  }
}

/** Filings for a desk, from the store the update script maintains. */
export const getPatents = cache(async function getPatents(
  desk: CategorySlug
): Promise<PatentFiling[]> {
  return (store.items as PatentFiling[])
    .filter((f) => f.desk === desk)
    .sort((a, b) => b.filedAt.localeCompare(a.filedAt))
    .slice(0, 12);
});
