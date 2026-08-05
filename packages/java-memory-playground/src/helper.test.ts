import { describe, expect, test, vi } from "vitest";
import { parseMemory } from "./helper";
import { initialMemory } from "./memory";

describe("parseMemory", () => {
  test("returns null when there is nothing to load", () => {
    expect(parseMemory(undefined)).toBeNull();
    expect(parseMemory(null)).toBeNull();
    expect(parseMemory("")).toBeNull();
  });

  test("parses the JSON string a web component attribute carries", () => {
    const parsed = parseMemory(
      JSON.stringify({
        klasses: { Node: { attributes: { next: "Node" } } },
      }),
    );

    expect(parsed?.klasses).toEqual({ Node: { attributes: { next: "Node" } } });
  });

  test("accepts an already parsed object", () => {
    const parsed = parseMemory({ ...initialMemory });
    expect(parsed?.objects).toEqual(initialMemory.objects);
  });

  test("fills in every section so partial input stays renderable", () => {
    const parsed = parseMemory('{"objects":{}}');

    expect(parsed).not.toBeNull();
    expect(parsed?.variables).toEqual({});
    expect(parsed?.methodCalls).toEqual({});
    expect(parsed?.klasses).toEqual({});
    expect(parsed?.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
  });

  test("keeps the default options and lets the input override them", () => {
    const parsed = parseMemory('{"options":{"hideSidebar":true}}');

    expect(parsed?.options.hideSidebar).toBe(true);
    // Untouched defaults survive.
    expect(parsed?.options.hideDeclareGlobalVariable).toBe(
      initialMemory.options.hideDeclareGlobalVariable,
    );
  });

  test("returns null instead of throwing on unusable input", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(parseMemory("{ not json")).toBeNull();
    expect(parseMemory("[]")).toBeNull();
    expect(parseMemory("42")).toBeNull();

    expect(warn).toHaveBeenCalledTimes(3);
    warn.mockRestore();
  });
});
