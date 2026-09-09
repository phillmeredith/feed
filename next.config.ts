import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Artwork goes through the optimiser.
   *
   * Every picture on the site is the publisher's own file, linked straight
   * from their CDN at whatever size they happened to upload — a single MMA
   * Mania photograph in a 220px column measured 3.7MB, and one page of the
   * front carried a dozen of them. Routed through Next the same picture is
   * resized to the slot, converted to AVIF or WebP and cached at the edge,
   * which is the difference between megabytes and tens of kilobytes.
   *
   * The hostname pattern is open because the source list is: fifty feeds
   * today, and a new outlet is a line in `lib/sources.ts` rather than a
   * deploy-blocking addition here. Only images are ever requested, only over
   * https, and a URL that is not an image fails the same way it does now.
   */
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    // The widths the layout actually asks for, so the optimiser is not
    // generating renditions nothing on the site will ever request.
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600, 2048],
    imageSizes: [80, 128, 200, 256, 320, 420],
    formats: ["image/avif", "image/webp"],
    // A publisher's artwork does not change under its URL; when it does, the
    // URL changes with it.
    minimumCacheTTL: 604800,
  },

  /*
   * Old addresses that shouldn't die.
   *
   * Sport was one desk and is three now. Anything linking to the old slug —
   * a bookmark, a browser's autocomplete, this site's own history — should
   * land on the section rather than a 404.
   */
  async redirects() {
    return [
      { source: "/sports", destination: "/sport", permanent: true },
      { source: "/combat", destination: "/ufc", permanent: true },
      /*
       * Drivers moved under /f1/driver so that /f1/<something> is free for
       * the desk's own tabs. Anything linking to the old shape still lands.
       */
      /* Articles moved to each desk's own address; the fixtures moved off it. */
      { source: "/f1/articles", destination: "/f1", permanent: true },
      { source: "/golf/articles", destination: "/golf", permanent: true },
      { source: "/ufc/articles", destination: "/ufc", permanent: true },
      { source: "/f1/:driver(hamilton|russell|norris|leclerc|piastri|antonelli|max_verstappen|alonso|stroll|gasly|ocon|albon|sainz|hulkenberg|tsunoda|lawson|bearman|colapinto|bortoleto|hadjar|doohan)", destination: "/f1/driver/:driver", permanent: true },
    ];
  },
};

export default nextConfig;
