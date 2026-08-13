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
 * `palette.test.ts` keeps these in step with `index.css`, so a colour still
 * only has to be changed in one place.
 */

/** `--jmp-black`. What print mode draws its references in. */
export const BLACK = "#000000";
/** `--jmp-text` — Coal. */
export const TEXT = "#242428";
/** `--jmp-text-muted` — Charcoal. */
export const TEXT_MUTED = "#3c3c3c";
/** `--jmp-surface` — White. */
export const SURFACE = "#ffffff";
/** `--jmp-surface-sunken` — Whitesmoke. */
export const SURFACE_SUNKEN = "#f5f5f5";
/** `--jmp-warning`. */
export const WARNING = "#b7791f";
