---
"@openpatch/java-memory-playground-web-component": minor
"@openpatch/java-memory-playground": minor
"java-memory-playground-studio": patch
"web": minor
---

Paint everything in the OpenPatch palette.

The playground had accumulated around two hundred colour literals — mostly
Tailwind's greys, spelled out one at a time in a stylesheet and in the inline
styles of the configuration view. They are now a set of custom properties: the
palette from the branding repository, and roles filled by it. Restyling means
reassigning a role rather than hunting hex codes.

The accent goes to the stack. A frame is Fresh Mint and the heap stays neutral,
so the split the diagram is about is the one carried by colour, and handles —
the thing you drag a reference from — are OpenPatch Green. Boolean fields get
`accent-color`, so a checkbox is no longer painted in the browser's own blue,
which was the one colour on the canvas nobody had chosen.

Two roles are deliberately not from the palette. A diagram has to say
"unreachable, about to be collected" and "changed since the last step", and
neither reads as green, so danger and warning are one muted hue each, defined
in the same place as everything else. Success is the brand green.

The PNG export keeps literals, because a canvas has no stylesheet to read; they
are named after the palette entries and sit next to each other at the top of
the file.
