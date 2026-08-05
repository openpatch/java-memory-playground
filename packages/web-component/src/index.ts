import r2wc from "@r2wc/react-to-web-component";
import {
  MemoryPlayground,
  setPersistence,
} from "@openpatch/java-memory-playground";
import "@openpatch/java-memory-playground/index.css";

// Explicit even though it is the default: an embedded playground must not
// hijack the URL of the page hosting it. State comes in through the `memory`
// attribute and leaves through the `change` event.
setPersistence(false);

const MemoryPlaygroundWC = r2wc(MemoryPlayground, {
  props: {
    memory: "string",
    options: "json",
    persistence: "boolean",
  },
  // r2wc keys events by prop name: it passes an `onChange` prop that dispatches
  // a `change` CustomEvent on this element, with the memory as `detail`.
  events: {
    onChange: {},
  },
});

customElements.define("java-memory-playground", MemoryPlaygroundWC);
