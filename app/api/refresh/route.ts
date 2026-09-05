import { revalidatePath } from "next/cache";
import { categories } from "@/lib/categories";

/**
 * Rebuilds every page so a reader never lands on a stale one.
 *
 * Next serves the cached page first and regenerates behind it, which means the
 * first visitor after the window expires always sees old content. On a site
 * with little traffic that is every visit. A scheduled hit here does the
 * regenerating instead, so pages are already fresh when someone arrives.
 */
export async function GET(request: Request) {
  const secret = process.env.REFRESH_SECRET;
  const provided = new URL(request.url).searchParams.get("secret");

  // Vercel's own scheduler is trusted; anything else needs the secret.
  const fromCron = request.headers.get("user-agent")?.includes("vercel-cron");
  if (secret && !fromCron && provided !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const paths = ["/", ...categories.map((c) => `/${c.slug}`)];
  for (const path of paths) revalidatePath(path);

  return Response.json({ refreshed: paths, at: new Date().toISOString() });
}
