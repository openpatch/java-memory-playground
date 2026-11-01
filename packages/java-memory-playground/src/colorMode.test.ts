import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usedColorScheme } from "./colorMode";

/*
 * The hook derives the JS-side palette from the used color-scheme of the
 * playground's root element, the same place the CSS light-dark() pairs
 * resolve — the two must agree or an edge drawn inline is the wrong colour.
 * The test runs in a node environment, so there is no cascade for
 * `color-scheme`; getComputedStyle and matchMedia are stubbed and the pure
 * reader is probed directly.
 */

const schemeOf = vi.hoisted(() => vi.fn(() => ""));

const mediaList = (matches: boolean) => ({ matches }) as MediaQueryList;
const matchMediaMock = vi.fn(() => mediaList(false));

beforeEach(() => {
  schemeOf.mockReturnValue("");
  matchMediaMock.mockImplementation(() => mediaList(false));
  vi.stubGlobal("getComputedStyle", () => ({ colorScheme: schemeOf() }));
  vi.stubGlobal("matchMedia", matchMediaMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** The hook reads the scheme of whatever element it is given. */
const element = {} as Element;

describe("usedColorScheme", () => {
  it("is dark in a dark color-scheme", () => {
    schemeOf.mockReturnValue("dark");
    expect(usedColorScheme(element)).toBe("dark");
  });

  it("is light in a light one, and in a page without a scheme", () => {
    schemeOf.mockReturnValue("light");
    expect(usedColorScheme(element)).toBe("light");

    schemeOf.mockReturnValue("");
    expect(usedColorScheme(element)).toBe("light");

    schemeOf.mockReturnValue("normal");
    expect(usedColorScheme(element)).toBe("light");
  });

  it("follows the system where the scheme is `light dark`", () => {
    schemeOf.mockReturnValue("light dark");
    matchMediaMock.mockImplementation(() => mediaList(false));
    expect(usedColorScheme(element)).toBe("light");

    matchMediaMock.mockImplementation(() => mediaList(true));
    expect(usedColorScheme(element)).toBe("dark");
  });

  it("reads `light dark` as light without matchMedia", () => {
    vi.stubGlobal("matchMedia", undefined);
    schemeOf.mockReturnValue("light dark");
    expect(usedColorScheme(element)).toBe("light");
  });
});
