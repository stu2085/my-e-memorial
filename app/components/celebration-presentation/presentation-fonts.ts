import { Archivo_Black, Courier_Prime, Playfair_Display } from "next/font/google";
import type { CelebrationFont } from "../../lib/celebration-fonts";

const playfair = Playfair_Display({ subsets: ["latin"], display: "swap" });
const courier = Courier_Prime({ subsets: ["latin"], weight: ["400", "700"], display: "swap" });
const archivoBlack = Archivo_Black({ subsets: ["latin"], weight: "400", display: "swap" });

export const presentationFontFamilies: Record<CelebrationFont, string | undefined> = {
  classic: undefined,
  elegant: "Georgia, serif",
  modern: "Arial, sans-serif",
  storybook: playfair.style.fontFamily,
  typewriter: courier.style.fontFamily,
  bold: archivoBlack.style.fontFamily,
};
