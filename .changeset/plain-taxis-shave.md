---
"@java-memory-playground/web-component": minor
---

Forward the React layer's `onEdit` as an `edit` event on both custom elements. `change` still fires
only when the user presses **Save**, which is what a host with a save of its own wants; `edit` fires
on every edit, which is what a host that keeps the diagram for the user needs — an embedded
playground in a book, for one, where nobody should have to press Save to keep their work.
