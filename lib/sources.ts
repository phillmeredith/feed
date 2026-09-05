import type { CategorySlug } from "./types";

export interface Source {
  name: string;
  url: string;
  category: CategorySlug;
  /** Higher wins when the same story appears in several feeds. */
  weight: number;
  /** Cap on items taken from this feed per refresh. */
  cap?: number;
  /** Broad-remit outlets whose items may belong to another desk. */
  generalist?: boolean;
  /** The company's own newsroom — writes about itself in the first person. */
  firstParty?: boolean;
  /** Feed artwork is a useless thumbnail; take the article's og:image instead. */
  thumbnailsOnly?: boolean;
}

/*
 * Every source here must be readable in full on The Dispatch — either it
 * syndicates the whole article, or its article pages can be read directly.
 * Paywalled outlets (FT, the Economist, Nature, Science, WSJ, Bloomberg) are
 * deliberately absent: they can never satisfy that rule.
 *
 * `npm run validate` checks this and fails on any source that regresses.
 */
export const sources: Source[] = [
  // AI models
  { name: "Google DeepMind", url: "https://deepmind.google/blog/rss.xml", category: "ai", weight: 10, firstParty: true, thumbnailsOnly: true },
  { name: "The Register", url: "https://www.theregister.com/software/ai_ml/headlines.atom", category: "ai", weight: 8, cap: 8 },
  { name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/technology-lab", category: "ai", weight: 8, cap: 8, generalist: true },
  { name: "Hugging Face", url: "https://huggingface.co/blog/feed.xml", category: "ai", weight: 7 },
  { name: "Google Research", url: "https://research.google/blog/rss/", category: "ai", weight: 6 },

  // Hardware
  { name: "Apple Newsroom", url: "https://www.apple.com/newsroom/rss-feed.rss", category: "hardware", weight: 10, firstParty: true },
  { name: "Samsung Newsroom", url: "https://news.samsung.com/global/feed", category: "hardware", weight: 9, cap: 8, firstParty: true },
  { name: "MacRumors", url: "https://feeds.macrumors.com/MacRumors-All", category: "hardware", weight: 8, cap: 12, generalist: true },
  { name: "SamMobile", url: "https://www.sammobile.com/feed/", category: "hardware", weight: 6, cap: 8, generalist: true },

  // Cameras & lenses
  { name: "DPReview", url: "https://www.dpreview.com/feeds/news.xml", category: "cameras", weight: 10 },
  { name: "PetaPixel", url: "https://petapixel.com/feed/", category: "cameras", weight: 8, generalist: true },
  { name: "Amateur Photographer", url: "https://amateurphotographer.com/feed/", category: "cameras", weight: 8, cap: 8 },
  { name: "Sony Alpha Rumors", url: "https://www.sonyalpharumors.com/feed/", category: "cameras", weight: 7 },
  { name: "Fuji Rumors", url: "https://www.fujirumors.com/feed/", category: "cameras", weight: 7 },

  // Photography technique — craft rather than kit announcements.
  { name: "Digital Photography School", url: "https://digital-photography-school.com/feed/", category: "technique", weight: 8, cap: 6 },
  { name: "The Phoblographer", url: "https://www.thephoblographer.com/feed/", category: "technique", weight: 7, cap: 6 },
  { name: "Fstoppers", url: "https://fstoppers.com/feed", category: "technique", weight: 7, cap: 6, generalist: true },

  // Electric vehicles
  { name: "Electrek", url: "https://electrek.co/feed/atom/", category: "vehicles", weight: 8, cap: 10 },
  { name: "InsideEVs", url: "https://insideevs.com/rss/articles/all/", category: "vehicles", weight: 8, cap: 10 },
  { name: "Teslarati", url: "https://www.teslarati.com/feed/", category: "vehicles", weight: 6, cap: 8 },

  // Sport — F1 & golf
  { name: "Motorsport Week", url: "https://www.motorsportweek.com/feed/", category: "f1", weight: 9, cap: 8 },
  { name: "Autosport", url: "https://www.autosport.com/rss/f1/news/", category: "f1", weight: 8, cap: 8 },
  { name: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/golf/rss.xml", category: "golf", weight: 8, cap: 8 },
  { name: "Golf.com", url: "https://golf.com/feed/", category: "golf", weight: 6, cap: 6 },
  { name: "MMA Fighting", url: "https://www.mmafighting.com/rss/index.xml", category: "ufc", weight: 8, cap: 8 },
  { name: "MMA Mania", url: "https://www.mmamania.com/rss/index.xml", category: "ufc", weight: 7, cap: 6 },

  // Science
  { name: "Quanta Magazine", url: "https://api.quantamagazine.org/feed/", category: "science", weight: 10, cap: 6 },
  { name: "Ars Technica Science", url: "https://feeds.arstechnica.com/arstechnica/science", category: "science", weight: 9, cap: 8 },
  { name: "ScienceAlert", url: "https://www.sciencealert.com/feed", category: "science", weight: 7, cap: 8 },
  { name: "New Atlas", url: "https://newatlas.com/science/index.rss", category: "science", weight: 7, cap: 8, generalist: true },
  { name: "Phys.org", url: "https://phys.org/rss-feed/breaking/", category: "science", weight: 6, cap: 6, generalist: true, thumbnailsOnly: true },
  { name: "Medical Xpress", url: "https://medicalxpress.com/rss-feed/", category: "science", weight: 5, cap: 6, generalist: true, thumbnailsOnly: true },

  // Robotics — humanoids, autonomy, industrial systems.
  { name: "IEEE Spectrum", url: "https://spectrum.ieee.org/feeds/topic/robotics.rss", category: "robotics", weight: 10, cap: 8 },
  { name: "The Robot Report", url: "https://www.therobotreport.com/feed/", category: "robotics", weight: 9, cap: 8 },
  { name: "TechCrunch Robotics", url: "https://techcrunch.com/category/robotics/feed/", category: "robotics", weight: 7, cap: 6 },
  { name: "New Atlas Robotics", url: "https://newatlas.com/robotics/index.rss", category: "robotics", weight: 7, cap: 6 },

  // Weather — the climate system rather than daily forecast churn.
  { name: "Carbon Brief", url: "https://www.carbonbrief.org/feed/", category: "weather", weight: 10, cap: 6 },
  { name: "NASA Earth Observatory", url: "https://earthobservatory.nasa.gov/feeds/earth-observatory.rss", category: "weather", weight: 10, cap: 6 },
  { name: "Yale Climate Connections", url: "https://yaleclimateconnections.org/feed/", category: "weather", weight: 8, cap: 6 },
  { name: "Inside Climate News", url: "https://insideclimatenews.org/feed/", category: "weather", weight: 8, cap: 6 },

  // Screen — film and television, led by criticism rather than trade press.
  { name: "RogerEbert.com", url: "https://www.rogerebert.com/feed", category: "screen", weight: 10, cap: 8 },
  { name: "IndieWire", url: "https://www.indiewire.com/feed/", category: "screen", weight: 9, cap: 8 },
  { name: "The Film Stage", url: "https://thefilmstage.com/feed/", category: "screen", weight: 8, cap: 8 },
  { name: "Little White Lies", url: "https://lwlies.com/feed/", category: "screen", weight: 8, cap: 6 },
  { name: "The A.V. Club", url: "https://www.avclub.com/rss", category: "screen", weight: 6, cap: 6, generalist: true },
  // Reports on how films and shows circulate, including piracy and takedowns.
  { name: "TorrentFreak", url: "https://torrentfreak.com/feed/", category: "screen", weight: 7, cap: 5 },

  /*
   * The wire — independent and nonprofit newsrooms rather than corporate
   * mastheads. Several (The Conversation, ProPublica, The Markup, Global
   * Voices) publish under Creative Commons, which makes them the most
   * defensible full-text sources on the site as well as the least shouty.
   */
  { name: "ProPublica", url: "https://www.propublica.org/feeds/propublica/main", category: "wire", weight: 10, cap: 6 },
  { name: "The Conversation", url: "https://theconversation.com/uk/articles.atom", category: "wire", weight: 9, cap: 6 },
  { name: "The Markup", url: "https://themarkup.org/feeds/rss.xml", category: "wire", weight: 9, cap: 5 },
  { name: "Bellingcat", url: "https://www.bellingcat.com/feed/", category: "wire", weight: 9, cap: 5 },
  { name: "Global Voices", url: "https://globalvoices.org/feed/", category: "wire", weight: 7, cap: 5 },
  { name: "Rest of World", url: "https://restofworld.org/feed/latest/", category: "wire", weight: 8, cap: 5 },
];
