---
"@java-memory-playground/java-memory-playground": patch
---

Let a numeric attribute or local variable be cleared while typing.

The field rendered `value || 0`, so deleting the last digit put a `0` straight back. To enter `5`
you had to type it in front of that zero and then delete the zero — `50`, then backspace.

An emptied field now stays empty for as long as it has focus, and falls back to `0` on blur, so a
field left blank still holds a number.
