import { getFeed } from "@/lib/feed";

/**
 * Development-only snapshot of the current feed, used by the archive updater.
 * Running the real pipeline means the archive records exactly what the site
 * published, filters and all.
 */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not available", { status: 404 });
  }

  const { articles } = await getFeed();

  // Bodies are megabytes and get re-read on demand; the archive holds metadata.
  const items = articles.map(
    ({ id, category, headline, dek, source, url, image, publishedAt }) => ({
      id,
      category,
      headline,
      dek,
      source,
      url,
      image,
      publishedAt,
    })
  );

  return Response.json({ count: items.length, items });
}
