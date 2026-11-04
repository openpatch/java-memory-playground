import { describe, expect, test } from "vitest";

import { pruneFontCss, unicodeRangesOf } from "./fontSubset";

const face = (name: string, range?: string) =>
  `@font-face { font-family: 'Inter'; src: url(data:font/woff2;base64,${name}); ${
    range ? `unicode-range: ${range};` : ""
  } }`;

const latin = face("LATIN", "U+0000-00FF, U+0131, U+0152-0153");
const cyrillic = face("CYRILLIC", "U+0400-045F, U+0490-0491");
const greek = face("GREEK", "U+0370-0377, U+037A-037F");

describe("unicodeRangesOf", () => {
  test("reads ranges and single code points", () => {
    expect(unicodeRangesOf(latin)).toEqual([
      [0x0000, 0x00ff],
      [0x0131, 0x0131],
      [0x0152, 0x0153],
    ]);
  });

  test("expands a wildcard range", () => {
    expect(unicodeRangesOf(face("X", "U+4??"))).toEqual([[0x400, 0x4ff]]);
  });

  test("a face without a range covers everything", () => {
    expect(unicodeRangesOf(face("ALL"))).toBeNull();
  });
});

describe("pruneFontCss", () => {
  test("keeps only the subsets the text uses", () => {
    const css = [latin, cyrillic, greek].join("\n");

    const pruned = pruneFontCss(css, "head = head.next");

    expect(pruned).toContain("LATIN");
    expect(pruned).not.toContain("CYRILLIC");
    expect(pruned).not.toContain("GREEK");
  });

  test("keeps a subset as soon as one character needs it", () => {
    const pruned = pruneFontCss([latin, cyrillic].join("\n"), "name = \"Жанна\"");

    expect(pruned).toContain("CYRILLIC");
  });

  test("keeps a face that declares no range", () => {
    expect(pruneFontCss(face("ALL"), "x")).toContain("ALL");
  });

  test("embeds a face that appears twice only once", () => {
    const pruned = pruneFontCss([latin, latin].join("\n"), "x");

    expect(pruned.match(/LATIN/g)).toHaveLength(1);
  });

  test("leaves rules that are not font faces alone", () => {
    expect(pruneFontCss(`.x { color: red; }\n${cyrillic}`, "x")).toContain(
      ".x { color: red; }",
    );
  });
});
