---
"@openpatch/java-memory-playground": patch
---

Pack the canvas more tightly.

A diagram is read as a whole, so padding inside a node is diagram that has to go somewhere else. Rows, headers, bodies, handles, the palette and the step bar are all tighter: an object with two fields went from 102×135 to 96×85, a three-field one from 203×176 to 183×111, and a frame with three locals from 184×276 to 182×198 — a third of the height, with nothing removed.

How tight is now four custom properties on the container (`--jmp-space`, `--jmp-space-lg`, `--jmp-radius`, `--jmp-handle`) rather than a number repeated down the stylesheet, so a projector or a touch screen can loosen everything at once.

Framing the diagram reserves the space the floating panels occupy. The palette is drawn on top of the canvas, so fitting the nodes edge to edge parked the first frame of the default diagram underneath it and hid its name. A hidden panel gives its side back.

A String is as wide as what it holds. It was a fixed 80px, which was too much room for an empty one and not enough for `"Hello World!"`.

The delete mark on a frame's references is a small × rather than a full-size button. It repeats on every reference, so at full size it competed with the variable names for attention.
