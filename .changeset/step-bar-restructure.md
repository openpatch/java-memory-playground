---
"@java-memory-playground/java-memory-playground": patch
---

Restructure the bottom panel into stacked rows for clarity.

The step bar used to put navigation dots, exercise badge, task label, hint
button, check button, and solution button all on one horizontal row. Students
had to parse "where am I" and "what do I do" at the same time, and the hint
floated above the bar as a detached tooltip.

The bar is now a vertical stack of rows, divided by hairlines:
- Row 1: step navigation (arrows + dots)
- Row 2: the step's task (badge + label) and its actions (hint, check,
  solution, result)
- Row 3: authoring controls, in edit mode only

The hint appears inline within the bar instead of floating above it, so it
stays in context and does not cover the diagram the reader is working on.
