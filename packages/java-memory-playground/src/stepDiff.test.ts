import { describe, expect, test } from "vitest";
import { diffSteps } from "./stepDiff";
import { StoreStep } from "./store";
import { CustomEdgeType, CustomNodeType } from "./types";

const objectNode = (
  id: string,
  attributes: Record<string, unknown> = {},
  position = { x: 0, y: 0 },
): CustomNodeType =>
  ({
    id,
    type: "object",
    position,
    data: { klass: "Node", attributes, position },
  }) as unknown as CustomNodeType;

const frameNode = (id: string, index: number): CustomNodeType =>
  ({
    id,
    type: "method-call",
    position: { x: 0, y: 0 },
    data: { name: "f", index, localVariables: {}, position: { x: 0, y: 0 } },
  }) as unknown as CustomNodeType;

const edge = (id: string, source: string, handle: string, target: string) =>
  ({ id, source, sourceHandle: handle, target }) as CustomEdgeType;

const step = (
  nodes: CustomNodeType[],
  edges: CustomEdgeType[] = [],
): StoreStep => ({ nodes, edges });

describe("diffSteps", () => {
  test("nothing has happened on the first step", () => {
    const diff = diffSteps(undefined, step([objectNode("@a")]));

    expect(diff.added.size).toBe(0);
    expect(diff.changed.size).toBe(0);
    expect(diff.edges.size).toBe(0);
  });

  test("a frame pushed on a call is an addition", () => {
    const diff = diffSteps(
      step([objectNode("@a")]),
      step([objectNode("@a"), frameNode("1", 0)]),
    );

    expect([...diff.added]).toEqual(["1"]);
    expect(diff.changed.size).toBe(0);
  });

  test("an unchanged diagram highlights nothing", () => {
    const before = step([objectNode("@a", { next: { dataType: "Node" } })]);
    const after = step([objectNode("@a", { next: { dataType: "Node" } })]);

    const diff = diffSteps(before, after);

    expect(diff.added.size).toBe(0);
    expect(diff.changed.size).toBe(0);
  });

  test("an attribute that got a value marks the object changed", () => {
    const diff = diffSteps(
      step([objectNode("@a", { count: { dataType: "int", value: 0 } })]),
      step([objectNode("@a", { count: { dataType: "int", value: 1 } })]),
    );

    expect([...diff.changed]).toEqual(["@a"]);
  });

  test("moving a node is not a change", () => {
    // Layout is shared across steps, so a position difference says nothing
    // about what the step did.
    const diff = diffSteps(
      step([objectNode("@a", {}, { x: 0, y: 0 })]),
      step([objectNode("@a", {}, { x: 400, y: 300 })]),
    );

    expect(diff.changed.size).toBe(0);
  });

  test("a new reference is highlighted", () => {
    const diff = diffSteps(
      step([objectNode("@a"), objectNode("@b")]),
      step(
        [objectNode("@a"), objectNode("@b")],
        [edge("e1", "@a", "next", "@b")],
      ),
    );

    expect([...diff.edges]).toEqual(["e1"]);
  });

  test("a reference that now points elsewhere is highlighted", () => {
    const before = step(
      [objectNode("@a"), objectNode("@b"), objectNode("@c")],
      [edge("e1", "@a", "next", "@b")],
    );
    const after = step(
      [objectNode("@a"), objectNode("@b"), objectNode("@c")],
      [edge("e1", "@a", "next", "@c")],
    );

    expect([...diffSteps(before, after).edges]).toEqual(["e1"]);
  });

  test("a reference that stayed put is not highlighted", () => {
    const edges = [edge("e1", "@a", "next", "@b")];
    const diff = diffSteps(
      step([objectNode("@a"), objectNode("@b")], edges),
      step([objectNode("@a"), objectNode("@b")], edges),
    );

    expect(diff.edges.size).toBe(0);
  });

  test("a frame that returned leaves nothing to highlight", () => {
    // The frame is gone, so there is no node left to mark — what the step shows
    // is the absence.
    const diff = diffSteps(
      step([objectNode("@a"), frameNode("1", 0)]),
      step([objectNode("@a")]),
    );

    expect(diff.added.size).toBe(0);
    expect(diff.changed.size).toBe(0);
  });

  test("an object identified the same but of another class is a change", () => {
    const before = step([objectNode("@a")]);
    const after = step([
      {
        ...objectNode("@a"),
        data: { klass: "Other", attributes: {}, position: { x: 0, y: 0 } },
      } as unknown as CustomNodeType,
    ]);

    expect([...diffSteps(before, after).changed]).toEqual(["@a"]);
  });
});
