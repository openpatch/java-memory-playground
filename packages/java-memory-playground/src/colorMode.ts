import { useEffect, useState, type RefObject } from "react";

/** The scheme the playground draws with: `"dark"` or `"light"`. */
export type ColorMode = "light" | "dark";

/**
 * The scheme the playground draws with.
 *
 * The playground's look is pure CSS that resolves against the `color-scheme`
 * of whatever contains it — every colour token is a `light-dark()` pair (see
 * index.css). What is drawn into an `<svg>` has to be a literal colour,
 * though: an edge's stroke and its arrowhead are set inline, because
 * html-to-image photographs the SVG outside the container where the custom
 * properties are not defined (see `palette.ts`). Those literals come from
 * `paletteFor(colorMode)`, so the prop is derived from the same place the CSS
 * resolves: the used color-scheme of the playground's own root element,
 * inherited from its container.
 *
 * `color-scheme` has no event of its own, and reading it is cheap, so changes
 * of whatever the host flips it with are the signal to read again — hosts
 * switch in different ways:
 *
 * - a class or style on `<html>`/`<body>` (the VS Code workbench does, and so
 *   do most sites), watched with a MutationObserver;
 * - a stylesheet media flip (Hyperbook books do, when their dark-mode toggle
 *   switches light.css/dark.css), which the toggle announces with a bubbling
 *   `colorschemechange` event on the document;
 * - the OS, when the host declared `color-scheme: light dark`, watched
 *   through the `prefers-color-scheme` media query.
 *
 * An environment without `matchMedia` (a test) reads `light dark` as light,
 * which is what the tests expect.
 */
const usedColorScheme = (element: Element): ColorMode => {
  const schemes = getComputedStyle(element)
    .colorScheme.trim()
    .toLowerCase()
    .split(/\s+/);
  if (schemes.includes("dark")) {
    // `dark` is outright. `light dark` follows the system, the way the CSS
    // above resolves it.
    if (!schemes.includes("light")) return "dark";
    if (
      typeof matchMedia === "function" &&
      matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
  }
  // `light`, and `normal` or nothing: a host that wants dark mode declares
  // it, and light is what the light-dark() palette shows without one.
  return "light";
};

/**
 * `"dark"` while the playground's container is in a dark color-scheme,
 * `"light"` otherwise; follows the host's theme changes.
 */
export const useColorMode = (target: RefObject<Element | null>): ColorMode => {
  const [colorMode, setColorMode] = useState<ColorMode>("light");

  useEffect(() => {
    const element = target.current;
    if (!element) return;

    const update = () => setColorMode(usedColorScheme(element));
    update();

    const attributes: MutationObserverInit = {
      attributes: true,
      attributeFilter: ["class", "style"],
    };
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, attributes);
    observer.observe(document.body, attributes);

    // Hyperbook's dark-mode toggle switches its stylesheets rather than a
    // class, and dispatches this event (bubbling) when it does.
    document.addEventListener("colorschemechange", update);

    let media: MediaQueryList | null = null;
    if (typeof matchMedia === "function") {
      media = matchMedia("(prefers-color-scheme: dark)");
      media.addEventListener("change", update);
    }

    return () => {
      observer.disconnect();
      document.removeEventListener("colorschemechange", update);
      media?.removeEventListener("change", update);
    };
  }, [target]);

  return colorMode;
};

export { usedColorScheme };
