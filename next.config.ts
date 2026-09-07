import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
