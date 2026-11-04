import type { ColorMode } from "./colorMode";

/**
 * The handful of palette entries that have to exist in JavaScript as well as in
 * CSS, named after the tokens in `index.css` they duplicate.
 *
 * Anything drawn into an `<svg>` or onto a canvas has to be a literal colour;
 * `var(--jmp-…)` does not survive being photographed. html-to-image copies
 * computed styles onto its clone but stops at an `<svg>`, taking that subtree
 * wholesale, and then renders the clone outside `.java-memory-playground`,
 * where the custom properties are not defined. An unresolvable `var()` is
 * invalid at computed-value time, so `stroke` falls back to its initial `none`
 * and a reference disappears from the picture — while its arrowhead, whose
 * `fill` falls back to black, stays behind pointing at nothing. A canvas has no
 * stylesheet to read at all.
 *
 * The CSS tokens are `light-dark()` pairs resolved against the host's
 * color-scheme, so each constant below carries both halves; `paletteFor`
 * picks the one matching the scheme `useColorMode` reads. Print always uses
 * the light half — paper has no dark mode (`.jmp-print` pins
 * `color-scheme: light` for the same reason).
 *
 * `palette.test.ts` keeps these in step with `index.css`, so a colour still
 * only has to be changed in one place.
 */

/** Both halves of a `light-dark()` pair in index.css. */
export interface PaletteEntry {
  light: string;
  dark: string;
}

/** `--jmp-black`. What print mode draws its references in. */
export const BLACK: PaletteEntry = { light: "#000000", dark: "#f5f5f5" };
/** `--jmp-text` — Coal. */
export const TEXT: PaletteEntry = { light: "#242428", dark: "#f5f5f5" };
/** `--jmp-text-muted` — Charcoal. */
export const TEXT_MUTED: PaletteEntry = {
  light: "#3c3c3c",
  dark: "#d6d6d6",
};
/** `--jmp-surface` — White on a light page. */
export const SURFACE: PaletteEntry = { light: "#ffffff", dark: "#1e1e1e" };
/** `--jmp-surface-sunken` — Whitesmoke on a light page. */
export const SURFACE_SUNKEN: PaletteEntry = {
  light: "#f5f5f5",
  dark: "#353535",
};
/** `--jmp-warning`. */
export const WARNING: PaletteEntry = { light: "#b7791f", dark: "#d9a959" };

/** `--jmp-danger`. */
export const DANGER: PaletteEntry = { light: "#c0392b", dark: "#e08a7d" };

/**
 * The palette entries as literal colours for one scheme, the form the SVG and
 * canvas drawing and the PNG export need.
 */
export const paletteFor = (mode: ColorMode) => ({
  BLACK: BLACK[mode],
  TEXT: TEXT[mode],
  TEXT_MUTED: TEXT_MUTED[mode],
  SURFACE: SURFACE[mode],
  SURFACE_SUNKEN: SURFACE_SUNKEN[mode],
  WARNING: WARNING[mode],
  DANGER: DANGER[mode],
});

export type Palette = ReturnType<typeof paletteFor>;
