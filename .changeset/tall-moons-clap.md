---
"@openpatch/java-memory-playground-web-component": patch
"@openpatch/java-memory-playground": patch
"java-memory-playground-studio": patch
"web": patch
---

Fix a number field that kept counting, and a config view that could not be scrolled.

Holding the up arrow of a numeric field and letting go left the value climbing until the next click somewhere else. React Flow starts a node drag on `mousedown` and, while dragging, swallows `mouseup` in the capture phase on `window` — so the spin button began its auto-repeat but was never told to stop. Every control inside a node now carries React Flow's `nodrag` class, which keeps the drag from starting over a control in the first place. That also stops a node from being dragged around by its own buttons, and lets text be selected inside an inline String.

The configuration view is a form, and as soon as a class has a few fields it is taller than the frame. It was laid out inside a `height: 100%` box with nothing to scroll it, so anything past the bottom edge was simply unreachable wherever the playground is clipped — a VS Code webview, or an embedding page. It scrolls now.
