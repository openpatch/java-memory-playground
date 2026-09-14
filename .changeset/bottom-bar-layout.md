---
"@java-memory-playground/java-memory-playground": patch
---

Lay the bottom bar out in rows, and make "Your turn" a heading.

Everything was one wrapping row, so on an exercise step the prompt sat between the description and
the buttons — the one place in the row where a call to action reads as a caption. The description
competed with the controls for the same line, and on a narrow canvas the whole thing became a pile.

The bar now has three parts: the prompt as a heading across the top of the card, the step's
description under it, and the controls on their own line. The collector joins the end of that
controls line rather than standing in a group of its own, so a plain diagram is still the single
row it was, and the result of checking an exercise stays beside the button that produced it.

The step bar dissolves into the bottom bar (`display: contents`) instead of being a box inside it,
which is what lets the heading span the full width and the collector share the controls' line. It
still stands on its own for anyone rendering the component outside the bar.
