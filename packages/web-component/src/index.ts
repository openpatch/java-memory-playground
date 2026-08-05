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
    language: "string",
    persistence: "boolean",
    keyBindings: "json",
    step: "number",
  },
  // r2wc keys events by prop name and dispatches on this element: `onChange`
  // becomes a `change` event carrying the memory, `onStepChange` a `stepchange`
  // event carrying the step index.
  events: {
    onChange: {},
    onStepChange: {},
  },
});

customElements.define("java-memory-playground", MemoryPlaygroundWC);
