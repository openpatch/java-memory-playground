/**
 * Keeps only the web fonts a picture of the diagram can use.
 *
 * A host page's font stylesheet is usually split by script: Google Fonts
 * serves a family as one `@font-face` per subset — Latin, Latin Extended,
 * Cyrillic, Greek, Vietnamese — each with its own `unicode-range`. Embedding
 * all of them put half a megabyte of fonts into every step of an export, most
 * of it for scripts the diagram never uses, and the browser decoded it again
 * for every step. A face whose range none of the diagram's characters fall in
 * cannot be drawn, so leaving it out changes nothing in the picture.
 */

type Range = [number, number];

const parseRange = (part: string): Range | null => {
  const match = part.trim().match(/^U\+([0-9A-F?]+)(?:-([0-9A-F]+))?$/i);
  if (!match) return null;
  const [, start, end] = match;
  // `U+4??` is shorthand for U+400-4FF.
  if (start.includes("?")) {
    return [
      parseInt(start.replace(/\?/g, "0"), 16),
      parseInt(start.replace(/\?/g, "F"), 16),
    ];
  }
  const from = parseInt(start, 16);
  return [from, end ? parseInt(end, 16) : from];
};

/** The ranges a face declares, or null when it covers everything. */
export const unicodeRangesOf = (fontFace: string): Range[] | null => {
  const declaration = fontFace.match(/unicode-range\s*:\s*([^;}]+)/i);
  if (!declaration) return null;
  const ranges = declaration[1]
    .split(",")
    .map(parseRange)
    .filter((r): r is Range => r !== null);
  return ranges.length > 0 ? ranges : null;
};

const covers = (ranges: Range[], codePoints: Set<number>) => {
  for (const point of codePoints) {
    if (ranges.some(([from, to]) => point >= from && point <= to)) return true;
  }
  return false;
};

/**
 * The `@font-face` rules of `css` that can draw at least one of `text`'s
 * characters, each once. Anything that is not a font face is kept as it is.
 */
export const pruneFontCss = (css: string, text: string): string => {
  const codePoints = new Set<number>();
  for (const char of text) codePoints.add(char.codePointAt(0)!);

  const seen = new Set<string>();
  return css.replace(/@font-face\s*\{[^}]*\}/gi, (face) => {
    // The same face embedded twice is drawn the same way once.
    if (seen.has(face)) return "";
    seen.add(face);
    const ranges = unicodeRangesOf(face);
    if (ranges === null) return face;
    return covers(ranges, codePoints) ? face : "";
  });
};

/**
 * Every character the picture of `element` can show: its text, and what is
 * typed into its fields, which `textContent` does not include.
 */
export const textOf = (element: HTMLElement): string => {
  let text = element.textContent ?? "";
  element.querySelectorAll("input, textarea").forEach((field) => {
    text += (field as HTMLInputElement).value ?? "";
    text += (field as HTMLInputElement).placeholder ?? "";
  });
  return text;
};
