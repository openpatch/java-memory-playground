---
"@java-memory-playground/java-memory-playground": patch
"@java-memory-playground/web-component": patch
---

Confine the bundled stylesheet to the playground. Every rule is now prefixed with
`.java-memory-playground` at build time, React Flow's stylesheet included. The bundle is loaded as a
plain stylesheet, so until now its rules applied to the whole host page — and class names like
`.sidebar`, `.memory` and `.button-group` are common enough to collide: `.sidebar` was resizing the
navigation of any page that embedded a diagram.
