# @openpatch/java-memory-playground-web-component

The [Java Memory Playground](https://jmp.openpatch.org) as a framework agnostic
web component. Drop it into any page — plain HTML, a CMS, Hyperbook, an LMS — and
visualize the Java stack and heap.

## Usage

```html
<link rel="stylesheet" href="path/to/index.css" />
<script src="path/to/index.umd.js"></script>

<java-memory-playground id="playground"></java-memory-playground>

<script>
  const playground = document.getElementById("playground");

  playground.setAttribute(
    "memory",
    JSON.stringify({
      klasses: { Node: { attributes: { next: "Node" } } },
      objects: {
        "@33": {
          klass: "Node",
          attributes: { next: { dataType: "Node" } },
          position: { x: 400, y: 100 },
        },
      },
      variables: {},
      methodCalls: {
        1: {
          name: "App.main",
          index: 0,
          localVariables: { head: { dataType: "Node", value: "@33" } },
          position: { x: 0, y: 0 },
        },
      },
    }),
  );

  playground.addEventListener("change", (event) => {
    console.log("Memory changed:", event.detail);
  });
</script>
```

The element has no intrinsic size — give it one:

```css
java-memory-playground {
  display: block;
  width: 100%;
  height: 600px;
}
```

## Attributes

| Attribute     | Type      | Description                                                                                    |
| ------------- | --------- | ---------------------------------------------------------------------------------------------- |
| `memory`      | JSON      | The diagram to show. Any missing section (`klasses`, `objects`, `variables`, `methodCalls`) defaults to empty. |
| `options`     | JSON      | Overrides for `memory.options`, e.g. `{"hideSidebar":true}`. Applied on top of the options in `memory`. |
| `language`    | string    | `en`, `de`, or `auto` to follow the browser. Defaults to the browser language.                   |
| `persistence` | boolean   | Mirror the diagram into `location.hash`. Off by default — an embedded playground should not take over the page URL. |
| `key-bindings`| JSON      | Overrides for the keyboard shortcuts, e.g. `{"save":{"key":"e","ctrl":true}}`.                   |
| `step`        | number    | The step to show, zero based. Set it to drive the diagram from your page.                        |

Attributes can be updated at any time; setting `memory` again replaces the
diagram.

### Options

| Option                       | Description                                            |
| ---------------------------- | ------------------------------------------------------ |
| `hideSidebar`                | Hide the palette of draggable classes on the left.      |
| `hideCallMethod`             | Hide the "Call Method" entry in the sidebar.            |
| `hideDeclareGlobalVariable`  | Hide the "Declare Global Variable" entry in the sidebar.|
| `hideNewArray`               | Hide the "new Array" entry in the sidebar.              |
| `disableGarbageCollector`    | Hide the garbage collector button.                      |
| `createNewOnEdgeDrop`        | Create a new object when an edge is dropped on empty canvas. |
| `inlineStrings`              | Draw String values inside the object that references them instead of as their own heap box. On by default. |
| `hideSteps`                  | Hide the step bar, for a lesson that is about one picture.  |

## Events

A `change` event fires when the user presses **Save**. `event.detail` is the
complete memory, in the same shape the `memory` attribute accepts, so it can be
stored and fed straight back in later.

Edits are never lost in the meantime: the diagram lives in the component's own
state from the moment it changes. **Save** is a commit — it is how the user tells
your page that the diagram is finished.

```javascript
playground.addEventListener("change", (event) => {
  localStorage.setItem("diagram", JSON.stringify(event.detail));
});
```

## Steps

A diagram can be a sequence of steps rather than a single picture, which is what
lets it show a frame being pushed and popped, or an object becoming garbage the
moment the last reference to it goes away.

```json
{
  "klasses": { "Node": { "attributes": { "next": "Node" } } },
  "steps": [
    { "label": "start", "objects": {}, "variables": {}, "methodCalls": {} },
    { "label": "insert is called", "objects": {}, "variables": {}, "methodCalls": {} }
  ]
}
```

Set the `step` attribute to drive it from your page, and listen for `stepchange`
to follow along — the two together let prose and diagram stay in sync:

```javascript
playground.setAttribute("step", "2");
playground.addEventListener("stepchange", (e) => highlight(e.detail));
```

A diagram with a single state needs no `steps` key; it is read as a one-step
story, and saved back in the same shape.

## Undo, redo and keyboard shortcuts

The toolbar has undo/redo buttons, and the component listens for:

| Shortcut       | Action                      |
| -------------- | --------------------------- |
| `Ctrl/Cmd + S` | Save                        |
| `Ctrl/Cmd + Z` | Undo                        |
| `Ctrl/Cmd + Y` | Redo                        |
| `Ctrl/Cmd + ,` | Toggle the config view      |
| `Ctrl/Cmd + +` | Zoom in                     |
| `Ctrl/Cmd + -` | Zoom out                    |
| `Ctrl/Cmd + 0` | Reset zoom                  |
| `Shift + 1`    | Fit the diagram to the view |

Shortcuts are ignored while an input has focus. Only diagram edits are undoable,
and one drag is one undo step.

## Languages

English and German ship with the bundle:

```html
<java-memory-playground language="de"></java-memory-playground>
```

Leave the attribute off (or set `auto`) to follow the browser, falling back to
English for anything unsupported.

## Strings

A String is a reference type, so a String value is a heap object like any other.
Drawing every one of them would bury the point of a diagram about, say, a linked
list, so they are collapsed into their owner by default and shown as an editable
field in quotes.

Set `inlineStrings` to `false` when the String *is* the lesson — two references
to one String object is the picture behind `==` versus `.equals()`:

```html
<java-memory-playground options='{"inlineStrings":false}'></java-memory-playground>
```

This is a display choice only. The saved diagram holds the reference either way,
so a diagram authored with Strings collapsed can be shown expanded, and back.

## Several playgrounds on one page

Each element keeps its own state and emits its own `change` events, so a page
can host as many playgrounds as it needs.

## Development

```sh
pnpm build     # writes dist/index.umd.js and dist/index.css
```

`index.html`, `multi.html`, `de.html`, `strings.html` and `steps.html` in this
package are demo pages for the built bundle — serve the package directory and open them in a browser.
