---
"@openpatch/java-memory-playground": patch
---

Fix exported images losing every reference arrow.

An exported diagram had its objects and frames but none of the arrows between them, which is most of what a memory diagram says. Exporting deep-clones the edge SVG and drops anything a stylesheet contributed, so the stroke our CSS supplied never made it into the picture and the paths came out invisible. Edges carry their stroke inline now.

The capture also frames the whole diagram before photographing it and crops to the nodes, so nothing scrolled out of view is missing and the empty canvas is gone, and it keeps the arrowheads, whose SVG markers live outside the viewport.
