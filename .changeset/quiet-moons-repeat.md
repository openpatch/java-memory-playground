---
"@openpatch/java-memory-playground-web-component": patch
"@openpatch/java-memory-playground": patch
"web": patch
---

Fix diagrams shared before method calls existed opening as the default diagram.

Links written by early versions have no `methodCalls` section at all. Reading one threw while restoring the state from the URL, and the failure was swallowed, so the playground silently showed its default diagram instead of the one the link pointed at. Persisted state now goes through the same normalization as the `memory` prop, and building the graph tolerates a diagram that is missing whole sections.
