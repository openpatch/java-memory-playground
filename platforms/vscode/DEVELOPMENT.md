# Java Memory Playground VS Code extension

The VS Code editor for `.jmp` files.

## Architecture

Two halves, built separately because they run in different places:

1. **Extension host** (`src/extension.ts`, `src/MemoryEditorProvider.ts`) — Node.
   Registers the custom editor, owns the document, provides the commands.
2. **Webview** (`src/webview.tsx`) — a browser. Renders
   `MemoryPlaygroundEditor` and talks to the host by message passing.

### The document is the source of truth

Every edit in the webview is written into the `TextDocument`. That single
decision is what gets the dirty marker, `Ctrl+S`, the editor's undo stack and
side-by-side source editing for free, instead of the extension reimplementing
them.

Two things follow from it:

- **Our own writes must not come back.** Applying an edit fires
  `onDidChangeTextDocument`; reloading the webview from that would discard the
  user's undo history and whatever they had selected. The provider remembers
  the text it last wrote and ignores exactly that.
- **A save must not miss the last keystroke.** Edits are debounced by 250ms, so
  `onWillSaveTextDocument` asks the webview to flush and returns the result as a
  `TextEdit` from `waitUntil` — the sanctioned way to amend a document on its
  way to disk. If the webview does not answer within 500ms the save proceeds
  with what the document already has.

### Messages

| Direction | Message               | Meaning                                        |
| --------- | --------------------- | ---------------------------------------------- |
| →  host   | `ready`               | The webview mounted; send the content.         |
| →  host   | `edit` + `content`    | The diagram changed (debounced).               |
| →  host   | `save` + `content`    | The playground's Save button; write and save.  |
| →  host   | `flushed` + `content` | Answer to `flush`.                             |
| →  webview| `update` + `content`  | The document changed; load this.               |
| →  webview| `flush`               | A save is waiting; send the diagram now.       |

The `onEdit` prop on `MemoryPlaygroundEditor` is what makes this possible: it
fires on every edit, unlike `onChange`, which fires only when the user presses
the playground's own Save. Loading a `memory` prop is deliberately not an edit,
so opening a file does not mark it dirty.

## Building

```sh
# The webview bundles the playground package, so build that first.
pnpm --filter @openpatch/java-memory-playground build
pnpm --filter java-memory-playground-studio build
```

`scripts/build-vscode.mjs` bundles the extension for Node, the webview for the
browser, and copies the playground's stylesheet to `dist/webview.css` — a
webview's content security policy allows one stylesheet and one script, so
everything else is inlined.

## Running it

```sh
pnpm --filter java-memory-playground-studio watch
```

Then open this folder in VS Code and press F5. In the Extension Development
Host, open `example.jmp`.

## Packaging

```sh
cd platforms/vscode
pnpm vscode:package
```

## Releasing

`.github/workflows/changeset-version.yml` does it on a push to `main`.

The extension is a private package, but the changesets config versions and tags
private packages, so a changeset naming `java-memory-playground-studio` bumps it
along with everything else. The vsix is built *before* the changesets step on
purpose: on the run that publishes, `package.json` already carries the new
version, because that run is the merge of the "Version Packages" pull request
that bumped it.

Publishing needs two repository secrets:

| Secret        | For                                          |
| ------------- | -------------------------------------------- |
| `VSCE_TOKEN`  | the Visual Studio Marketplace                 |
| `OVSX_TOKEN`  | [Open VSX](https://open-vsx.org), for VSCodium and friends |

Without them the npm release still happens and only the extension step fails.
`skipDuplicate` is on, so a run where the extension version did not change skips
its upload instead of failing.

## Known gaps

- **No `.jmp` schema.** The JSON is validated only by the playground's tolerant
  parser, so a hand-edited file with a typo silently loses that part of the
  diagram rather than reporting it.
- **Untitled files.** The editor is registered for the `untitled` scheme, but a
  new untitled `.jmp` starts empty rather than from the template that
  `jmp.new` writes.
- **PNG export is untested here.** Both download buttons work by clicking an
  anchor with a `data:` URL, which a webview may refuse. The rest of the
  playground has been exercised against this bundle; those two have not.
