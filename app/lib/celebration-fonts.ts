export const celebrationFonts = {
  classic: { label: "Classic", renderFamily: "Roboto" },
  elegant: { label: "Elegant", renderFamily: "Georgia" },
  modern: { label: "Modern", renderFamily: "Arial" },
  storybook: { label: "Storybook · Playfair Display", renderFamily: "Playfair Display" },
  typewriter: { label: "Typewriter · Courier Prime", renderFamily: "Courier Prime" },
  bold: { label: "Bold · Archivo Black", renderFamily: "Archivo Black" },
} as const;

export type CelebrationFont = keyof typeof celebrationFonts;

export function isCelebrationFont(value: unknown): value is CelebrationFont {
  return typeof value === "string" && Object.hasOwn(celebrationFonts, value);
}

export function celebrationClosingFont(font: CelebrationFont) {
  // Existing font choices retain the closing style used by their saved MP4s.
  return font === "classic" || font === "elegant" || font === "modern" ? "classic" : font;
}
