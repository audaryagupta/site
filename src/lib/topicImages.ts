// Curated, open-license (Wikimedia Commons / public-domain / CC) PHOTOGRAPHS
// keyed to common business/finance/tech topics. Used to add a little colour to
// the Weekly Recap and the Now page for stories that don't ship their own photo
// — so there is NEVER any copyright risk.
//
// Rules:
//   * Photographs only — NEVER logos, brand marks, flags, seals or charts.
//   * Every file is a real, freely-licensed image on Wikimedia Commons.
//   * At most TWO images are ever added to an issue, kept small on render.

export interface TopicImage {
  url: string;
  credit: string;
}

const CREDIT = "Wikimedia Commons";

// Build a stable, always-valid Commons image URL for a given file name. Kept at
// a modest width because the images are only ever shown as small thumbnails.
function commons(file: string, width = 400): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
    file
  )}?width=${width}`;
}

// Ordered: earlier, more specific keywords win. Each file is a genuine
// open-license PHOTOGRAPH (no logos / flags / seals / charts) verified to exist
// on Wikimedia Commons under a free licence.
const TOPIC_IMAGES: { keys: string[]; file: string }[] = [
  {
    keys: ["wall street", "stock market", "stocks", "s&p", "dow ", "nasdaq", "equities", "shares", "ipo"],
    file: "New York Stock Exchange Facade 2015.jpg",
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
    keys: ["tesla", "electric vehicle", "electric car", " ev ", "ev "],
    file: "Model S charging at a Tesla station cropped.jpg",
  },
  {
    keys: ["solar", "renewable", "clean energy", "wind power"],
    file: "Andasol Guadix 4.jpg",
  },
  {
    keys: ["bank of england", "united kingdom", "britain", "uk econ"],
    file: "Bank-of-England.jpg",
  },
];

/** Best open-license photo for a headline, or null if nothing obvious matches. */
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
 * Enrich a list of stories with open-license photos: fills `imageUrl`/`source`
 * for up to `max` stories that don't already have an image, using distinct
 * pictures so the issue doesn't repeat the same photo. Capped at 2 by default.
 */
export function withTopicImages<
  T extends { title: string; imageUrl?: string; source?: string }
>(stories: T[], max = 2): T[] {
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
