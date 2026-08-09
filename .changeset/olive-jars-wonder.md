---
"@openpatch/java-memory-playground-web-component": patch
"@openpatch/java-memory-playground": patch
"java-memory-playground-studio": patch
"web": patch
---

Put the references back in the exported PNG.

The picture came out with arrowheads floating where its references should have
been. `stroke` had been given as `var(--jmp-text-muted)`, and a custom property
does not survive being photographed: html-to-image copies computed styles onto
its clone but stops at an `<svg>`, taking that subtree wholesale, and then
renders the clone outside `.java-memory-playground`, where `--jmp-*` is not
defined. An unresolvable `var()` is invalid at computed-value time, so `stroke`
fell back to its initial `none` and the line vanished — while the arrowhead,
whose `fill` falls back to black, stayed behind pointing at nothing.

The few palette entries that have to exist in JavaScript as well as in CSS now
live in `palette.ts`, with the reason written down, and a test keeps them in
step with `index.css` so a colour is still only changed in one place.
