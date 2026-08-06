---
"@openpatch/java-memory-playground-web-component": minor
"@openpatch/java-memory-playground": minor
"web": minor
---

Split the playground into a student's and a teacher's.

Configuring classes and authoring the steps of a trace are the teacher's work, and having them on screen while a student works through a diagram is noise. They now live in their own component and their own custom element, following how learningmap separates its viewer from its editor.

- `MemoryPlayground` and `<java-memory-playground>` are the student's: the whole diagram, every edit, and the steps of a trace to walk through.
- `MemoryPlaygroundEditor` and `<java-memory-playground-editor>` add class configuration and step authoring on top.
- The standalone app serves the student's playground, and the teacher's at `?edit` (or `/edit` where a rewrite rule exists).

The split is about which tools are on screen, not about what a student is allowed to touch: a student still builds objects, connects references, walks the steps and runs the garbage collector. The configuration route is closed in the student's playground rather than merely hidden, so the keyboard shortcut cannot reach it either.
