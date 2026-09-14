---
"@java-memory-playground/java-memory-playground": patch
---

Show a step's whole label, and the whole result of checking an exercise.

The label was clipped with an ellipsis at 260px. On an exercise step the label is the task, so a
reader was being asked to build something the sentence no longer said — and the result of pressing
Check listed the attributes that were wrong on a single unbreakable line.

Both now wrap. They are also the only two things in the step bar allowed to give up width when the
bar is short of it: a button cannot be read at half a word, but a sentence reads fine over three
lines. The measure is capped so that a long note breaks into lines rather than stretching the bar
across the canvas, and a Java identifier longer than the measure breaks mid-word rather than
hanging out of the bar.
