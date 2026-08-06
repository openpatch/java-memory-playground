import { afterEach, describe, expect, test, vi } from "vitest";
import {
  createMemoryStore,
  isPersistenceEnabled,
  setPersistence,
} from "./store";
import { Memory, STRING_KLASS, initialMemory } from "./memory";

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

    expect(a.getState().getNodes()).toHaveLength(0);
    expect(b.getState().getNodes().length).toBeGreaterThan(0);
  });

  test("holds the diagram as nodes and edges, not only on save", () => {
    const store = createMemoryStore(false);

    // The initial memory has one method call and four objects.
    expect(store.getState().getNodes().length).toBe(
      Object.keys(initialMemory.objects!).length +
        Object.keys(initialMemory.methodCalls!).length,
    );
    expect(store.getState().getMemory().objects!).toEqual(initialMemory.objects!);
  });

  test("a node moved on the canvas is in the memory right away", () => {
    const store = createMemoryStore(false);
    const target = store.getState().getNodes().find((n: any) => n.type === "object")!;

    store.getState().onNodesChange([
      {
        id: target.id,
        type: "position",
        position: { x: 999, y: 111 },
      },
    ]);

    // No save call in between — the store is the source of truth.
    expect(store.getState().getMemory().objects![target.id].position).toEqual({
      x: 999,
      y: 111,
    });
  });

  test("survives switching to the config view and back", () => {
    const store = createMemoryStore(false);
    const target = store.getState().getNodes().find((n: any) => n.type === "object")!;

    store
      .getState()
      .onNodesChange([
        { id: target.id, type: "position", position: { x: 42, y: 42 } },
      ]);
    store.getState().setRoute("config");
    store.getState().setRoute("view");

    expect(store.getState().getMemory().objects![target.id].position).toEqual({
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

    expect(store.getState().getMemory().objects!).toEqual(initialMemory.objects!);
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

  test("opens a link from before method calls existed", () => {
    // This diagram has no `methodCalls` key at all. Reading it used to throw
    // inside the persist merge, which silently dropped the user back to the
    // default diagram instead of the one they were sent.
    stubLocation(
      "#pako:eNq1lk1v2zgQhv9K1rcFWpVDDodkLptbe9iPQxfYSy4URaVqLSuQ5Gyzgf_7jqwPJ5YVJHELw5BEisOXj17OcPVwvWpa38br1SXflrGs6vv-vrpti2rT9A9fiix-5n_qa27I_bqJu3fXq7si_ntb1W3_0ne-CG69H67_VVXJt9C9-W3tmyYO0X4vmmGIb9u6SLft2BO2dR03XWf_1p9VxtJ4fF7UzYlmjnrcuuumOzyemmUTv5-IFapNy3P_lX6Noe_-IzaNvxljTk-nQm6bWG98GffjPnPf5mYftB2netSW9bwPbbt9_Go_8RDvSpCM2uaZN3nunR-m3WOcpO-jLSN82E_l_76_jfPV3vn1tmvebNfr3SPALxrE-ryRzhiRB5sGmynkVRy-x0uDRGWU1w6NDz4TIRtI31ZN0ZnvYCuwiVRGSydRAQoCHHz2HhOSGoQ1ZEkLR7CPcELeHN-kaMEfL12FEdbJXGWZA6IQbI_i2E7H0SY7PQ2WYiDrhJIQyHmDi0gkUoL8pkTUghc-EgGlEqOMQxJaSWddD2Qu8ucBOfFZ3w4kQrAmmBSVRUVpvggEbQdEggJrLKLTExF2DxkJ5FCydQhtj2Qu8ychGffYGwmwbBODcyIQqSzCIgGDJlHaONCK16lBDwC4GdAQsBmk4p-gHsDca08BPNbzTMJ7eKy2LL7FMcsdVjZlukNKfDLqk1-vq1-eH5dNZeowTgqpPoD8INQFiEslnomwsIsIEimsFcIQIuDETEmbWCkEyg6Y1NoMppnZ8XxmX6u3INuejQtejUsrpiKo200OLO-lkZbqMGqDKNGBII09rbl1z6eV10XmX8_rnyJe3MQvbfPb2dzw1dwsmASBtCV0Bu1UvthaieBMLQwKTTRWr0gujaBTlWkTfE4_AlssyzdQ-7htLy5_PZuYeTUxQJewZziVKS0tOTkWfOg2puVcJsFy1dPg-uPTna8Ln65HDFdZ8EhRpWxIh2IseNMZrewRNsfJdn7uOimPZegEgAUKZTjjHhLHe0q0NOQM8JGEu9Dt3p0oEj26KytTTSoPLmRZkD49UllsQlUypqXaOPPJglgjEquQuCaikdZpNdEUmHAZVCiUMHyYALWkdqAc66aPLXar_wFTSdLd",
    );

    const store = createMemoryStore(true);

    expect(Object.keys(store.getState().klasses)).toEqual([
      "List",
      "ListNode",
      "Message",
    ]);
    const objects = store.getState().getMemory().objects!;
    const strings = Object.values(objects).filter(
      (o) => o.klass === STRING_KLASS,
    );

    // Eight objects as authored, plus one String object per String field that
    // used to hold its characters inline (4 Messages x 3 fields).
    expect(Object.values(objects)).toHaveLength(20);
    expect(strings).toHaveLength(12);
    // Quotes were decoration typed into the old value field, not data.
    expect(strings.map((s) => s.literal)).toContain("mike");
    expect(strings.map((s) => s.literal)).toContain("Hallo!");
    expect(Object.keys(store.getState().getMemory().variables!)).toHaveLength(2);
  });
});

describe("the call stack", () => {
  const frame = (index: number) => ({
    name: `f${index}`,
    index,
    localVariables: {},
    position: { x: 0, y: index * 40 },
  });

  const withFrames = (indices: number[]) => {
    const store = createMemoryStore(false);
    store.getState().loadMemory({
      ...emptyMemory,
      methodCalls: Object.fromEntries(indices.map((i) => [i, frame(i)])),
    });
    return store;
  };

  test("a new frame goes on top of the deepest one", () => {
    const store = withFrames([0, 1, 2]);
    const nodes = store.getState().getNodes();
    const deepest = Math.max(
      ...nodes.filter((n: any) => n.type === "method-call").map((n: any) => n.data.index),
    );

    expect(deepest).toBe(2);
  });

  test("frame indices stay unique after one returns", () => {
    // Counting the frames to pick the next index handed out one a surviving
    // frame already had, as soon as a frame in the middle was gone.
    const store = withFrames([0, 2]);
    const indices = store
      .getState()
      .getNodes()
      .filter((n: any) => n.type === "method-call")
      .map((n: any) => n.data.index);

    const next = Math.max(...indices, -1) + 1;

    expect(indices).toEqual([0, 2]);
    expect(indices).not.toContain(next);
  });
});

describe("exercises", () => {
  const node = (next?: string) => ({
    klass: "Node",
    attributes: { next: { dataType: "Node", value: next } },
    position: { x: 0, y: 0 },
  });

  const exerciseMemory: Memory = {
    ...emptyMemory,
    klasses: { Node: { attributes: { next: "Node" } } },
    steps: [
      {
        objects: { "@a": node() },
        variables: {
          "@v": { name: "head", dataType: "Node", value: "@a", position: { x: 0, y: 0 } },
        },
        methodCalls: {},
      },
      {
        exercise: true,
        label: "add a second node",
        objects: { "@a": node("@b"), "@b": node() },
        variables: {
          "@v": { name: "head", dataType: "Node", value: "@a", position: { x: 0, y: 0 } },
        },
        methodCalls: {},
      },
    ],
  };

  test("a student starts an exercise from the step before it", () => {
    const store = createMemoryStore(false, "view");
    store.getState().loadMemory(exerciseMemory);
    store.getState().goToStep(1);

    // One object, as in step 1 — not the two of the solution.
    expect(
      store.getState().getNodes().filter((n: any) => n.type === "object"),
    ).toHaveLength(1);
  });

  test("the teacher sees the solution instead", () => {
    const store = createMemoryStore(false, "edit");
    store.getState().loadMemory(exerciseMemory);
    store.getState().goToStep(1);

    expect(
      store.getState().getNodes().filter((n: any) => n.type === "object"),
    ).toHaveLength(2);
  });

  test("checking an unfinished attempt says which root is wrong", () => {
    const store = createMemoryStore(false, "view");
    store.getState().loadMemory(exerciseMemory);
    store.getState().goToStep(1);

    store.getState().checkExercise();

    expect(store.getState().exerciseResult?.correct).toBe(false);
    expect(store.getState().exerciseResult?.wrong).toEqual(["head"]);
  });

  test("revealing the solution makes the check pass", () => {
    const store = createMemoryStore(false, "view");
    store.getState().loadMemory(exerciseMemory);
    store.getState().goToStep(1);

    store.getState().revealSolution();
    store.getState().checkExercise();

    expect(store.getState().exerciseResult?.correct).toBe(true);
  });

  test("saving from a student's playground keeps the exercise, not the attempt", () => {
    const store = createMemoryStore(false, "view");
    store.getState().loadMemory(exerciseMemory);
    store.getState().goToStep(1);
    store.getState().setNodes([]);

    const saved = store.getState().getMemory();

    expect(saved.steps![1].exercise).toBe(true);
    expect(Object.keys(saved.steps![1].objects)).toHaveLength(2);
  });
});

describe("garbage collection", () => {
  const withGarbage = () => {
    const store = createMemoryStore(false);
    store.getState().loadMemory({
      ...emptyMemory,
      klasses: { Node: { attributes: { next: "Node" } } },
      objects: {
        "@kept": { klass: "Node", attributes: {}, position: { x: 0, y: 0 } },
        "@junk": { klass: "Node", attributes: {}, position: { x: 0, y: 0 } },
      },
      variables: {
        "@v": { name: "head", dataType: "Node", value: "@kept", position: { x: 0, y: 0 } },
      },
    });
    return store;
  };

  test("collects what no root reaches", () => {
    const store = withGarbage();

    store.getState().collectGarbage();

    const ids = store.getState().getNodes().map((n: any) => n.id);
    expect(ids).toContain("@kept");
    expect(ids).not.toContain("@junk");
  });

  test("scores a prediction before sweeping it away", () => {
    const store = withGarbage();

    store.getState().startGcPrediction();
    store.getState().toggleGcPrediction("@junk");
    store.getState().collectGarbage();

    expect(store.getState().gcResult).toEqual({ found: 1, missed: 0, wrong: 0 });
  });

  test("marking a reachable object counts against the prediction", () => {
    const store = withGarbage();

    store.getState().startGcPrediction();
    store.getState().toggleGcPrediction("@kept");
    store.getState().collectGarbage();

    expect(store.getState().gcResult).toEqual({ found: 0, missed: 1, wrong: 1 });
  });

  test("a prediction can be unmarked again", () => {
    const store = withGarbage();

    store.getState().startGcPrediction();
    store.getState().toggleGcPrediction("@junk");
    store.getState().toggleGcPrediction("@junk");

    expect(store.getState().gcPrediction).toEqual([]);
  });

  test("collecting without predicting scores nothing", () => {
    const store = withGarbage();

    store.getState().collectGarbage();

    expect(store.getState().gcResult).toBeNull();
  });
});

describe("mode", () => {
  test("a playground is the student's unless asked otherwise", () => {
    expect(createMemoryStore(false).getState().mode).toBe("view");
    expect(createMemoryStore(false, "edit").getState().mode).toBe("edit");
  });

  test("a student's playground cannot be routed into the configuration", () => {
    const store = createMemoryStore(false, "view");

    store.getState().setRoute("config");

    expect(store.getState().route).toBe("view");
  });

  test("the editor can", () => {
    const store = createMemoryStore(false, "edit");

    store.getState().setRoute("config");
    expect(store.getState().route).toBe("config");

    store.getState().setRoute("view");
    expect(store.getState().route).toBe("view");
  });

  test("mode is per playground, like everything else", () => {
    const student = createMemoryStore(false, "view");
    const teacher = createMemoryStore(false, "edit");

    teacher.getState().setRoute("config");

    expect(student.getState().route).toBe("view");
    expect(teacher.getState().route).toBe("config");
  });
});

describe("steps", () => {
  test("a diagram without steps is a one-step story", () => {
    const store = createMemoryStore(false);

    expect(store.getState().steps).toHaveLength(1);
    expect(store.getState().currentStep).toBe(0);
  });

  test("adding a step copies the one on screen and moves to it", () => {
    const store = createMemoryStore(false);
    const before = store.getState().getNodes().length;

    store.getState().addStep();

    expect(store.getState().steps).toHaveLength(2);
    expect(store.getState().currentStep).toBe(1);
    expect(store.getState().getNodes()).toHaveLength(before);
  });

  test("editing a step leaves the others alone", () => {
    const store = createMemoryStore(false);
    store.getState().addStep();
    store.getState().setNodes([]);

    expect(store.getState().getNodes()).toHaveLength(0);
    store.getState().goToStep(0);
    expect(store.getState().getNodes().length).toBeGreaterThan(0);
  });

  test("moving a node moves it in every step", () => {
    const store = createMemoryStore(false);
    store.getState().addStep();
    const target = store.getState().getNodes().find((n: any) => n.type === "object")!;

    store
      .getState()
      .onNodesChange([
        { id: target.id, type: "position", position: { x: 500, y: 500 } },
      ]);

    // Layout belongs to the diagram, so scrubbing does not make things jump.
    store.getState().goToStep(0);
    expect(
      store.getState().getNodes().find((n: any) => n.id === target.id)!.position,
    ).toEqual({ x: 500, y: 500 });
  });

  test("goToStep stays inside the story", () => {
    const store = createMemoryStore(false);
    store.getState().addStep();

    store.getState().goToStep(99);
    expect(store.getState().currentStep).toBe(1);
    store.getState().goToStep(-5);
    expect(store.getState().currentStep).toBe(0);
  });

  test("the last step cannot be deleted", () => {
    const store = createMemoryStore(false);

    store.getState().deleteStep(0);
    expect(store.getState().steps).toHaveLength(1);
  });

  test("deleting a step keeps the cursor in range", () => {
    const store = createMemoryStore(false);
    store.getState().addStep();
    store.getState().deleteStep(1);

    expect(store.getState().steps).toHaveLength(1);
    expect(store.getState().currentStep).toBe(0);
  });

  test("a one-step diagram is still written in the old shape", () => {
    const store = createMemoryStore(false);
    const memory = store.getState().getMemory();

    // So that a link to a single picture stays readable by older versions.
    expect(memory.steps).toBeUndefined();
    expect(memory.objects).toBeDefined();
  });

  test("a multi-step diagram round-trips through the URL", async () => {
    const location = stubLocation();

    const writer = createMemoryStore(true);
    writer.getState().addStep();
    writer.getState().setNodes([]);
    writer.getState().setStepLabel(1, "everything returned");

    expect(writer.getState().getMemory().steps).toHaveLength(2);

    // Writes are throttled, so wait for the trailing one to land.
    await new Promise((resolve) => setTimeout(resolve, 400));
    location.hash = "#" + location.hash.replace(/^#/, "");
    const reader = createMemoryStore(true);

    expect(reader.getState().steps).toHaveLength(2);
    expect(reader.getState().steps[1].label).toBe("everything returned");
    expect(reader.getState().steps[1].nodes).toHaveLength(0);
    expect(reader.getState().steps[0].nodes.length).toBeGreaterThan(0);
    // A reader always starts at the beginning of the story.
    expect(reader.getState().currentStep).toBe(0);
  });
});

describe("undo/redo", () => {
  test("undoes an edit to the diagram", () => {
    const store = createMemoryStore(false);
    const before = store.getState().getNodes().length;

    store.getState().setNodes((nodes) => nodes.slice(1));
    expect(store.getState().getNodes().length).toBe(before - 1);

    store.temporal.getState().undo();
    expect(store.getState().getNodes().length).toBe(before);

    store.temporal.getState().redo();
    expect(store.getState().getNodes().length).toBe(before - 1);
  });

  test("does not record navigation as an undo step", () => {
    const store = createMemoryStore(false);

    store.getState().setRoute("config");
    store.getState().selectNodeId("@33");
    store.getState().addStep();
    store.getState().goToStep(0);

    // Adding a step changes the story, so that is undoable; walking through it
    // is not.
    expect(store.temporal.getState().pastStates).toHaveLength(1);
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
