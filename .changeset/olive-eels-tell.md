---
"@openpatch/java-memory-playground-web-component": minor
"@openpatch/java-memory-playground": minor
"web": minor
---

Exercises, garbage prediction, whole-trace export, and presets for teachers.

- **Exercises.** A step can be marked as one: the teacher authors it as the answer, and a student's playground starts them from the step before it and checks what they build. The check compares the shape reachable from each named root rather than addresses, so a student's own objects match a solution built with different ones, and the report names the variable that is wrong.
- **Garbage prediction.** With `gcPrediction` on, the collector asks first — the student marks what they think is unreachable and is scored before the sweep.
- **Download all steps.** One image with every step under its label, which is what a worksheet needs; exporting gave you only the step on screen.
- **Presets.** `optionPresets` names the option combinations a course moves through — references only, with the stack, everything — as buttons in the config view.

Also fixes a crash: the reachability walk behind the garbage collector and the stack fading followed references without remembering where it had been, so any reference cycle between two or more objects overflowed the stack and took the whole playground down. A circular linked list did it. It tracks visited nodes now, and an unreachable cycle is collected as it should be.
