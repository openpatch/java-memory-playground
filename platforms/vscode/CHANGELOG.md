# Java Memory Playground Studio

## 0.1.2

### Patch Changes

- Updated dependencies [[`eec5689`](https://github.com/openpatch/java-memory-playground/commit/eec5689e3a4dc4740d8302bf9e6e8ca9af5c3c8f)]:
  - @java-memory-playground/java-memory-playground@0.2.1

## 0.1.1

### Patch Changes

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

- [#11](https://github.com/openpatch/java-memory-playground/pull/11) [`90bed88`](https://github.com/openpatch/java-memory-playground/commit/90bed8886168e7e43a7d53498d305796188fbb65) Thanks [@mikebarkmin](https://github.com/mikebarkmin)! - Fix a number field that kept counting, and a config view that could not be scrolled.

  Holding the up arrow of a numeric field and letting go left the value climbing until the next click somewhere else. React Flow starts a node drag on `mousedown` and, while dragging, swallows `mouseup` in the capture phase on `window` — so the spin button began its auto-repeat but was never told to stop. Every control inside a node now carries React Flow's `nodrag` class, which keeps the drag from starting over a control in the first place. That also stops a node from being dragged around by its own buttons, and lets text be selected inside an inline String.

  The configuration view is a form, and as soon as a class has a few fields it is taller than the frame. It was laid out inside a `height: 100%` box with nothing to scroll it, so anything past the bottom edge was simply unreachable wherever the playground is clipped — a VS Code webview, or an embedding page. It scrolls now.

- Updated dependencies [[`855fa79`](https://github.com/openpatch/java-memory-playground/commit/855fa797ea77a80fbde760ffc3ce8011d8056c33), [`84267ab`](https://github.com/openpatch/java-memory-playground/commit/84267ab4382479ef71619b008020bd27afb454e4), [`10dafa8`](https://github.com/openpatch/java-memory-playground/commit/10dafa821b1b992a3b93095ea68d289521e12b43), [`a167e4c`](https://github.com/openpatch/java-memory-playground/commit/a167e4c8dd15183a12743171cc2126abd8f2fd8e), [`6d7f9e7`](https://github.com/openpatch/java-memory-playground/commit/6d7f9e733ed048006826854131acbdcbbb3b204b), [`d13e682`](https://github.com/openpatch/java-memory-playground/commit/d13e682db032d9c0e31116635c2adfe02ca52391), [`0e03f93`](https://github.com/openpatch/java-memory-playground/commit/0e03f93db23c1b09c0034b5237041ea2453a2782), [`07c946e`](https://github.com/openpatch/java-memory-playground/commit/07c946e74a784aeca5c363ec566a35cccae7075b), [`99b36a8`](https://github.com/openpatch/java-memory-playground/commit/99b36a8a45dddc642a9e4fb55882b69826fdf3cb), [`f26e570`](https://github.com/openpatch/java-memory-playground/commit/f26e57072f250f23407cb5ea87144138851b15c5), [`2d76eb5`](https://github.com/openpatch/java-memory-playground/commit/2d76eb5f6f857b0e6bb392893352b98c29eb4b77), [`68db131`](https://github.com/openpatch/java-memory-playground/commit/68db1318981d60cd280d8f25c95040ae57eae9e3), [`e0c760b`](https://github.com/openpatch/java-memory-playground/commit/e0c760bacdaa7ba66c5afb0f5fdfcdab85ca3b48), [`8e2c481`](https://github.com/openpatch/java-memory-playground/commit/8e2c48173cab0b0ca03a3cc25d61f05d834e16f2), [`5fddd92`](https://github.com/openpatch/java-memory-playground/commit/5fddd92cc3501dd23be439eff6ee0acab9e29309), [`e087866`](https://github.com/openpatch/java-memory-playground/commit/e087866eef53185db5e81487dd832574168be804), [`031e1c9`](https://github.com/openpatch/java-memory-playground/commit/031e1c980efcb39e5a832e98d03262044f6fed33), [`771b33d`](https://github.com/openpatch/java-memory-playground/commit/771b33d7b8b09cec938d901c0bb66dc8ca3fe9fb), [`77f6706`](https://github.com/openpatch/java-memory-playground/commit/77f67065f9a4976e1aa8389173a57cfeafc0ae35), [`10dafa8`](https://github.com/openpatch/java-memory-playground/commit/10dafa821b1b992a3b93095ea68d289521e12b43), [`f532548`](https://github.com/openpatch/java-memory-playground/commit/f532548a674fd77a17428c2e953827680e7660ff), [`288ce74`](https://github.com/openpatch/java-memory-playground/commit/288ce744a530e8f6e8d305c5ef2f88fc6c52b11f), [`90bed88`](https://github.com/openpatch/java-memory-playground/commit/90bed8886168e7e43a7d53498d305796188fbb65), [`2cce643`](https://github.com/openpatch/java-memory-playground/commit/2cce643fdc88d21799c20cebf0ec7ac2c807a465), [`bbfe2a2`](https://github.com/openpatch/java-memory-playground/commit/bbfe2a2b36e7e2927678be7e8e7d3a8aee840ac2)]:
  - @openpatch/java-memory-playground@0.2.0

## 0.1.0

- Visual editor for `.jmp` files, backed by the Java Memory Playground.
- Commands: New Diagram, Show Source, Show Diagram.
- Edits go straight into the document, so the dirty marker, `Ctrl+S` and undo
  behave the way they do for any other file.
