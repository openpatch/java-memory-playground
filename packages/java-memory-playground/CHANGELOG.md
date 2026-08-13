# @openpatch/java-memory-playground

## 0.2.1

### Patch Changes

- [`eec5689`](https://github.com/openpatch/java-memory-playground/commit/eec5689e3a4dc4740d8302bf9e6e8ca9af5c3c8f) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Use java-memory-playground organization

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

- [#11](https://github.com/openpatch/java-memory-playground/pull/11) [`84267ab`](https://github.com/openpatch/java-memory-playground/commit/84267ab4382479ef71619b008020bd27afb454e4) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Add `onEdit`, which fires on every edit rather than only on Save.

  `onChange` says the user considers the diagram finished. A host that owns the file and has a save of its own — an editor with a dirty marker — needs the other signal: that something changed just now. Loading a `memory` prop is deliberately not an edit, so opening a diagram does not mark it as changed, and neither is panning or zooming, though the viewport is written along with the next real edit.

  React Flow writes measurements back as it mounts, which replaces the steps without changing the diagram, so an edit is only reported when what would be written to a file actually differs.

- [#11](https://github.com/openpatch/java-memory-playground/pull/11) [`a167e4c`](https://github.com/openpatch/java-memory-playground/commit/a167e4c8dd15183a12743171cc2126abd8f2fd8e) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Translate React Flow's own accessible text.

  React Flow ships its ARIA descriptions and control labels in English, so a German playground announced "Zoom In", "Fit View" and "Press enter or space to select a node" beside its own translated labels. They go through `ariaLabelConfig` now and follow the playground's language like everything else.

- [#11](https://github.com/openpatch/java-memory-playground/pull/11) [`d13e682`](https://github.com/openpatch/java-memory-playground/commit/d13e682db032d9c0e31116635c2adfe02ca52391) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Fix exported images losing every reference arrow.

  An exported diagram had its objects and frames but none of the arrows between them, which is most of what a memory diagram says. Exporting deep-clones the edge SVG and drops anything a stylesheet contributed, so the stroke our CSS supplied never made it into the picture and the paths came out invisible. Edges carry their stroke inline now.

  The capture also frames the whole diagram before photographing it and crops to the nodes, so nothing scrolled out of view is missing and the empty canvas is gone, and it keeps the arrowheads, whose SVG markers live outside the viewport.

- [#11](https://github.com/openpatch/java-memory-playground/pull/11) [`07c946e`](https://github.com/openpatch/java-memory-playground/commit/07c946e74a784aeca5c363ec566a35cccae7075b) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Ship the licence with the packages.

  Both declared `"license": "MIT"` but published only `dist`, so neither tarball carried the licence text it was pointing at.

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

- [#11](https://github.com/openpatch/java-memory-playground/pull/11) [`f26e570`](https://github.com/openpatch/java-memory-playground/commit/f26e57072f250f23407cb5ea87144138851b15c5) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Say what applying a set of classes will cost before it happens.

  Classes belong to the whole diagram, so saving them reaches every step — and pasting a new file over the old one can quietly delete what the objects were holding. Save now names it first: the fields that go and how many objects lose a value or a reference with them, and the objects whose class is gone, which stay in the diagram but can never be made again.

  It only asks when there is something to lose. Adding a field, or changing classes no object uses, still saves without a dialog, because a warning that always appears is one nobody reads. A field nobody has typed into counts as empty even though an `int` shows a `0` and a `boolean` shows a box — that is what the field starts out holding, not something to lose.

  `defaultValueFor` says what a field of a given type starts out holding. New objects and new arrays were each deciding that for themselves, in the same way, in two places.

  A removed reference field now takes its edge with it. The attribute was deleted but the edge stayed behind, drawn from a handle that no longer existed, and the reference came back if the field ever did.

- [#11](https://github.com/openpatch/java-memory-playground/pull/11) [`2d76eb5`](https://github.com/openpatch/java-memory-playground/commit/2d76eb5f6f857b0e6bb392893352b98c29eb4b77) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Stop the garbage collector button from covering the step bar.

  The collector was pinned bottom-right and the step bar bottom-centre, as separate panels that could not see each other. Below about 1000px of canvas they slid into each other, and the collector sat on top of "Add step" and "Delete step" — at 768px "Delete step" could not be clicked at all.

  They share one row now, so they cannot overlap at any width: side by side when there is room, the collector on its own line when there is not.

  The row also gets the width it is entitled to. React Flow centres a bottom-centre panel with `left: 50%`, which caps how wide it can shrink-to-fit at half the canvas, so the row was wrapping with the whole right half of the screen still empty.

  The step bar itself wraps as a last resort rather than pushing its own buttons off the edge of a narrow screen.

  The bottom bar is one card rather than two. Side by side, the step controls and the collector were two cards of different heights nudged together by a 4px gap. Every control in the row is the same height now, and the collector wears the colour the diagram uses for garbage, which is what tells it apart from the step controls next to it.

  `.button-gc` never applied. It is one class, and `.java-memory-playground button` is a class plus a type, so the collector had been taking the default button background all along.

  The bottom row stops short of the zoom controls in the corner below it, and the toolbar stops short of the palette across from it, wrapping onto a second line instead of sliding underneath. Every floating overlay is now clear of every other one from 1400px down to 380px of canvas.

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

- [#11](https://github.com/openpatch/java-memory-playground/pull/11) [`771b33d`](https://github.com/openpatch/java-memory-playground/commit/771b33d7b8b09cec938d901c0bb66dc8ca3fe9fb) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Define the classes of a diagram by pasting Java source.

  A teacher already has the classes written down — in a worksheet, in an IDE, on a slide — so the config view now takes them as Java instead of asking for each field through a dialog. Only the structure is read: class names, and the name and type of each field. Method bodies are skipped whole and nothing is executed or interpreted.

  Comments, modifiers, initialisers, generics, qualified names, arrays written either way round, records and several names in one declaration are all understood. Source that cannot be read yet is reported above the editor without throwing the classes away, and the class list is still there as a tab for changing one field.

  `long`, `short` and `byte` count as primitives now. They were missing, so a field declared with one of them became a reference instead of a number.

  `parseJavaClasses` and `toJavaSource` are exported.

- [#11](https://github.com/openpatch/java-memory-playground/pull/11) [`10dafa8`](https://github.com/openpatch/java-memory-playground/commit/10dafa821b1b992a3b93095ea68d289521e12b43) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Fix diagrams shared before method calls existed opening as the default diagram.

  Links written by early versions have no `methodCalls` section at all. Reading one threw while restoring the state from the URL, and the failure was swallowed, so the playground silently showed its default diagram instead of the one the link pointed at. Persisted state now goes through the same normalization as the `memory` prop, and building the graph tolerates a diagram that is missing whole sections.

- [#11](https://github.com/openpatch/java-memory-playground/pull/11) [`90bed88`](https://github.com/openpatch/java-memory-playground/commit/90bed8886168e7e43a7d53498d305796188fbb65) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Fix a number field that kept counting, and a config view that could not be scrolled.

  Holding the up arrow of a numeric field and letting go left the value climbing until the next click somewhere else. React Flow starts a node drag on `mousedown` and, while dragging, swallows `mouseup` in the capture phase on `window` — so the spin button began its auto-repeat but was never told to stop. Every control inside a node now carries React Flow's `nodrag` class, which keeps the drag from starting over a control in the first place. That also stops a node from being dragged around by its own buttons, and lets text be selected inside an inline String.

  The configuration view is a form, and as soon as a class has a few fields it is taller than the frame. It was laid out inside a `height: 100%` box with nothing to scroll it, so anything past the bottom edge was simply unreachable wherever the playground is clipped — a VS Code webview, or an embedding page. It scrolls now.

- [#11](https://github.com/openpatch/java-memory-playground/pull/11) [`2cce643`](https://github.com/openpatch/java-memory-playground/commit/2cce643fdc88d21799c20cebf0ec7ac2c807a465) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Float the node palette over the canvas instead of taking a column out of it.

  The palette is a panel now, like every other control, so a small embed keeps its whole width for the diagram. Dragging a class onto the canvas works from there unchanged.

  Exports are framed to the diagram's nodes rather than photographing the canvas, which crops away the empty space and keeps the palette, toolbar, step bar and collector button out of the picture.

- [#11](https://github.com/openpatch/java-memory-playground/pull/11) [`bbfe2a2`](https://github.com/openpatch/java-memory-playground/commit/bbfe2a2b36e7e2927678be7e8e7d3a8aee840ac2) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Pack the canvas more tightly.

  A diagram is read as a whole, so padding inside a node is diagram that has to go somewhere else. Rows, headers, bodies, handles, the palette and the step bar are all tighter: an object with two fields went from 102×135 to 96×85, a three-field one from 203×176 to 183×111, and a frame with three locals from 184×276 to 182×198 — a third of the height, with nothing removed.

  How tight is now four custom properties on the container (`--jmp-space`, `--jmp-space-lg`, `--jmp-radius`, `--jmp-handle`) rather than a number repeated down the stylesheet, so a projector or a touch screen can loosen everything at once.

  Framing the diagram reserves the space the floating panels occupy. The palette is drawn on top of the canvas, so fitting the nodes edge to edge parked the first frame of the default diagram underneath it and hid its name. A hidden panel gives its side back.

  A String is as wide as what it holds. It was a fixed 80px, which was too much room for an empty one and not enough for `"Hello World!"`.

  The delete mark on a frame's references is a small × rather than a full-size button. It repeats on every reference, so at full size it competed with the variable names for attention.
