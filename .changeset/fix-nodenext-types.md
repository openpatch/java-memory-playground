---
"@java-memory-playground/java-memory-playground": patch
---

Fix type resolution for consumers using `moduleResolution: node16`/`nodenext`. Relative imports now carry `.js` extensions, so the emitted `.d.ts` files resolve instead of collapsing every export to `any`. Side-effect CSS imports are also stripped from the declarations, which removes TS2882 errors under TypeScript 7 with `skipLibCheck: false`.
