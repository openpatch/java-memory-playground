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
        onChange={(memory) => console.log(memory)}
      />
    </div>
  );
}
```

## Props

| Prop          | Type                        | Description                                                                                  |
| ------------- | --------------------------- | -------------------------------------------------------------------------------------------- |
| `memory`      | `Memory \| string`          | The diagram, as an object or a JSON string. Omit it to keep whatever the store already holds. |
| `options`     | `Partial<Memory["options"]>`| Overrides applied on top of `memory.options`.                                                 |
| `persistence` | `boolean`                   | Mirror the diagram into `location.hash`. Defaults to the value set through `setPersistence`.  |
| `onChange`    | `(memory: Memory) => void`  | Called when the user presses **Save**.                                                        |

Every `MemoryPlayground` creates its own store, so several playgrounds can live
on the same page without sharing state.

## URL persistence

The standalone app keeps the whole diagram in `location.hash`, which is what
makes a diagram shareable as a link. That behaviour is off by default, because
an embedded playground must not take over the URL of the page hosting it. Turn
it on once during bootstrap:

```tsx
import { setPersistence } from "@openpatch/java-memory-playground";

setPersistence(true);
```

Or per instance with the `persistence` prop.

## Development

```sh
pnpm test      # vitest
pnpm lint      # tsc --noEmit
pnpm build     # dist/index.js, dist/index.css and type declarations
```
