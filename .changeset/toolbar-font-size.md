---
"@java-memory-playground/java-memory-playground": patch
---

State the font size of the playground's own controls, so an embedded playground's toolbar is not
resized by its host.

Form controls do not inherit `font-size`, so in a page of its own the buttons and inputs sat at the
browser's ~13px default and the container's 24px — the size the *diagram* is drawn at — never
reached them. A host page with a normalize stylesheet (`button, input { font-size: 100% }`) makes
them inherit after all, and Save, Download (PNG) and the rest then came out at 24px. In a Hyperbook
the toolbar was roughly twice the width of the diagram beneath it.

The sizes are now written down rather than left to the browser, so they are the same wherever the
playground is embedded. Nothing changes in the standalone app.
