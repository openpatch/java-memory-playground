---
"@openpatch/java-memory-playground": patch
---

Define the classes of a diagram by pasting Java source.

A teacher already has the classes written down — in a worksheet, in an IDE, on a slide — so the config view now takes them as Java instead of asking for each field through a dialog. Only the structure is read: class names, and the name and type of each field. Method bodies are skipped whole and nothing is executed or interpreted.

Comments, modifiers, initialisers, generics, qualified names, arrays written either way round, records and several names in one declaration are all understood. Source that cannot be read yet is reported above the editor without throwing the classes away, and the class list is still there as a tab for changing one field.

`long`, `short` and `byte` count as primitives now. They were missing, so a field declared with one of them became a reference instead of a number.

`parseJavaClasses` and `toJavaSource` are exported.
