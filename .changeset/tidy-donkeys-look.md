---
"@openpatch/java-memory-playground": patch
---

Float the node palette over the canvas instead of taking a column out of it.

The palette is a panel now, like every other control, so a small embed keeps its whole width for the diagram. Dragging a class onto the canvas works from there unchanged.

Exports are framed to the diagram's nodes rather than photographing the canvas, which crops away the empty space and keeps the palette, toolbar, step bar and collector button out of the picture.
