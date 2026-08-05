---
"@openpatch/java-memory-playground-web-component": minor
"@openpatch/java-memory-playground": minor
"web": minor
---

Split the playground into a reusable React package, a web component and the standalone web app.

- `@openpatch/java-memory-playground` exports a `MemoryPlayground` component that takes the diagram through a `memory` prop and reports saves through `onChange`.
- `@openpatch/java-memory-playground-web-component` registers `<java-memory-playground>` for use in any page.
- Each playground now owns its store, so several playgrounds can share a page without overwriting each other.
- URL persistence is opt-in via `setPersistence`, so an embedded playground no longer takes over the host page's URL.
