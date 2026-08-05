import { afterEach, describe, expect, test, vi } from "vitest";
import {
  createMemoryStore,
  isPersistenceEnabled,
  setPersistence,
} from "./store";
import { Memory, initialMemory } from "./memory";

afterEach(() => {
  setPersistence(false);
  vi.unstubAllGlobals();
});

const stubLocation = (hash = "") => {
  const location = { hash };
  vi.stubGlobal("location", location);
  return location;
};

const emptyMemory: Memory = {
  viewport: { x: 0, y: 0, zoom: 1 },
  options: {},
  klasses: {},
  objects: {},
  variables: {},
  methodCalls: {},
};

describe("createMemoryStore", () => {
  test("gives every playground its own diagram", () => {
    const a = createMemoryStore(false);
    const b = createMemoryStore(false);

    a.getState().loadMemory(emptyMemory);

    expect(a.getState().nodes).toHaveLength(0);
    expect(b.getState().nodes.length).toBeGreaterThan(0);
  });

  test("holds the diagram as nodes and edges, not only on save", () => {
    const store = createMemoryStore(false);

    // The initial memory has one method call and four objects.
    expect(store.getState().nodes.length).toBe(
      Object.keys(initialMemory.objects).length +
        Object.keys(initialMemory.methodCalls).length,
    );
    expect(store.getState().getMemory().objects).toEqual(initialMemory.objects);
  });

  test("a node moved on the canvas is in the memory right away", () => {
    const store = createMemoryStore(false);
    const target = store.getState().nodes.find((n) => n.type === "object")!;

    store.getState().onNodesChange([
      {
        id: target.id,
        type: "position",
        position: { x: 999, y: 111 },
      },
    ]);

    // No save call in between — the store is the source of truth.
    expect(store.getState().getMemory().objects[target.id].position).toEqual({
      x: 999,
      y: 111,
    });
  });

  test("survives switching to the config view and back", () => {
    const store = createMemoryStore(false);
    const target = store.getState().nodes.find((n) => n.type === "object")!;

    store
      .getState()
      .onNodesChange([
        { id: target.id, type: "position", position: { x: 42, y: 42 } },
      ]);
    store.getState().setRoute("config");
    store.getState().setRoute("view");

    expect(store.getState().getMemory().objects[target.id].position).toEqual({
      x: 42,
      y: 42,
    });
  });

  test("a non-persisting store never touches the URL", () => {
    const location = stubLocation("#pako:something");

    const store = createMemoryStore(false);
    store.getState().loadMemory(emptyMemory);

    expect(location.hash).toBe("#pako:something");
    expect(store.getState().persistence).toBe(false);
  });

  test("a persisting store writes the diagram into the URL", () => {
    const location = stubLocation();

    const store = createMemoryStore(true);
    store.getState().loadMemory({ ...emptyMemory, klasses: {} });

    expect(location.hash.startsWith("pako:")).toBe(true);
  });

  test("survives a corrupt hash instead of throwing", () => {
    stubLocation("#pako:this-is-not-valid");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const store = createMemoryStore(true);

    expect(store.getState().getMemory().objects).toEqual(initialMemory.objects);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  test("round-trips a diagram through the URL", () => {
    const location = stubLocation();

    const writer = createMemoryStore(true);
    writer.getState().loadMemory({
      ...emptyMemory,
      klasses: { Foo: { attributes: { bar: "int" } } },
    });

    // A second store reading the hash the first one produced.
    location.hash = "#" + location.hash.replace(/^#/, "");
    const reader = createMemoryStore(true);

    expect(reader.getState().klasses).toEqual({
      Foo: { attributes: { bar: "int" } },
    });
  });

  test("still reads a hash written in the pre-refactor format", () => {
    // A hash produced before nodes/edges moved into the store: the URL has
    // always held a `Memory`, and shared links must keep working.
    stubLocation(
      "#pako:eNptUEESgjAM_EvPHvTqUR_gAY9cAgaoloZJA4oOfze04IwzHDrZbHY3k5pPboKAYG6OCltsiceEqRNLPqSmsTfM9BXASlTgAk673AwWnx2xJNFLy17ZcalvolbhYVY-HISAS9rJeuDxyrisBRG2RS_r3GE1R_4LNYRt3WwOSvKCPo0uxR1LhdO8NtNgX29vGcD1GC2raooeigFRFG8EtlA4_BEtSkO3MziXqGgakIN-13z5ZL4ndnbd",
    );

    const store = createMemoryStore(true);

    expect(Object.keys(store.getState().klasses)).toEqual([
      "BinaryTree",
      "String",
    ]);
  });
});

describe("undo/redo", () => {
  test("undoes an edit to the diagram", () => {
    const store = createMemoryStore(false);
    const before = store.getState().nodes.length;

    store.getState().setNodes((nodes) => nodes.slice(1));
    expect(store.getState().nodes.length).toBe(before - 1);

    store.temporal.getState().undo();
    expect(store.getState().nodes.length).toBe(before);

    store.temporal.getState().redo();
    expect(store.getState().nodes.length).toBe(before - 1);
  });

  test("does not record navigation as an undo step", () => {
    const store = createMemoryStore(false);

    store.getState().setRoute("config");
    store.getState().selectNodeId("@33");

    expect(store.temporal.getState().pastStates).toHaveLength(0);
  });

  test("each playground has its own history", () => {
    const a = createMemoryStore(false);
    const b = createMemoryStore(false);

    a.getState().setNodes([]);

    expect(a.temporal.getState().pastStates.length).toBeGreaterThan(0);
    expect(b.temporal.getState().pastStates).toHaveLength(0);
  });
});

describe("save", () => {
  test("bumps saveCount so a host can tell an edit from a commit", () => {
    const store = createMemoryStore(false);

    expect(store.getState().saveCount).toBe(0);
    store.getState().setNodes([]);
    expect(store.getState().saveCount).toBe(0);

    store.getState().save();
    expect(store.getState().saveCount).toBe(1);
  });
});

describe("language", () => {
  test("falls back to English for an unsupported language", () => {
    const store = createMemoryStore(false);

    store.getState().setDefaultLanguage("fr");
    expect(store.getState().getLanguage()).toBe("en");
    expect(store.getState().getTranslations().save).toBe("Save");
  });

  test("uses an explicitly requested language", () => {
    const store = createMemoryStore(false);

    store.getState().setDefaultLanguage("de");
    expect(store.getState().getLanguage()).toBe("de");
    expect(store.getState().getTranslations().save).toBe("Speichern");
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
