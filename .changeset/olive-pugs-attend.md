---
"@openpatch/java-memory-playground-web-component": minor
"@openpatch/java-memory-playground": minor
"web": minor
---

Keep the diagram in the store, and add undo/redo, keyboard shortcuts and German.

- Nodes and edges moved out of React Flow's local state into the playground store, so an edit is never lost by switching to the config view or reloading. Save is now a commit that fires `change`, not the only thing that records your work.
- Undo/redo via zundo, with toolbar buttons and `Ctrl/Cmd+Z` / `Ctrl/Cmd+Y`. Only diagram edits are undoable, and one drag is one step.
- Keyboard shortcuts for save, undo, redo, config and zoom, overridable through `keyBindings`.
- English and German translations, selected with the new `language` prop/attribute or the browser language.
- URL persistence now syncs continuously, throttled and via `history.replaceState`, so it no longer fills up the back button.
