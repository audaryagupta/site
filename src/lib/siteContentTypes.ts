// Shared shapes for the in-page "Edit site" mode. Kept framework-free so both
// the server content loader and the client editor components can import them.

export type TextValue = {
  text: string;
  // Font-size multiplier applied on top of the design's base size (1 = default).
  scale: number;
};

export type ImageValue = {
  src: string;
  fit: "cover" | "contain";
  // Focal point of the image inside its frame, as percentages (0-100).
  posX: number;
  posY: number;
  // Frame height in pixels (null keeps the design's default aspect/height).
  height: number | null;
  radius: number;
};

export type ButtonValue = {
  label: string;
  href: string;
};

export type ContentValue = TextValue | ImageValue | ButtonValue;

export function isImageValue(v: ContentValue): v is ImageValue {
  return typeof (v as ImageValue).src === "string";
}

export function textValue(text: string, scale = 1): TextValue {
  return { text, scale };
}
