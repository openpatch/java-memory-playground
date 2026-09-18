---
"@java-memory-playground/java-memory-playground": patch
---

Open an exercise from a link on the task, not on the answer.

A diagram reaching the playground through the URL skipped the step every other route takes: the
exercise steps were never moved aside. Opening a shared link to an exercise put the solution on the
canvas, with no **Your turn**, no **Check** and nothing behind them — the exercise was simply gone,
and the reader had no way to know one had been authored.

Which is the route that matters most: handing over a link is how a teacher shares a diagram, and the
hash is what the **Save (URL)** button writes. A diagram opened from a file or set through the
embedded component's `memory` attribute was always split correctly; only the link was not.

Reading a diagram from the URL now splits exercises exactly as loading one does, and the teacher's
playground keeps seeing the authored steps.
