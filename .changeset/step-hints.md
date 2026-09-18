---
"@java-memory-playground/java-memory-playground": patch
---

Show the hint a step carries.

A step has always been able to hold a `note`. It survived the file, the link and the undo history,
and then nothing ever drew it: the field was documented as "not currently rendered by the UI". On
an exercise step it did not even survive that far — the student's working step kept the label and
dropped the note, so the hint went missing on exactly the step it was written for, and so did
revealing the solution.

The note is now the step's hint. A **Hint** button appears on any step that has one, and the text
opens under the controls when it is pressed — asked for, never volunteered, because a hint that is
on screen from the start is part of the task and the exercise is then a different one. On an
exercise it sits before **Show solution**, which is the point: a student who is stuck had only the
choice between trying again and being handed the answer, and now there is a rung between the two.
Moving to another step closes it again.

Authors write it beside the label, in a field of its own. It travels with the diagram, so a hint
reaches the student whether the step arrived as a `.jmp` file, a share link or an embedded
playground.
