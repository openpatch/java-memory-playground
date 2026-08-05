# @openpatch/java-memory-playground

React components behind the [Java Memory Playground](https://jmp.openpatch.org) —
interactive diagrams of the Java stack and heap.

Looking to embed the playground in a page that is not a React app? Use
[`@openpatch/java-memory-playground-web-component`](../web-component) instead.

## Installation

```sh
npm install @openpatch/java-memory-playground
```

`react` and `react-dom` are peer dependencies.

## Usage

```tsx
import { MemoryPlayground } from "@openpatch/java-memory-playground";
import "@openpatch/java-memory-playground/index.css";

export function Example() {
  return (
    <div style={{ height: "600px" }}>
      <MemoryPlayground
        memory={{
          klasses: { Node: { attributes: { next: "Node" } } },
          objects: {},
          variables: {},
          methodCalls: {
            1: {
              name: "App.main",
              index: 0,
              localVariables: {},
              position: { x: 0, y: 0 },
            },
          },
        }}
        options={{ hideSidebar: true }}
        language="de"
        onChange={(memory) => console.log(memory)}
      />
    </div>
  );
}
```

## Props

| Prop          | Type                         | Description                                                                                  |
| ------------- | ---------------------------- | -------------------------------------------------------------------------------------------- |
| `memory`      | `Memory \| string`           | The diagram, as an object or a JSON string. Omit it to keep whatever the store already holds. |
| `options`     | `Partial<Memory["options"]>` | Overrides applied on top of `memory.options`.                                                 |
| `language`    | `string`                     | `"en"`, `"de"`, or `"auto"` to follow the browser. Defaults to the browser language.          |
| `persistence` | `boolean`                    | Mirror the diagram into `location.hash`. Defaults to the value set through `setPersistence`.  |
| `keyBindings` | `Partial<KeyBindings>`       | Overrides for the default keyboard shortcuts.                                                 |
| `onChange`    | `(memory: Memory) => void`   | Called when the user presses **Save**.                                                        |

Every `MemoryPlayground` creates its own store, so several playgrounds can live
on the same page without sharing state.

## State and saving

The diagram lives in the playground's store, not in React Flow's local state.
Every edit — dragging a node, connecting a reference, editing an attribute — is
in the store immediately, so nothing is lost by switching to the config view and
back, and when persistence is on the URL keeps up on its own.

**Save** is therefore a commit, not a rescue: it is what fires `onChange`, which
is how a host learns the user considers the diagram finished.

## Undo and redo

Undo/redo is backed by [zundo](https://github.com/charkour/zundo). Only the
diagram is undoable — opening a dialog, selecting a node or switching views does
not consume a step, and a single drag is one step rather than one per pixel.

```tsx
import { useUndoRedo } from "@openpatch/java-memory-playground";

// Inside a MemoryPlayground subtree:
const { undo, redo, canUndo, canRedo, clear } = useUndoRedo();
```

## Keyboard shortcuts

| Shortcut       | Action                     |
| -------------- | -------------------------- |
| `Ctrl/Cmd + S` | Save                       |
| `Ctrl/Cmd + Z` | Undo                       |
| `Ctrl/Cmd + Y` | Redo                       |
| `Ctrl/Cmd + ,` | Toggle the config view     |
| `Ctrl/Cmd + +` | Zoom in                    |
| `Ctrl/Cmd + -` | Zoom out                   |
| `Ctrl/Cmd + 0` | Reset zoom                 |
| `Shift + 1`    | Fit the diagram to the view |

Shortcuts are ignored while an input has focus. Override any of them with
`keyBindings`:

```tsx
<MemoryPlayground keyBindings={{ save: { key: "e", ctrl: true } }} />
```

## Languages

English and German ship with the package. `language="auto"` (the default) picks
the browser language and falls back to English.

```tsx
import { translations, getTranslations } from "@openpatch/java-memory-playground";
```

## URL persistence

The standalone app keeps the whole diagram in `location.hash`, which is what
makes a diagram shareable as a link. That behaviour is off by default, because
an embedded playground must not take over the URL of the page hosting it. Turn
it on once during bootstrap:

```tsx
import { setPersistence } from "@openpatch/java-memory-playground";

setPersistence(true);
```

Or per instance with the `persistence` prop. Writes are throttled and use
`history.replaceState`, so continuous syncing does not fill up the back button.

## Development

```sh
pnpm test      # vitest
pnpm lint      # tsc --noEmit
pnpm build     # dist/index.js, dist/index.css and type declarations
```
