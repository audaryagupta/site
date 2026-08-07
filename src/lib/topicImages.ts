// Curated, open-license (Wikimedia Commons / public-domain / CC) images keyed
// to common business/finance/tech topics. Used to add a little colour to the
// Weekly Recap and the Now page for stories that don't ship their own photo —
// so there is NEVER any copyright risk. Images are served through Wikimedia's
// stable Special:FilePath endpoint (redirects to a correctly-sized thumbnail),
// credited as "Wikimedia Commons".
//
// Kept deliberately small and only applied to a couple of stories per issue.

export interface TopicImage {
  url: string;
  credit: string;
}

const CREDIT = "Wikimedia Commons";

// Build a stable, always-valid Commons image URL for a given file name.
function commons(file: string, width = 536): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
    file
  )}?width=${width}`;
}

// Ordered: earlier, more specific keywords win. Each file is verified to exist
// on Wikimedia Commons under a free licence.
const TOPIC_IMAGES: { keys: string[]; file: string }[] = [
  {
    keys: ["european union", "brussels", "eu ", " eu.", "europe"],
    file: "Flag of Europe.svg",
  },
  {
    keys: ["federal reserve", "the fed", "interest rate", "rate cut", "rate hike", "central bank"],
    file: "Seal of the United States Federal Reserve System.svg",
  },
  {
    keys: ["wall street", "stock market", "stocks", "s&p", "dow ", "nasdaq", "equities", "shares", "ipo"],
    file: "New York Stock Exchange Facade 2015.jpg",
  },
  {
    keys: ["bitcoin", "crypto", "ethereum", "stablecoin"],
    file: "Bitcoin.svg",
  },
  {
    keys: ["nvidia", "semiconductor", "chip", "chips", "gpu"],
    file: "2788-2888 San Tomas Expwy.jpg",
  },
  {
    keys: ["openai", "chatgpt", "artificial intelligence", "ai model", " ai ", "a.i.", "data center", "data centre", "cloud comput"],
    file: "Utah Data Center Panorama (cropped).jpg",
  },
  {
    keys: ["google", "alphabet"],
    file: "Googleplex HQ (cropped).jpg",
  },
  {
    keys: ["microsoft"],
    file: "Aerial Microsoft West Campus August 2009.jpg",
  },
  {
    keys: ["amazon"],
    file: "Amazon Tower I topped out, June 2015.jpg",
  },
  {
    keys: ["meta", "facebook", "instagram", "whatsapp"],
    file: "Meta HQ 2023.png",
  },
  {
    keys: ["apple", "iphone", "ipad", "mac "],
    file: "Apple logo black.svg",
  },
  {
    keys: ["tesla", "electric vehicle", "electric car", " ev ", "ev "],
    file: "Model S charging at a Tesla station cropped.jpg",
  },
  {
    keys: ["solar", "renewable", "clean energy", "wind power"],
    file: "Andasol Guadix 4.jpg",
  },
  {
    keys: ["inflation", "consumer price", "cpi"],
    file: "World inflation rate.png",
  },
  {
    keys: ["bank of england", "united kingdom", "britain", "uk econ"],
    file: "Bank-of-England.jpg",
  },
];

/** Best open-license image for a headline, or null if nothing obvious matches. */
export function topicImageFor(title: string): TopicImage | null {
  const hay = ` ${title.toLowerCase()} `;
  for (const entry of TOPIC_IMAGES) {
    if (entry.keys.some((k) => hay.includes(k))) {
      return { url: commons(entry.file), credit: CREDIT };
    }
  }
  return null;
}

/**
 * Enrich a list of stories with open-license images: fills `imageUrl`/`source`
 * for up to `max` stories that don't already have an image, using distinct
 * pictures so the issue doesn't repeat the same photo.
 */
export function withTopicImages<
  T extends { title: string; imageUrl?: string; source?: string }
>(stories: T[], max = 3): T[] {
  const used = new Set<string>();
  let added = 0;
  return stories.map((s) => {
    const hasImage = !!(s.imageUrl && s.imageUrl.trim());
    if (hasImage || added >= max) return s;
    const pick = topicImageFor(s.title);
    if (!pick || used.has(pick.url)) return s;
    used.add(pick.url);
    added += 1;
    return { ...s, imageUrl: pick.url, source: s.source || pick.credit };
  });
}
