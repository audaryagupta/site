import { prisma } from "./prisma";
import type {
  ButtonValue,
  ContentValue,
  ImageValue,
  TextValue,
} from "./siteContentTypes";

// Editable site content is stored in the existing Setting key/value table under
// the "content:" prefix, one JSON blob per editable region. Server pages call
// getSiteContent() and hand each region's saved value (if any) to the inline
// Editable* components, which fall back to their built-in defaults otherwise.
export const CONTENT_PREFIX = "content:";

export type SiteContentMap = Record<string, ContentValue>;

export async function getSiteContent(): Promise<SiteContentMap> {
  const rows = await prisma.setting.findMany({
    where: { key: { startsWith: CONTENT_PREFIX } },
  });
  const map: SiteContentMap = {};
  for (const r of rows) {
    try {
      map[r.key.slice(CONTENT_PREFIX.length)] = JSON.parse(r.value) as ContentValue;
    } catch {
      // Ignore malformed rows rather than breaking the page render.
    }
  }
  return map;
}

// Merge a saved region value with its built-in default, so a page always has a
// complete value to hand to the Editable* component.
export function pickText(
  map: SiteContentMap,
  id: string,
  defText: string,
  defScale = 1
): TextValue {
  const v = map[id] as TextValue | undefined;
  return { text: v?.text ?? defText, scale: v?.scale ?? defScale };
}

// Shorthand for plain text regions (no per-element font scaling): returns the
// saved string for `id`, or the built-in default.
export function pickStr(
  map: SiteContentMap,
  id: string,
  def: string
): string {
  const v = map[id] as TextValue | undefined;
  return typeof v?.text === "string" && v.text.length > 0 ? v.text : def;
}

export function pickButton(
  map: SiteContentMap,
  id: string,
  defLabel: string,
  defHref: string
): ButtonValue {
  const v = map[id] as ButtonValue | undefined;
  return { label: v?.label ?? defLabel, href: v?.href ?? defHref };
}

export function pickImage(
  map: SiteContentMap,
  id: string,
  def: Partial<ImageValue> & { src: string }
): ImageValue {
  const v = map[id] as ImageValue | undefined;
  return {
    src: v?.src ?? def.src,
    fit: v?.fit ?? def.fit ?? "cover",
    posX: v?.posX ?? def.posX ?? 50,
    posY: v?.posY ?? def.posY ?? 50,
    height: v?.height ?? def.height ?? null,
    radius: v?.radius ?? def.radius ?? 24,
  };
}
