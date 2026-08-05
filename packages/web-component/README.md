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
| `persistence` | boolean   | Mirror the diagram into `location.hash`. Off by default — an embedded playground should not take over the page URL. |

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

## Events

A `change` event fires when the user presses **Save**. `event.detail` is the
complete memory, in the same shape the `memory` attribute accepts, so it can be
stored and fed straight back in later.

```javascript
playground.addEventListener("change", (event) => {
  localStorage.setItem("diagram", JSON.stringify(event.detail));
});
```

## Several playgrounds on one page

Each element keeps its own state and emits its own `change` events, so a page
can host as many playgrounds as it needs.

## Development

```sh
pnpm build     # writes dist/index.umd.js and dist/index.css
```

`index.html` and `multi.html` in this package are demo pages for the built
bundle — serve the package directory and open them in a browser.
