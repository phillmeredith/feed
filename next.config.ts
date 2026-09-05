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
    ];
  },
};

export default nextConfig;
