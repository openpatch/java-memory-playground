---
"@openpatch/java-memory-playground-web-component": minor
"@openpatch/java-memory-playground": minor
"web": minor
---

Upgrade to React 19, pako 3, vitest 4 and TypeScript 7.

The React peer range still covers 18 and 19. Internally the store moved off zustand's legacy `zustand/traditional` entry to `useStore` + `useShallow`, which is the recommended zustand 5 API.

Vite stays on 7 deliberately: Vite 8 bundles with Rolldown, which leaves an unresolved `require("react")` in the CJS shim that `@xyflow/react` pulls in through zustand 4, producing a bundle that throws on load.
