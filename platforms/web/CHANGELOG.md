# web

## 0.2.1

### Patch Changes

- Updated dependencies [[`eec5689`](https://github.com/openpatch/java-memory-playground/commit/eec5689e3a4dc4740d8302bf9e6e8ca9af5c3c8f)]:
  - @java-memory-playground/java-memory-playground@0.2.1

## 0.2.0

### Minor Changes

- [#11](https://github.com/openpatch/java-memory-playground/pull/11) [`855fa79`](https://github.com/openpatch/java-memory-playground/commit/855fa797ea77a80fbde760ffc3ce8011d8056c33) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Split the playground into a student's and a teacher's.

  Configuring classes and authoring the steps of a trace are the teacher's work, and having them on screen while a student works through a diagram is noise. They now live in their own component and their own custom element, following how learningmap separates its viewer from its editor.

  - `MemoryPlayground` and `<java-memory-playground>` are the student's: the whole diagram, every edit, and the steps of a trace to walk through.
  - `MemoryPlaygroundEditor` and `<java-memory-playground-editor>` add class configuration and step authoring on top.
  - The standalone app serves the student's playground, and the teacher's at `?edit` (or `/edit` where a rewrite rule exists).

  The split is about which tools are on screen, not about what a student is allowed to touch: a student still builds objects, connects references, walks the steps and runs the garbage collector. The configuration route is closed in the student's playground rather than merely hidden, so the keyboard shortcut cannot reach it either.

- [#11](https://github.com/openpatch/java-memory-playground/pull/11) [`10dafa8`](https://github.com/openpatch/java-memory-playground/commit/10dafa821b1b992a3b93095ea68d289521e12b43) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Upgrade to React 19, pako 3, vitest 4 and TypeScript 7.

  The React peer range still covers 18 and 19. Internally the store moved off zustand's legacy `zustand/traditional` entry to `useStore` + `useShallow`, which is the recommended zustand 5 API.

  Vite stays on 7 deliberately: Vite 8 bundles with Rolldown, which leaves an unresolved `require("react")` in the CJS shim that `@xyflow/react` pulls in through zustand 4, producing a bundle that throws on load.

- [`6d7f9e7`](https://github.com/openpatch/java-memory-playground/commit/6d7f9e733ed048006826854131acbdcbbb3b204b) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Paint everything in the OpenPatch palette.

  The playground had accumulated around two hundred colour literals — mostly
  Tailwind's greys, spelled out one at a time in a stylesheet and in the inline
  styles of the configuration view. They are now a set of custom properties: the
  palette from the branding repository, and roles filled by it. Restyling means
  reassigning a role rather than hunting hex codes.

  The accent goes to the stack. A frame is Fresh Mint and the heap stays neutral,
  so the split the diagram is about is the one carried by colour, and handles —
  the thing you drag a reference from — are OpenPatch Green. Boolean fields get
  `accent-color`, so a checkbox is no longer painted in the browser's own blue,
  which was the one colour on the canvas nobody had chosen.

  Two roles are deliberately not from the palette. A diagram has to say
  "unreachable, about to be collected" and "changed since the last step", and
  neither reads as green, so danger and warning are one muted hue each, defined
  in the same place as everything else. Success is the brand green.

  The PNG export keeps literals, because a canvas has no stylesheet to read; they
  are named after the palette entries and sit next to each other at the top of
  the file.

- [#11](https://github.com/openpatch/java-memory-playground/pull/11) [`0e03f93`](https://github.com/openpatch/java-memory-playground/commit/0e03f93db23c1b09c0034b5237041ea2453a2782) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Mark what each step changed, and make the call stack behave like one.

  Walking a trace only helps if you can see what moved, so a step is now marked against the one before it: a green outline for what appeared, a dashed amber one for what changed, and an amber reference for one that was assigned or repointed. The first step marks nothing, because nothing has happened yet. `hideStepChanges` turns it off, and `diffSteps` is exported for the same comparison elsewhere.

  Two fixes to the stack itself:

  - Only the frame on top can return. Returning from the middle is the one thing a stack cannot do, so the button on the other frames is disabled and says why rather than disappearing. Returning now also removes the references that frame held, which is what leaves an object unreachable for the garbage collector to find.
  - A new frame takes an index one past the deepest frame. Counting the frames instead handed out an index a surviving frame already had, as soon as one in the middle was gone.

- [#11](https://github.com/openpatch/java-memory-playground/pull/11) [`68db131`](https://github.com/openpatch/java-memory-playground/commit/68db1318981d60cd280d8f25c95040ae57eae9e3) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Exercises, garbage prediction, whole-trace export, and presets for teachers.

  - **Exercises.** A step can be marked as one: the teacher authors it as the answer, and a student's playground starts them from the step before it and checks what they build. The check compares the shape reachable from each named root rather than addresses, so a student's own objects match a solution built with different ones, and the report names the variable that is wrong.
  - **Garbage prediction.** With `gcPrediction` on, the collector asks first — the student marks what they think is unreachable and is scored before the sweep.
  - **Download all steps.** One image with every step under its label, which is what a worksheet needs; exporting gave you only the step on screen.
  - **Presets.** `optionPresets` names the option combinations a course moves through — references only, with the stack, everything — as buttons in the config view.

  Also fixes a crash: the reachability walk behind the garbage collector and the stack fading followed references without remembering where it had been, so any reference cycle between two or more objects overflowed the stack and took the whole playground down. A circular linked list did it. It tracks visited nodes now, and an unreachable cycle is collected as it should be.

- [#11](https://github.com/openpatch/java-memory-playground/pull/11) [`e0c760b`](https://github.com/openpatch/java-memory-playground/commit/e0c760bacdaa7ba66c5afb0f5fdfcdab85ca3b48) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Model String as the reference type it is, and make collapsing it a display choice.

  String was listed among the primitive types, so a String value was stored inside the object that held it and drawn as a field of that object. That is the shape of the misconception behind `==` versus `.equals()`, and because it lived in the data model rather than the view, the saved diagram could not express a String reference at all.

  A String value is now a heap object like any other, and the new `inlineStrings` option — on by default — decides whether it is drawn as its own box or shown inside its owner. Default diagrams look exactly as before: a diagram about a linked list does not sprout a box per name. Turning the option off draws the String objects, which is what makes two references to one String, and therefore the string pool, teachable at all.

  Diagrams saved with inline String values are converted when read, so existing links keep working. Surrounding quotes, which used to be typed into the value by hand and were therefore inconsistent between hand-authored and student-created diagrams, are no longer stored — they are rendered.

- [#11](https://github.com/openpatch/java-memory-playground/pull/11) [`e087866`](https://github.com/openpatch/java-memory-playground/commit/e087866eef53185db5e81487dd832574168be804) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Add a help button, and the documentation it opens.

  The toolbar in the top right corner gains a `?` that opens `documentation.html`,
  a single static page served beside the app. It covers reading a diagram and
  building one,
  values against references, steps and traces, the garbage collector, the
  configuration view and every option, the keyboard shortcuts, sharing, embedding,
  and `.jmp` files.

  It explains the `?edit` URL, which nothing until now did: that the app is two
  playgrounds, that appending `?edit` is what turns the student's into the
  teacher's, and that because the diagram lives in the fragment and the mode does
  not, the same picture has both an editing link and a working link.

  The button is a link rather than a button so that whatever owns navigation
  around the playground opens it the way it opens any other link — a new tab in a
  browser, the external browser from a VS Code webview. `window.open` is blocked
  in some of those hosts. The link is relative, so it follows the app wherever it
  is deployed rather than pointing at a domain guessed at here.

  `return` on a stack frame is no longer translated. It is the keyword the student
  would write, and it is spelled the same in a German lesson as in an English one.

- [#11](https://github.com/openpatch/java-memory-playground/pull/11) [`031e1c9`](https://github.com/openpatch/java-memory-playground/commit/031e1c980efcb39e5a832e98d03262044f6fed33) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Keep the diagram in the store, and add undo/redo, keyboard shortcuts and German.

  - Nodes and edges moved out of React Flow's local state into the playground store, so an edit is never lost by switching to the config view or reloading. Save is now a commit that fires `change`, not the only thing that records your work.
  - Undo/redo via zundo, with toolbar buttons and `Ctrl/Cmd+Z` / `Ctrl/Cmd+Y`. Only diagram edits are undoable, and one drag is one step.
  - Keyboard shortcuts for save, undo, redo, config and zoom, overridable through `keyBindings`.
  - English and German translations, selected with the new `language` prop/attribute or the browser language.
  - URL persistence now syncs continuously, throttled and via `history.replaceState`, so it no longer fills up the back button.

- [`77f6706`](https://github.com/openpatch/java-memory-playground/commit/77f67065f9a4976e1aa8389173a57cfeafc0ae35) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Add a black and white mode, for printing.

  A worksheet is run off on a laser printer, and greyscaling the palette turns it
  into four light greys nobody can tell apart — everything the diagram was saying
  in colour is gone. So **B&W** is its own assignment of the roles rather than a
  filter over the normal one: the heap turns white, a stack frame grey, handles
  and references black, and each state that had only a hue to itself grows a line
  style instead. An unreachable object is the box with a dotted border; what a
  step changed is dashed, whether that is the ring around a node or the reference
  itself. Three different broken lines would say nothing, so garbage and change do
  not share one.

  It is a toggle beside the downloads rather than a second download button,
  because it switches the whole playground and the downloads then follow. The PNG
  is a photograph of the live diagram, so what is on screen is what comes out of
  the printer. It is not saved with the diagram: a link shared in print mode would
  otherwise arrive grey.

- [#11](https://github.com/openpatch/java-memory-playground/pull/11) [`f532548`](https://github.com/openpatch/java-memory-playground/commit/f532548a674fd77a17428c2e953827680e7660ff) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Make a diagram a sequence of steps.

  A stack is defined by pushing and popping, and a single frozen picture cannot show either. A diagram now holds a list of steps, with a bar to walk through them and an **Add step** button that duplicates the step on screen so a trace is authored by changing what the next line did.

  This makes a set of things showable that were not: a frame appearing on a call and gone after a return, the assignment that drops the last reference to an object, and what a parameter reassignment does and does not do to the caller.

  - `step` and `onStepChange` on the component, `step` and a `stepchange` event on the custom element, so a page can drive the diagram from its prose and follow along.
  - Node positions are shared across steps, so dragging a node moves it everywhere and the picture does not jump while stepping.
  - Class definitions are reconciled across every step when they change, rather than only the step on screen.
  - Walking through a diagram is not an undo step; changing one is.
  - A one-step diagram is saved in the shape it has always had, so a link to a single picture stays readable by older versions. `hideSteps` hides the bar.

- [#11](https://github.com/openpatch/java-memory-playground/pull/11) [`288ce74`](https://github.com/openpatch/java-memory-playground/commit/288ce744a530e8f6e8d305c5ef2f88fc6c52b11f) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Split the playground into a reusable React package, a web component and the standalone web app.

  - `@openpatch/java-memory-playground` exports a `MemoryPlayground` component that takes the diagram through a `memory` prop and reports saves through `onChange`.
  - `@openpatch/java-memory-playground-web-component` registers `<java-memory-playground>` for use in any page.
  - Each playground now owns its store, so several playgrounds can share a page without overwriting each other.
  - URL persistence is opt-in via `setPersistence`, so an embedded playground no longer takes over the host page's URL.

### Patch Changes

- [`99b36a8`](https://github.com/openpatch/java-memory-playground/commit/99b36a8a45dddc642a9e4fb55882b69826fdf3cb) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Centre the X that deletes a local variable, and match a reference to its
  arrowhead.

  The X sat right of its own button and hung over the edge of it. The button's
  whole declaration block was being ignored: `.method-call-node__delete` is one
  class, `.java-memory-playground button` is one class plus one type, so the
  9px of side padding meant for a full-size button won — and on a button 16px
  wide there was no room left for the glyph, which started at the padding edge
  and overflowed. Scoping the rule through the container, the way `.button-gc`
  already is, gives it back its padding, its transparent background and the red
  it was always supposed to turn on hover. The glyph goes muted rather than
  faint, because with nothing behind it, faint on a Fresh Mint frame is a
  contrast ratio of about 1.7.

  A reference was still drawn in `grey` while the arrowhead capping it had moved
  to the palette, so the head was visibly darker than its line. Both are Charcoal
  now.

- [`8e2c481`](https://github.com/openpatch/java-memory-playground/commit/8e2c48173cab0b0ca03a3cc25d61f05d834e16f2) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Put the references back in the exported PNG.

  The picture came out with arrowheads floating where its references should have
  been. `stroke` had been given as `var(--jmp-text-muted)`, and a custom property
  does not survive being photographed: html-to-image copies computed styles onto
  its clone but stops at an `<svg>`, taking that subtree wholesale, and then
  renders the clone outside `.java-memory-playground`, where `--jmp-*` is not
  defined. An unresolvable `var()` is invalid at computed-value time, so `stroke`
  fell back to its initial `none` and the line vanished — while the arrowhead,
  whose `fill` falls back to black, stayed behind pointing at nothing.

  The few palette entries that have to exist in JavaScript as well as in CSS now
  live in `palette.ts`, with the reason written down, and a test keeps them in
  step with `index.css` so a colour is still only changed in one place.

- [`5fddd92`](https://github.com/openpatch/java-memory-playground/commit/5fddd92cc3501dd23be439eff6ee0acab9e29309) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Line the fields of a node up on the equals sign.

  Each row sized itself, so the sign followed whatever sat beside it: a frame
  holding a reference, an `int` and a `String` came out as three sentences at
  three different indents. The rows of a node now share one set of columns — the
  delete mark, the name, the sign, the value — so the signs fall on a single
  vertical line and the fields read as a table, the way they do in the source the
  diagram stands for.

  A value starts at the near edge of its column rather than the far one, so a
  checkbox stays beside the sign it belongs to instead of drifting off past a
  number field two rows down. A handle is the exception: it is where a reference
  leaves the node, so it stays on the border.

- [#11](https://github.com/openpatch/java-memory-playground/pull/11) [`10dafa8`](https://github.com/openpatch/java-memory-playground/commit/10dafa821b1b992a3b93095ea68d289521e12b43) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Fix diagrams shared before method calls existed opening as the default diagram.

  Links written by early versions have no `methodCalls` section at all. Reading one threw while restoring the state from the URL, and the failure was swallowed, so the playground silently showed its default diagram instead of the one the link pointed at. Persisted state now goes through the same normalization as the `memory` prop, and building the graph tolerates a diagram that is missing whole sections.

- [#11](https://github.com/openpatch/java-memory-playground/pull/11) [`90bed88`](https://github.com/openpatch/java-memory-playground/commit/90bed8886168e7e43a7d53498d305796188fbb65) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Fix a number field that kept counting, and a config view that could not be scrolled.

  Holding the up arrow of a numeric field and letting go left the value climbing until the next click somewhere else. React Flow starts a node drag on `mousedown` and, while dragging, swallows `mouseup` in the capture phase on `window` — so the spin button began its auto-repeat but was never told to stop. Every control inside a node now carries React Flow's `nodrag` class, which keeps the drag from starting over a control in the first place. That also stops a node from being dragged around by its own buttons, and lets text be selected inside an inline String.

  The configuration view is a form, and as soon as a class has a few fields it is taller than the frame. It was laid out inside a `height: 100%` box with nothing to scroll it, so anything past the bottom edge was simply unreachable wherever the playground is clipped — a VS Code webview, or an embedding page. It scrolls now.

- Updated dependencies [[`855fa79`](https://github.com/openpatch/java-memory-playground/commit/855fa797ea77a80fbde760ffc3ce8011d8056c33), [`84267ab`](https://github.com/openpatch/java-memory-playground/commit/84267ab4382479ef71619b008020bd27afb454e4), [`10dafa8`](https://github.com/openpatch/java-memory-playground/commit/10dafa821b1b992a3b93095ea68d289521e12b43), [`a167e4c`](https://github.com/openpatch/java-memory-playground/commit/a167e4c8dd15183a12743171cc2126abd8f2fd8e), [`6d7f9e7`](https://github.com/openpatch/java-memory-playground/commit/6d7f9e733ed048006826854131acbdcbbb3b204b), [`d13e682`](https://github.com/openpatch/java-memory-playground/commit/d13e682db032d9c0e31116635c2adfe02ca52391), [`0e03f93`](https://github.com/openpatch/java-memory-playground/commit/0e03f93db23c1b09c0034b5237041ea2453a2782), [`07c946e`](https://github.com/openpatch/java-memory-playground/commit/07c946e74a784aeca5c363ec566a35cccae7075b), [`99b36a8`](https://github.com/openpatch/java-memory-playground/commit/99b36a8a45dddc642a9e4fb55882b69826fdf3cb), [`f26e570`](https://github.com/openpatch/java-memory-playground/commit/f26e57072f250f23407cb5ea87144138851b15c5), [`2d76eb5`](https://github.com/openpatch/java-memory-playground/commit/2d76eb5f6f857b0e6bb392893352b98c29eb4b77), [`68db131`](https://github.com/openpatch/java-memory-playground/commit/68db1318981d60cd280d8f25c95040ae57eae9e3), [`e0c760b`](https://github.com/openpatch/java-memory-playground/commit/e0c760bacdaa7ba66c5afb0f5fdfcdab85ca3b48), [`8e2c481`](https://github.com/openpatch/java-memory-playground/commit/8e2c48173cab0b0ca03a3cc25d61f05d834e16f2), [`5fddd92`](https://github.com/openpatch/java-memory-playground/commit/5fddd92cc3501dd23be439eff6ee0acab9e29309), [`e087866`](https://github.com/openpatch/java-memory-playground/commit/e087866eef53185db5e81487dd832574168be804), [`031e1c9`](https://github.com/openpatch/java-memory-playground/commit/031e1c980efcb39e5a832e98d03262044f6fed33), [`771b33d`](https://github.com/openpatch/java-memory-playground/commit/771b33d7b8b09cec938d901c0bb66dc8ca3fe9fb), [`77f6706`](https://github.com/openpatch/java-memory-playground/commit/77f67065f9a4976e1aa8389173a57cfeafc0ae35), [`10dafa8`](https://github.com/openpatch/java-memory-playground/commit/10dafa821b1b992a3b93095ea68d289521e12b43), [`f532548`](https://github.com/openpatch/java-memory-playground/commit/f532548a674fd77a17428c2e953827680e7660ff), [`288ce74`](https://github.com/openpatch/java-memory-playground/commit/288ce744a530e8f6e8d305c5ef2f88fc6c52b11f), [`90bed88`](https://github.com/openpatch/java-memory-playground/commit/90bed8886168e7e43a7d53498d305796188fbb65), [`2cce643`](https://github.com/openpatch/java-memory-playground/commit/2cce643fdc88d21799c20cebf0ec7ac2c807a465), [`bbfe2a2`](https://github.com/openpatch/java-memory-playground/commit/bbfe2a2b36e7e2927678be7e8e7d3a8aee840ac2)]:
  - @openpatch/java-memory-playground@0.2.0
