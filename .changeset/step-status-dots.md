---
"@java-memory-playground/java-memory-playground": patch
---

Say how each step went, one dot per step.

There was one verdict for the whole diagram, and nothing cleared it: solving a step turned the bar
green, and walking on to the next step left the green standing under a step nobody had answered
yet. The same went for red.

A check now belongs to the step it judged, and the bar carries a dot for every step: black for a
step of the trace, with nothing to do; yellow for an exercise not checked yet; green for one that
was got right; red for one that was not. A tick and a cross inside the green and the red dots say
it again for anyone who cannot tell the two hues apart, and for the printer. The dots are also the
quickest way to get to a step — clicking one goes there.

A verdict is kept with a fingerprint of the diagram it judged, so changing the step puts it back to
not-checked rather than leaving a stale answer standing; moving a node, which changes nothing a
check looks at, leaves it alone. Being shown the solution is no longer scored as having got it
right.
