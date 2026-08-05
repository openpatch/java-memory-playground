---
"@openpatch/java-memory-playground-web-component": minor
"@openpatch/java-memory-playground": minor
"web": minor
---

Model String as the reference type it is, and make collapsing it a display choice.

String was listed among the primitive types, so a String value was stored inside the object that held it and drawn as a field of that object. That is the shape of the misconception behind `==` versus `.equals()`, and because it lived in the data model rather than the view, the saved diagram could not express a String reference at all.

A String value is now a heap object like any other, and the new `inlineStrings` option — on by default — decides whether it is drawn as its own box or shown inside its owner. Default diagrams look exactly as before: a diagram about a linked list does not sprout a box per name. Turning the option off draws the String objects, which is what makes two references to one String, and therefore the string pool, teachable at all.

Diagrams saved with inline String values are converted when read, so existing links keep working. Surrounding quotes, which used to be typed into the value by hand and were therefore inconsistent between hand-authored and student-created diagrams, are no longer stored — they are rendered.
