---
"@java-memory-playground/java-memory-playground": patch
"@java-memory-playground/web-component": patch
---

Add dark mode that follows the host's `color-scheme`.

Every `--jmp-*` colour token is now a `light-dark()` pair, resolved against the
`color-scheme` of whatever contains the playground — a host with its own dark
mode sets `color-scheme: dark` on the container when it switches (the standalone
app follows the OS, the VS Code webview follows the workbench theme), and a host
without one keeps the light look, even on a dark OS. Where the host is a
Hyperbook book, `--jmp-surface`, `--jmp-text`, `--jmp-text-muted` and
`--jmp-accent` read the book's own `--color-*` tokens, so the playground wears the
book's colours; `hyperbook-jmp-dark-mode.patch` carries the matching
`.directive-jmp` block for Hyperbook's `dark.css` and re-themes the directive's
fullscreen/reset buttons after the book instead of hard-coded light values.

The colours drawn into the SVG (reference edges, arrowheads) and into exported
PNGs cannot read `var()`, so they come from `paletteFor(mode)` driven by the new
`useColorMode` hook, which reads the same used `color-scheme` and follows the
host's theme changes live. React Flow's own chrome (zoom controls, dotted
canvas) is pointed at the same tokens through its `--xy-*` variables, and
`<ReactFlow>` gets the `colorMode` prop, so it cannot stay the only light thing
in a dark host. Print mode pins `color-scheme: light`, because paper has no
dark mode.
