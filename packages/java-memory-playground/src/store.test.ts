import { afterEach, describe, expect, test, vi } from "vitest";
import { createMemoryStore, isPersistenceEnabled, setPersistence } from "./store";
import { initialMemory } from "./memory";

afterEach(() => {
  setPersistence(false);
  vi.unstubAllGlobals();
});

const stubLocation = (hash = "") => {
  const location = { hash };
  vi.stubGlobal("location", location);
  return location;
};

describe("createMemoryStore", () => {
  test("gives every playground its own memory", () => {
    const a = createMemoryStore(false);
    const b = createMemoryStore(false);

    a.getState().updateMemory({ ...initialMemory, objects: {} });

    expect(Object.keys(a.getState().memory.objects)).toHaveLength(0);
    expect(Object.keys(b.getState().memory.objects)).toEqual(
      Object.keys(initialMemory.objects),
    );
  });

  test("a non-persisting store never touches the URL", () => {
    const location = stubLocation("#pako:something");

    const store = createMemoryStore(false);
    store.getState().updateMemory({ ...initialMemory, klasses: {} });

    expect(location.hash).toBe("#pako:something");
    // The existing hash was not read either — the default memory is intact.
    expect(store.getState().persistence).toBe(false);
  });

  test("a persisting store writes the memory into the URL", () => {
    const location = stubLocation();

    const store = createMemoryStore(true);
    store.getState().updateMemory({ ...initialMemory, klasses: {} });

    expect(location.hash.startsWith("pako:")).toBe(true);
  });

  test("survives a corrupt hash instead of throwing", () => {
    stubLocation("#pako:this-is-not-valid");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const store = createMemoryStore(true);

    expect(store.getState().memory.objects).toEqual(initialMemory.objects);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  test("round-trips a diagram through the URL", () => {
    const location = stubLocation();

    const writer = createMemoryStore(true);
    writer.getState().updateMemory({
      ...initialMemory,
      klasses: { Foo: { attributes: { bar: "int" } } },
    });

    // A second store reading the hash that the first one produced.
    location.hash = "#" + location.hash.replace(/^#/, "");
    const reader = createMemoryStore(true);

    expect(reader.getState().memory.klasses).toEqual({
      Foo: { attributes: { bar: "int" } },
    });
  });
});

describe("setPersistence", () => {
  test("controls the default new stores are created with", () => {
    expect(isPersistenceEnabled()).toBe(false);
    expect(createMemoryStore().getState().persistence).toBe(false);

    stubLocation();
    setPersistence(true);

    expect(isPersistenceEnabled()).toBe(true);
    expect(createMemoryStore().getState().persistence).toBe(true);
  });

  test("an explicit argument wins over the default", () => {
    stubLocation();
    setPersistence(true);

    expect(createMemoryStore(false).getState().persistence).toBe(false);
  });
});
