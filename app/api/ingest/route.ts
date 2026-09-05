import { writeFile } from "node:fs/promises";

/**
 * Development-only import sink.
 *
 * DPReview's product database sits behind Cloudflare, so it can only be read
 * from a real browser. This lets that browser hand the extracted rows straight
 * to disk instead of routing them through anything else.
 *
 * Refuses to run outside development.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not available", { status: 404 });
  }

  const body = await request.text();
  if (body.length > 5_000_000) {
    return new Response("Too large", { status: 413 });
  }

  await writeFile(new URL("../../../data/dpreview.tsv", import.meta.url), body, "utf8");

  return new Response(JSON.stringify({ ok: true, bytes: body.length }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}
