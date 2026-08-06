---
"@openpatch/java-memory-playground": patch
---

Stop the garbage collector button from covering the step bar.

The collector was pinned bottom-right and the step bar bottom-centre, as separate panels that could not see each other. Below about 1000px of canvas they slid into each other, and the collector sat on top of "Add step" and "Delete step" — at 768px "Delete step" could not be clicked at all.

They share one row now, so they cannot overlap at any width: side by side when there is room, the collector on its own line when there is not.

The row also gets the width it is entitled to. React Flow centres a bottom-centre panel with `left: 50%`, which caps how wide it can shrink-to-fit at half the canvas, so the row was wrapping with the whole right half of the screen still empty.

The step bar itself wraps as a last resort rather than pushing its own buttons off the edge of a narrow screen.

The bottom bar is one card rather than two. Side by side, the step controls and the collector were two cards of different heights nudged together by a 4px gap. Every control in the row is the same height now, and the collector wears the colour the diagram uses for garbage, which is what tells it apart from the step controls next to it.

`.button-gc` never applied. It is one class, and `.java-memory-playground button` is a class plus a type, so the collector had been taking the default button background all along.

The bottom row stops short of the zoom controls in the corner below it, and the toolbar stops short of the palette across from it, wrapping onto a second line instead of sliding underneath. Every floating overlay is now clear of every other one from 1400px down to 380px of canvas.
