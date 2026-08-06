import { describe, expect, test } from "vitest";
import { canonicalRoots, checkAgainst } from "./canonical";
import { StoreStep } from "./store";
import { CustomEdgeType, CustomNodeType } from "./types";

const obj = (id: string, klass: string, attributes: Record<string, any> = {}) =>
  ({
    id,
    type: "object",
    position: { x: 0, y: 0 },
    data: { klass, attributes, position: { x: 0, y: 0 } },
  }) as unknown as CustomNodeType;

const str = (id: string, literal: string) =>
  ({
    id,
    type: "object",
    position: { x: 0, y: 0 },
    data: { klass: "String", literal, attributes: {}, position: { x: 0, y: 0 } },
  }) as unknown as CustomNodeType;

const variable = (id: string, name: string) =>
  ({
    id,
    type: "variable",
    position: { x: 0, y: 0 },
    data: { name, dataType: "Node", value: null, position: { x: 0, y: 0 } },
  }) as unknown as CustomNodeType;

const edge = (source: string, handle: string, target: string) =>
  ({
    id: `${source}+${handle}`,
    source,
    sourceHandle: handle,
    target,
  }) as CustomEdgeType;

const step = (nodes: CustomNodeType[], edges: CustomEdgeType[] = []): StoreStep => ({
  nodes,
  edges,
});

const ref = { dataType: "Node" };

describe("canonicalRoots", () => {
  test("describes the shape reachable from a variable", () => {
    const s = step(
      [
        variable("@v", "head"),
        obj("@a", "Node", { next: ref }),
        obj("@b", "Node", { next: ref }),
      ],
      [edge("@v", "", "@a"), edge("@a", "next", "@b")],
    );

    expect(canonicalRoots(s).head).toBe("Node{next=Node{next=null}}");
  });

  test("an unset reference is null", () => {
    const s = step([variable("@v", "head")], []);

    expect(canonicalRoots(s).head).toBe("null");
  });

  test("addresses do not appear, so two diagrams can be compared", () => {
    // The same shape, built with different addresses — which is what happens
    // when a student allocates their own objects.
    const mine = step(
      [variable("@v", "head"), obj("@x1", "Node", { next: ref })],
      [edge("@v", "", "@x1")],
    );
    const theirs = step(
      [variable("@zzz", "head"), obj("@9f2c", "Node", { next: ref })],
      [edge("@zzz", "", "@9f2c")],
    );

    expect(canonicalRoots(mine)).toEqual(canonicalRoots(theirs));
  });

  test("a cycle becomes a back reference instead of looping forever", () => {
    const s = step(
      [variable("@v", "head"), obj("@a", "Node", { next: ref })],
      [edge("@v", "", "@a"), edge("@a", "next", "@a")],
    );

    expect(canonicalRoots(s).head).toBe("Node{next=#0}");
  });

  test("String values are compared by their characters", () => {
    const s = step(
      [
        variable("@v", "name"),
        obj("@p", "Person", { name: { dataType: "String" } }),
        str("@s", "Ada"),
      ],
      [edge("@v", "", "@p"), edge("@p", "name", "@s")],
    );

    expect(canonicalRoots(s).name).toBe('Person{name="Ada"}');
  });

  test("primitives are part of the shape", () => {
    const s = step(
      [
        variable("@v", "c"),
        obj("@a", "Counter", { count: { dataType: "int", value: 3 } }),
      ],
      [edge("@v", "", "@a")],
    );

    expect(canonicalRoots(s).c).toBe("Counter{count=3}");
  });

  test("frame locals are roots, keyed by frame and name", () => {
    const frame = {
      id: "1",
      type: "method-call",
      position: { x: 0, y: 0 },
      data: {
        name: "App.main",
        index: 0,
        localVariables: { node: ref },
        position: { x: 0, y: 0 },
      },
    } as unknown as CustomNodeType;

    const s = step(
      [frame, obj("@a", "Node", { next: ref })],
      [edge("1", "node", "@a")],
    );

    expect(canonicalRoots(s)["0:App.main.node"]).toBe("Node{next=null}");
  });
});

describe("checkAgainst", () => {
  const solution = step(
    [
      variable("@v", "head"),
      obj("@a", "Node", { next: ref }),
      obj("@b", "Node", { next: ref }),
    ],
    [edge("@v", "", "@a"), edge("@a", "next", "@b")],
  );

  test("accepts the same shape built with other addresses", () => {
    const attempt = step(
      [
        variable("@mine", "head"),
        obj("@one", "Node", { next: ref }),
        obj("@two", "Node", { next: ref }),
      ],
      [edge("@mine", "", "@one"), edge("@one", "next", "@two")],
    );

    expect(checkAgainst(solution, attempt).correct).toBe(true);
  });

  test("names the root that is wrong", () => {
    // Only one node linked, where the solution has two.
    const attempt = step(
      [variable("@mine", "head"), obj("@one", "Node", { next: ref })],
      [edge("@mine", "", "@one")],
    );

    const result = checkAgainst(solution, attempt);

    expect(result.correct).toBe(false);
    expect(result.wrong).toEqual(["head"]);
  });

  test("a root that was never built counts as wrong, not missing silently", () => {
    const result = checkAgainst(solution, step([], []));

    expect(result.correct).toBe(false);
    expect(result.wrong).toEqual(["head"]);
  });

  test("reports a root the attempt invented", () => {
    const attempt = step(
      [
        variable("@mine", "head"),
        variable("@extra", "tail"),
        obj("@one", "Node", { next: ref }),
        obj("@two", "Node", { next: ref }),
      ],
      [edge("@mine", "", "@one"), edge("@one", "next", "@two")],
    );

    const result = checkAgainst(solution, attempt);

    expect(result.correct).toBe(false);
    expect(result.extra).toEqual(["tail"]);
  });

  test("the order objects were created in does not matter", () => {
    const attempt = step(
      [
        obj("@two", "Node", { next: ref }),
        obj("@one", "Node", { next: ref }),
        variable("@mine", "head"),
      ],
      [edge("@one", "next", "@two"), edge("@mine", "", "@one")],
    );

    expect(checkAgainst(solution, attempt).correct).toBe(true);
  });
});
