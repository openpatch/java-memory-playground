# Java Memory Playground

A visual playground for understanding the internals of the stack and heap in Java applications. Create interactive diagrams to visualize objects, references, variables, and method calls.

## For Users

### Using the Playground

Visit **[jmp.openpatch.org](https://jmp.openpatch.org)** to start using the Java Memory Playground in your browser.

### Features

- **Visual Memory Modeling**: Create and visualize Java objects, variables, and method calls
- **Stack and Heap Visualization**: See how the stack (method calls and local variables) and heap (objects) interact
- **References**: Connect variables to objects with visual reference arrows
- **Class Definitions**: Define custom classes with attributes
- **Garbage Collection**: Simulate garbage collection to see which objects would be removed
- **Undo and Redo**: Step back through your edits, with keyboard shortcuts
- **English and German**: The interface follows your browser language

### Saving and Sharing

When you click the **"Save (URL)"** button, your current project state is saved directly to the URL. This means:

- **Persistence**: The URL contains all your work - no account needed
- **Sharing**: Copy and share the URL with others to share your memory diagram
- **Reloading**: Bookmark or save the URL to return to your project later

The URL uses compressed encoding to efficiently store your entire project state in the browser's address bar.

### Teaching Use Case

For educators, the Java Memory Playground is perfect for teaching memory concepts:

1. **Prepare**: Create a memory diagram showing a specific concept (linked lists, object references, method call stack, etc.)
2. **Save**: Click "Save (URL)" to encode your diagram in the URL
3. **Share**: Copy the URL and share it with your students via email, LMS, or messaging
4. **Learn**: Students can open the URL to see your exact diagram, explore it, and modify it for learning

No setup or installation required for students - they just open the link and start learning!

## Embedding

Besides the hosted app, the playground ships as two packages:

- **React component** — integrate it into your own React app
  (see [packages/java-memory-playground](packages/java-memory-playground))
- **Web component** — use it in any page, no framework required
  (see [packages/web-component](packages/web-component))

There are two elements: `<java-memory-playground>` for students, and
`<java-memory-playground-editor>` for teachers, which adds class configuration
and step authoring on top.

## In VS Code

`.jmp` files open as the diagram rather than as JSON
(see [platforms/vscode](platforms/vscode)). A `.jmp` file is the same JSON the
playground puts in a shared link, so a diagram moves between the app, an
embedded playground and the editor unchanged — and being a plain text file, it
diffs and reviews like the code it illustrates.

```html
<java-memory-playground id="playground"></java-memory-playground>

<script src="path/to/index.umd.js"></script>
<script>
  const playground = document.getElementById("playground");
  playground.setAttribute("memory", JSON.stringify(diagram));
  playground.addEventListener("change", (e) => console.log(e.detail));
</script>
```

An embedded playground never touches the URL of its host page, and several of
them can share a page. The UI is available in English and German.

## For Developers

### Prerequisites

- Node.js (v22 or higher)
- pnpm (v11 or higher — the workspace uses pnpm 11's `allowBuilds`)

### Installation

Clone the repository and install dependencies:

```sh
git clone https://github.com/openpatch/java-memory-playground.git
cd java-memory-playground
pnpm install
```

### Routes

The app at [jmp.openpatch.org](https://jmp.openpatch.org) is the student's
playground. Append `?edit` for the teacher's, which adds class configuration and
step authoring.

### Development

Start the standalone app with hot reload:

```sh
pnpm build          # the app consumes the built package
pnpm --filter web dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Building and testing

```sh
pnpm build   # build every package and the app
pnpm test    # run the test suites
pnpm lint    # type-check every package
```

`build` comes first: the packages typecheck against each other through their
built `dist/index.d.ts`, so `lint` cannot resolve them in a checkout that has
never been built.

### Project Structure

This is a pnpm workspace.

- `packages/java-memory-playground/` - the React component library
  - `MemoryPlayground.tsx` - the embeddable entry point (props, change events)
  - `MemoryView.tsx` - main canvas for creating memory diagrams
  - `ConfigView.tsx` - configuration view for defining classes and options
  - `store.ts` - per-instance state (nodes, edges, classes, options), undo
    history and opt-in URL persistence
  - `storeContext.tsx` - scopes a store to one playground instance
  - `translations.ts` - English and German strings
  - `KeyboardShortcuts.tsx` - keyboard handling
  - `serde.ts` - serialization/deserialization for URL encoding
  - `memory.ts` - type definitions for memory objects
- `packages/web-component/` - `<java-memory-playground>` custom element (UMD bundle)
- `platforms/web/` - the standalone app served at jmp.openpatch.org
- `platforms/vscode/` - the VS Code editor for `.jmp` files

### Releasing

Versioning and changelogs are handled by [changesets](https://github.com/changesets/changesets).
Add one describing your change:

```sh
pnpm changeset
```

Merging to `main` opens a "Version Packages" pull request; merging that one
publishes. The npm packages go to npm, and the VS Code extension goes to the
Visual Studio Marketplace and Open VSX in the same run — it is a private
package, but changesets versions and tags private packages, so a changeset
naming `java-memory-playground-studio` releases it too.

Publishing the extension needs the `VSCE_TOKEN` and `OVSX_TOKEN` repository
secrets; see [platforms/vscode/DEVELOPMENT.md](platforms/vscode/DEVELOPMENT.md).

### Technologies

- **React** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **@xyflow/react** - Flow diagram rendering
- **Zustand** - State management
- **Pako** - Compression for URL encoding
- **Zundo** - Undo/redo history
- **@r2wc/react-to-web-component** - React to custom element bridge

## License

MIT
