# @java-memory-playground/java-memory-playground

React components behind the [Java Memory Playground](https://jmp.openpatch.org) —
interactive diagrams of the Java stack and heap.

Looking to embed the playground in a page that is not a React app? Use
[`@java-memory-playground/web-component`](../web-component) instead.

## Installation

```sh
npm install @java-memory-playground/java-memory-playground
```

`react` and `react-dom` are peer dependencies.

## Two playgrounds

`MemoryPlayground` is the student's: the whole diagram, every edit, and the steps
of a trace to walk through.

`MemoryPlaygroundEditor` is the teacher's: all of that, plus configuring classes
and options and authoring the steps.

```tsx
import {
  MemoryPlayground,       // student
  MemoryPlaygroundEditor, // teacher
} from "@java-memory-playground/java-memory-playground";
```

Both take the same props. The split is about which tools are on screen, not
about what a student is allowed to touch — a student still builds objects,
connects references and runs the garbage collector.

## Usage

```tsx
import { MemoryPlayground } from "@java-memory-playground/java-memory-playground";
import "@java-memory-playground/java-memory-playground/index.css";

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
| `step`        | `number`                     | The step to show, zero based. Set it to drive the diagram from the page around it.             |
| `onStepChange`| `(step: number) => void`     | Called whenever the shown step changes.                                                       |
| `onChange`    | `(memory: Memory) => void`   | Called when the user presses **Save**.                                                        |
| `onEdit`      | `(memory: Memory) => void`   | Called on every edit, not only on Save. For a host that owns the file.                        |
| `mode`        | `"view" \| "edit"`           | Which tools to show. Prefer picking the component; this is what it sets.                       |

Every `MemoryPlayground` creates its own store, so several playgrounds can live
on the same page without sharing state.

## State and saving

The diagram lives in the playground's store, not in React Flow's local state.
Every edit — dragging a node, connecting a reference, editing an attribute — is
in the store immediately, so nothing is lost by switching to the config view and
back, and when persistence is on the URL keeps up on its own.

**Save** is therefore a commit, not a rescue: it is what fires `onChange`, which
is how a host learns the user considers the diagram finished.

A host that owns the file and has a save of its own — the VS Code editor, say —
wants `onEdit` instead, which fires on every edit. Loading a `memory` prop is
not an edit, and neither is panning or zooming, so opening a diagram does not
mark it as changed.

```tsx
<MemoryPlayground onEdit={(memory) => markDirty(memory)} />
```

## Steps

A diagram is a sequence of steps, which is what lets it show the stack doing the
thing that makes it a stack: a frame pushed on a call, popped on a return, and an
object turning into garbage the moment the last reference to it is overwritten.

A trace is authored by duplication — build a step, press **Add step**, and change
what the next line did. Node positions are shared across the whole diagram, so
dragging something moves it everywhere and the picture does not jump while
stepping through.

```tsx
// Driving the diagram from the prose around it.
<MemoryPlayground step={step} onStepChange={setStep} />
```

### What a step changed

Walking a trace is only useful if you can see what moved, so each step marks
itself against the one before it: a green outline for what appeared, a dashed
amber one for what changed, and an amber reference for one that was assigned or
repointed. The first step of a story marks nothing, because nothing has happened
yet. Set `hideStepChanges` to turn the marking off.

`diffSteps` is exported if you want the same comparison elsewhere.

A diagram with one step is just a picture, and is still saved in the shape it
always had, so a link to a single diagram stays readable by older versions. Set
`hideSteps` to hide the bar entirely.

### Exercises

A step can be marked as an exercise. The teacher authors it as the answer; a
student's playground starts them from the step before it and checks what they
build.

```json
{ "label": "insert at the head", "exercise": true, "objects": {}, "variables": {}, "methodCalls": {} }
```

The check compares the *shape* reachable from each root — the named variables
and each frame's locals — not the addresses, because a student who allocates an
object gets whatever address the playground handed out. Building the right
diagram passes however it was built, and the report names the root that is
wrong rather than only saying no. `checkAgainst` and `canonicalRoots` are
exported if you want to run the comparison yourself.

Saving from a student's playground writes the exercise back as authored, not
their attempt, so a shared link stays the exercise.

### Garbage collection

With `gcPrediction` on, the collector asks first: the student marks the objects
they think are unreachable, and the check scores them before sweeping. Reaching
for an answer before seeing it is where the learning is.

### The call stack

Only the frame on top of the stack can return; the others say so rather than
hiding the button, because a call having to finish before the one below it
resumes is the lesson. Returning takes the frame's references with it, which is
what leaves an object unreachable for the garbage collector to find.

## Classes from Java source

A teacher usually has the classes already — in a worksheet, in an IDE, on a
slide — so the config view takes them as Java rather than asking for them field
by field:

```java
class Node {
    int value;
    Node next;
}
```

Only the structure is read: class names, and the name and type of each field.
Method bodies are skipped whole, initialisers are dropped, and **nothing is
executed or interpreted** — the source describes the shape of the objects a
diagram will contain, not a program the playground runs. Comments, generics
(`List<Node>` is a `List`), qualified names (`java.lang.String` is a `String`),
arrays either way round (`int[] a` and `int a[]`), records, and several names in
one declaration are all understood.

Half-written source does not throw the classes away: what cannot be read is
reported above the editor and the last readable classes stay.

The **Class list** tab is the same classes as a table, for adding one field
without touching the source. `parseJavaClasses` and `toJavaSource` are exported.

### What applying them costs

Classes belong to the whole diagram, so saving them reaches every step — pasting
a new file over the old one can delete what the objects were holding. Save says
what that is first, and only when there is something to say:

- a field an object no longer has room for, and the value or reference it held
- objects whose class is gone, which stay in the diagram but can never be made
  again

A field nobody has typed into is empty and goes unmentioned, even though an
`int` shows a `0` and a `boolean` shows a box — those are what the field starts
out holding, not something to lose. Adding a field, or changing classes no
object uses, costs nothing and saves without asking: a dialog that always
appears is one nobody reads.

`klassImpact` computes the same report if you want it elsewhere, and
`defaultValueFor` is what it counts as empty.

## Strings

A String is a reference type, so a String value lives on the heap like any other
object. Drawing each one would bury the point of a diagram that is about
something else, so they are collapsed into their owner by default and rendered
as an editable field in quotes.

```tsx
// When the String is the lesson rather than the noise.
<MemoryPlayground options={{ inlineStrings: false }} />
```

The collapsing is a display choice: the diagram stores the reference either way,
and a String value is an `Obj` with `klass === "String"` holding a `literal`.
Diagrams saved before Strings were modelled this way are converted when read, so
existing links keep working.

## Density

A diagram is read as a whole — a list of five nodes, a stack three frames deep
— so padding inside a node is diagram that has to go somewhere else. The canvas
is packed tightly on purpose, and how tightly is four custom properties on the
container rather than a number repeated down the stylesheet:

```css
.java-memory-playground {
  --jmp-space: 4px;
  --jmp-space-lg: 8px;
  --jmp-radius: 6px;
  --jmp-handle: 14px; /* also a drag target, so well above React Flow's 6px */
}
```

Override them to loosen everything at once, for a projector at the back of a
room or a touch screen.

The palette, toolbar and step bar float over the canvas rather than sitting
beside it, so framing the diagram reserves the space each one occupies —
otherwise fitting the nodes edge to edge parks the first of them underneath a
panel. A hidden panel gives its side back.

## Undo and redo

Undo/redo is backed by [zundo](https://github.com/charkour/zundo). Only the
diagram is undoable — opening a dialog, selecting a node or switching views does
not consume a step, and a single drag is one step rather than one per pixel.

```tsx
import { useUndoRedo } from "@java-memory-playground/java-memory-playground";

// Inside a MemoryPlayground subtree:
const { undo, redo, canUndo, canRedo, clear } = useUndoRedo();
```

## Keyboard shortcuts

| Shortcut       | Action                     |
| -------------- | -------------------------- |
| `Ctrl/Cmd + S` | Save                       |
| `Ctrl/Cmd + Z` | Undo                       |
| `Ctrl/Cmd + Y` | Redo                       |
| `Ctrl/Cmd + ,` | Toggle the config view (editor only) |
| `Ctrl/Cmd + +` | Zoom in                    |
| `Ctrl/Cmd + -` | Zoom out                   |
| `Ctrl/Cmd + 0` | Reset zoom                 |
| `Shift + 1`    | Fit the diagram to the view |

**Download all steps** writes one image with every step under its label, which
is what a worksheet wants — exporting the step on screen gives you the last
picture instead. Both exports frame the whole diagram first and crop to it, so
the empty canvas and the floating panels stay out of the picture.

Edges carry their stroke as an inline style rather than taking it from the
stylesheet. Exporting deep-clones the edge SVG and drops anything a stylesheet
contributed, and a reference with no stroke is an invisible one.

Shortcuts are ignored while an input has focus. Override any of them with
`keyBindings`:

```tsx
<MemoryPlayground keyBindings={{ save: { key: "e", ctrl: true } }} />
```

## Presets

`optionPresets` names the option combinations a course moves through — a teacher
picks one in the config view rather than remembering which flags belong to which
stage.

| Preset | What it is for |
| ------ | -------------- |
| `references` | Objects and the names that point at them. No stack, no steps. |
| `stack` | Method calls, so the stack and stepping come with them. |
| `everything` | Arrays, the garbage collector, and Strings as heap objects. |

## Languages

English and German ship with the package. `language="auto"` (the default) picks
the browser language and falls back to English.

React Flow's own accessible text is translated too, through its
`ariaLabelConfig`. It ships those strings in English, so a German playground
used to announce "Zoom In" and "Press enter or space to select a node" beside
its own translated labels.

```tsx
import { translations, getTranslations } from "@java-memory-playground/java-memory-playground";
```

## URL persistence

The standalone app keeps the whole diagram in `location.hash`, which is what
makes a diagram shareable as a link. That behaviour is off by default, because
an embedded playground must not take over the URL of the page hosting it. Turn
it on once during bootstrap:

```tsx
import { setPersistence } from "@java-memory-playground/java-memory-playground";

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
