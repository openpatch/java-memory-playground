import r2wc from "@r2wc/react-to-web-component";
import {
  MemoryPlayground,
  MemoryPlaygroundEditor,
  setPersistence,
} from "@openpatch/java-memory-playground";
import "@openpatch/java-memory-playground/index.css";

// Explicit even though it is the default: an embedded playground must not
// hijack the URL of the page hosting it. State comes in through the `memory`
// attribute and leaves through the `change` event.
setPersistence(false);

const props = {
  memory: "string",
  options: "json",
  language: "string",
  persistence: "boolean",
  keyBindings: "json",
  step: "number",
} as const;

// r2wc keys events by prop name and dispatches on this element: `onChange`
// becomes a `change` event carrying the memory, `onStepChange` a `stepchange`
// event carrying the step index.
const events = {
  onChange: {},
  onStepChange: {},
} as const;

// The student's playground: the whole diagram and every edit, but no class
// configuration and no step authoring.
customElements.define(
  "java-memory-playground",
  r2wc(MemoryPlayground, { props, events }),
);

// The teacher's: the same, plus configuration and authoring the steps.
customElements.define(
  "java-memory-playground-editor",
  r2wc(MemoryPlaygroundEditor, { props, events }),
);
