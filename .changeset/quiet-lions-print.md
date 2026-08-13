---
"@openpatch/java-memory-playground-web-component": minor
"@openpatch/java-memory-playground": minor
"java-memory-playground-studio": patch
"web": minor
---

Add a black and white mode, for printing.

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
