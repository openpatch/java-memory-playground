# Java Memory Playground Studio

Edit `.jmp` files — diagrams of the Java stack and heap — visually, inside VS
Code.

Open a `.jmp` file and the diagram opens instead of the JSON: build objects,
drag references between them, push and pop stack frames, and step through a
trace. It is the same editor as [jmp.openpatch.org](https://jmp.openpatch.org),
with the teacher's tools on.

## Getting started

- **Java Memory Playground: New Diagram** creates a `.jmp` file and opens it.
- Opening any `.jmp` file shows the diagram.
- **Show Source** switches to the JSON; **Show Diagram** switches back.

## Saving

The diagram *is* the file. Every edit goes straight into the document, so the
tab picks up its unsaved dot, `Ctrl+S` saves as usual, and the editor's own undo
works on the file the way it does anywhere else.

The playground's own `Ctrl+S` is unbound here, because VS Code already owns it.

## Classes from Java source

The config view takes the classes as Java rather than asking for each field
through a dialog:

```java
class Node {
    int value;
    Node next;
}
```

Only the structure is read — class names, and the name and type of each field.
Method bodies are skipped and nothing is executed.

## The file format

A `.jmp` file is JSON, the same shape the playground puts in a shared link, so a
diagram moves between the app, an embedded playground and this editor unchanged.
It is a normal text file: diffable, reviewable, and fine to keep in a repository
next to the code it illustrates.

## Keyboard shortcuts

| Shortcut       | Action                      |
| -------------- | --------------------------- |
| `Ctrl/Cmd + Z` | Undo                        |
| `Ctrl/Cmd + Y` | Redo                        |
| `Ctrl/Cmd + ,` | Toggle the config view      |
| `Ctrl/Cmd + +` | Zoom in                     |
| `Ctrl/Cmd + -` | Zoom out                    |
| `Ctrl/Cmd + 0` | Reset zoom                  |
| `Shift + 1`    | Fit the diagram to the view |

## License

MIT
