---
"@openpatch/java-memory-playground": patch
---

Translate React Flow's own accessible text.

React Flow ships its ARIA descriptions and control labels in English, so a German playground announced "Zoom In", "Fit View" and "Press enter or space to select a node" beside its own translated labels. They go through `ariaLabelConfig` now and follow the playground's language like everything else.
