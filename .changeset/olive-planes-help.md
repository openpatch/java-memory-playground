---
"@openpatch/java-memory-playground-web-component": minor
"@openpatch/java-memory-playground": minor
"java-memory-playground-studio": patch
"web": minor
---

Add a help button, and the documentation it opens.

The toolbar in the top right corner gains a `?` that opens
[the documentation](https://jmp.openpatch.org/documentation.html), a single
static page served with the app. It covers reading a diagram and building one,
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
in some of those hosts. The URL is absolute for the same reason: an embedded
playground would resolve a relative one against a page that is not the app.

`return` on a stack frame is no longer translated. It is the keyword the student
would write, and it is spelled the same in a German lesson as in an English one.
