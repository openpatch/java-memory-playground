---
"@java-memory-playground/java-memory-playground": minor
"@java-memory-playground/web-component": minor
---

Check exercises by walking the student's diagram and the solution side by side from each variable.

- A temporary variable, or an extra local in a frame, no longer makes a correct answer wrong.
- Sharing counts: two variables that should refer to the same object must refer to the same object, not two that look alike — and the other way round.
- The call stack is compared: a frame left behind or never pushed is reported.
- The feedback names where the answer goes wrong (`head.next should be null`, `b should refer to the same object as a`), and the diagram marks the variable, object and reference in question.
- Teachers get a "Check settings" panel on exercise steps: choose which variables are checked, whether other variables are allowed, and whether Strings are compared by identity (`==`). Saved as `check` on the step.

A more coherent interface:

- One look for everything floating over the canvas: palette, collector, toolbar and step card share the same panel style, control height, and button variants (primary, ghost, danger).
- The palette is a labelled list with a small picture of the box each item makes; labels wrap instead of being cut off.
- The toolbar in the top-right corner is undo, redo and a ☰ menu holding everything else — downloads, print mode, settings, help and Save.
- The step card has navigation with a "Step 2 of 5" counter, and for teachers "Add step", "Delete step" and a fold-away button on the same row.
- Teachers describe a step in a labelled form: a Step/Exercise switch, Title (Task for an exercise), Hint and Statements, with the check settings folded underneath.
- Students see the task with a single primary Check button; the hint and the result appear as callouts below it, the result listing what is wrong.
- The config page and dialogs use the same buttons and switches.

Faster export of all steps: 2–3× faster on a plain page, and up to 8× on a page with web fonts, where it used to get slower with every export. Steps are photographed as soon as they are drawn instead of after fixed waits, each picture stays a canvas until the final image is encoded once, and only the web fonts the diagram's characters need are embedded — read once per export rather than once per step.

The toolbar is configurable item by item, from the web component's `options` or the config page: `hideUndoRedo`, `hideDownloadPng`, `hideDownloadAllPng`, `hidePrintMode`, `hideHelp`, `hideSave`. A toolbar with every item hidden is not drawn.

Works on phones and in small embeds. Below 1024×640 — measured on the playground itself, so an iframe or a small embed gets it too — the playground switches to a compact layout: the palette and collector fold behind an "Add" button, the zoom buttons give way to a "fit the diagram to the view" entry in the ☰ menu, the step card spans the width and can fold down to its dots, the teacher's step form stacks its labels and starts folded, and controls are sized for a finger. Tapping a palette item adds it in the middle of the view instead of underneath the palette, dialogs fit a phone's width, and text fields are 16px on touch screens so iOS does not zoom in on them.

Fixes the check's messages for null: an attempt with null where the solution has an object is told it "should refer to an object", and the other way round "should be null" — they were swapped.
