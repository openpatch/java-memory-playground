---
"@java-memory-playground/java-memory-playground": patch
---

Let a step carry assignments the reader can run.

Dragging an edge onto its target says where a reference should end up. It cannot say what
`neu.next = current.next` means, because that depends on where `current.next` points *at the moment
the line runs* — and that is the whole difficulty of rewiring a linked list. Both orders of those
two lines reach the same picture when you drag; only one of them does when you run them. Until now
the playground could ask for the finished shape and mark it right or wrong, but the mistake itself —
the node that ends up pointing at itself, the tail that falls off the end — had no way of appearing
on the canvas.

A step can now carry **statements**: lines the reader fires in an order they choose. Each is
evaluated against the diagram as it stands, so the right-hand side is read from the picture rather
than from the text. Run the two lines the wrong way round and the new node points at itself and the
rest of the list greys out, because the reachability the garbage collector already draws says so.
A numbered log keeps the order that was chosen, since "I did it the other way round" is the thing
worth seeing, and **Start over** puts the diagram back to before the first line ran. A line that
cannot run — an unknown name, a null dereference, an `int` field — says why and leaves the diagram
untouched.

They are part of the instruction, so they travel with the label and the hint: to the student's
working step, through a share link, a `.jmp` file and the embedded component. Authors write them
beside the label, separated by semicolons. Checking an exercise is unchanged — the lines are another
way to build the step, not another way to be marked.
