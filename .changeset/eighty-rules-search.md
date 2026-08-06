---
"@openpatch/java-memory-playground": patch
---

Add `onEdit`, which fires on every edit rather than only on Save.

`onChange` says the user considers the diagram finished. A host that owns the file and has a save of its own — an editor with a dirty marker — needs the other signal: that something changed just now. Loading a `memory` prop is deliberately not an edit, so opening a diagram does not mark it as changed, and neither is panning or zooming, though the viewport is written along with the next real edit.

React Flow writes measurements back as it mounts, which replaces the steps without changing the diagram, so an edit is only reported when what would be written to a file actually differs.
