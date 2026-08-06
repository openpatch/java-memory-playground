---
"@openpatch/java-memory-playground": patch
---

Say what applying a set of classes will cost before it happens.

Classes belong to the whole diagram, so saving them reaches every step — and pasting a new file over the old one can quietly delete what the objects were holding. Save now names it first: the fields that go and how many objects lose a value or a reference with them, and the objects whose class is gone, which stay in the diagram but can never be made again.

It only asks when there is something to lose. Adding a field, or changing classes no object uses, still saves without a dialog, because a warning that always appears is one nobody reads. A field nobody has typed into counts as empty even though an `int` shows a `0` and a `boolean` shows a box — that is what the field starts out holding, not something to lose.

`defaultValueFor` says what a field of a given type starts out holding. New objects and new arrays were each deciding that for themselves, in the same way, in two places.

A removed reference field now takes its edge with it. The attribute was deleted but the edge stayed behind, drawn from a handle that no longer existed, and the reference came back if the field ever did.
