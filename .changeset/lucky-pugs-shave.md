---
"@openpatch/java-memory-playground-web-component": patch
"@openpatch/java-memory-playground": patch
"java-memory-playground-studio": patch
"web": patch
---

Centre the X that deletes a local variable, and match a reference to its
arrowhead.

The X sat right of its own button and hung over the edge of it. The button's
whole declaration block was being ignored: `.method-call-node__delete` is one
class, `.java-memory-playground button` is one class plus one type, so the
9px of side padding meant for a full-size button won — and on a button 16px
wide there was no room left for the glyph, which started at the padding edge
and overflowed. Scoping the rule through the container, the way `.button-gc`
already is, gives it back its padding, its transparent background and the red
it was always supposed to turn on hover. The glyph goes muted rather than
faint, because with nothing behind it, faint on a Fresh Mint frame is a
contrast ratio of about 1.7.

A reference was still drawn in `grey` while the arrowhead capping it had moved
to the palette, so the head was visibly darker than its line. Both are Charcoal
now.
