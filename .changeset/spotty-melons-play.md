---
"@openpatch/java-memory-playground-web-component": minor
"@openpatch/java-memory-playground": minor
"web": minor
---

Make a diagram a sequence of steps.

A stack is defined by pushing and popping, and a single frozen picture cannot show either. A diagram now holds a list of steps, with a bar to walk through them and an **Add step** button that duplicates the step on screen so a trace is authored by changing what the next line did.

This makes a set of things showable that were not: a frame appearing on a call and gone after a return, the assignment that drops the last reference to an object, and what a parameter reassignment does and does not do to the caller.

- `step` and `onStepChange` on the component, `step` and a `stepchange` event on the custom element, so a page can drive the diagram from its prose and follow along.
- Node positions are shared across steps, so dragging a node moves it everywhere and the picture does not jump while stepping.
- Class definitions are reconciled across every step when they change, rather than only the step on screen.
- Walking through a diagram is not an undo step; changing one is.
- A one-step diagram is saved in the shape it has always had, so a link to a single picture stays readable by older versions. `hideSteps` hides the bar.
