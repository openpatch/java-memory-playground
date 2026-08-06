---
"@openpatch/java-memory-playground": patch
---

Stop the garbage collector button from covering the step bar.

The collector was pinned bottom-right and the step bar bottom-centre, as separate panels that could not see each other. Below about 1000px of canvas they slid into each other, and the collector sat on top of "Add step" and "Delete step" — at 768px "Delete step" could not be clicked at all.

They share one row now, so they cannot overlap at any width: side by side when there is room, the collector on its own line when there is not.

The row also gets the width it is entitled to. React Flow centres a bottom-centre panel with `left: 50%`, which caps how wide it can shrink-to-fit at half the canvas, so the row was wrapping with the whole right half of the screen still empty.

The step bar itself wraps as a last resort rather than pushing its own buttons off the edge of a narrow screen.
