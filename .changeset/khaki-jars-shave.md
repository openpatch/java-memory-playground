---
"@openpatch/java-memory-playground-web-component": minor
"@openpatch/java-memory-playground": minor
"web": minor
---

Mark what each step changed, and make the call stack behave like one.

Walking a trace only helps if you can see what moved, so a step is now marked against the one before it: a green outline for what appeared, a dashed amber one for what changed, and an amber reference for one that was assigned or repointed. The first step marks nothing, because nothing has happened yet. `hideStepChanges` turns it off, and `diffSteps` is exported for the same comparison elsewhere.

Two fixes to the stack itself:

- Only the frame on top can return. Returning from the middle is the one thing a stack cannot do, so the button on the other frames is disabled and says why rather than disappearing. Returning now also removes the references that frame held, which is what leaves an object unreachable for the garbage collector to find.
- A new frame takes an index one past the deepest frame. Counting the frames instead handed out an index a surviving frame already had, as soon as one in the middle was gone.
