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

  test("a temporary variable the solution lacks does not make it wrong", () => {
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

    expect(result.correct).toBe(true);
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

  test("says where the attempt goes wrong, as a path", () => {
    const attempt = step(
      [variable("@mine", "head"), obj("@one", "Node", { next: ref })],
      [edge("@mine", "", "@one")],
    );

    const [diff] = checkAgainst(solution, attempt).diffs;

    // The solution's head.next is a node; the attempt's is null.
    expect(diff).toMatchObject({ kind: "expectedObject", path: "head.next" });
    expect(diff.at).toEqual({ owner: "@one", handle: "next" });
  });

  test("an object where the solution has null should be null", () => {
    const attempt = step(
      [
        variable("@mine", "head"),
        obj("@one", "Node", { next: ref }),
        obj("@two", "Node", { next: ref }),
        obj("@three", "Node", { next: ref }),
      ],
      [
        edge("@mine", "", "@one"),
        edge("@one", "next", "@two"),
        edge("@two", "next", "@three"),
      ],
    );

    expect(checkAgainst(solution, attempt).diffs).toMatchObject([
      { kind: "expectedNull", path: "head.next.next" },
    ]);
  });
});

describe("checkAgainst: sharing", () => {
  // `a` and `b` refer to one and the same node.
  const shared = step(
    [variable("@a", "a"), variable("@b", "b"), obj("@n", "Node", { next: ref })],
    [edge("@a", "", "@n"), edge("@b", "", "@n")],
  );
  // `a` and `b` each refer to a node of their own that looks just the same.
  const separate = step(
    [
      variable("@a", "a"),
      variable("@b", "b"),
      obj("@n", "Node", { next: ref }),
      obj("@m", "Node", { next: ref }),
    ],
    [edge("@a", "", "@n"), edge("@b", "", "@m")],
  );

  test("two equal objects are not the one object the solution shares", () => {
    const result = checkAgainst(shared, separate);

    expect(result.correct).toBe(false);
    expect(result.diffs).toMatchObject([{ kind: "sameAs", path: "b", other: "a" }]);
  });

  test("one shared object is not the two the solution keeps apart", () => {
    const result = checkAgainst(separate, shared);

    expect(result.correct).toBe(false);
    expect(result.diffs).toMatchObject([
      { kind: "distinctFrom", path: "b", other: "a" },
    ]);
  });

  test("a cycle is compared without going round for ever", () => {
    const cycle = (v: string, n: string) =>
      step(
        [variable(v, "head"), obj(n, "Node", { next: ref })],
        [edge(v, "", n), edge(n, "next", n)],
      );

    expect(checkAgainst(cycle("@v", "@a"), cycle("@w", "@z")).correct).toBe(true);
  });

  test("Strings are compared by their characters unless asked otherwise", () => {
    const person = (id: string) => obj(id, "Person", { name: { dataType: "String" } });
    const oneString = step(
      [variable("@p", "p"), variable("@q", "q"), person("@x"), person("@y"), str("@s", "Ada")],
      [edge("@p", "", "@x"), edge("@q", "", "@y"), edge("@x", "name", "@s"), edge("@y", "name", "@s")],
    );
    const twoStrings = step(
      [
        variable("@p", "p"),
        variable("@q", "q"),
        person("@x"),
        person("@y"),
        str("@s", "Ada"),
        str("@t", "Ada"),
      ],
      [edge("@p", "", "@x"), edge("@q", "", "@y"), edge("@x", "name", "@s"), edge("@y", "name", "@t")],
    );

    expect(checkAgainst(oneString, twoStrings).correct).toBe(true);
    expect(
      checkAgainst(oneString, twoStrings, { stringIdentity: true }).diffs,
    ).toMatchObject([{ kind: "sameAs", path: "q.name", other: "p.name" }]);
  });
});

describe("checkAgainst: options", () => {
  const solution = step(
    [variable("@v", "head"), obj("@a", "Node", { next: ref })],
    [edge("@v", "", "@a")],
  );
  const withTemp = step(
    [variable("@v", "head"), variable("@t", "tmp"), obj("@a", "Node", { next: ref })],
    [edge("@v", "", "@a"), edge("@t", "", "@a")],
  );

  test("a temporary variable is allowed by default", () => {
    expect(checkAgainst(solution, withTemp).correct).toBe(true);
  });

  test("an exercise can forbid roots the solution does not have", () => {
    const result = checkAgainst(solution, withTemp, { extraRoots: "forbid" });

    expect(result.correct).toBe(false);
    expect(result.diffs).toMatchObject([{ kind: "extra", path: "tmp" }]);
  });

  test("the options are read from the solution step", () => {
    const strict = { ...solution, check: { extraRoots: "forbid" as const } };

    expect(checkAgainst(strict, withTemp).correct).toBe(false);
  });

  test("an ignored root is not checked", () => {
    const wrongHead = step([variable("@v", "head")], []);

    expect(checkAgainst(solution, wrongHead, { ignoreRoots: ["head"] }).correct).toBe(
      true,
    );
  });

  test("a primitive left at its default matches one written as the default", () => {
    const counter = (value?: number) =>
      step(
        [variable("@v", "c"), obj("@a", "Counter", { count: { dataType: "int", value } })],
        [edge("@v", "", "@a")],
      );

    expect(checkAgainst(counter(0), counter(undefined)).correct).toBe(true);
    expect(checkAgainst(counter(1), counter(0)).diffs).toMatchObject([
      { kind: "value", path: "c.count", expected: "1", found: "0" },
    ]);
  });
});

describe("checkAgainst: the call stack", () => {
  const frame = (id: string, name: string, index: number, locals = {}) =>
    ({
      id,
      type: "method-call",
      position: { x: 0, y: 0 },
      data: { name, index, localVariables: locals, position: { x: 0, y: 0 } },
    }) as unknown as CustomNodeType;

  test("a frame left on the stack is wrong", () => {
    const solution = step([frame("1", "App.main", 0)]);
    const attempt = step([frame("1", "App.main", 0), frame("2", "List.add", 1)]);

    const result = checkAgainst(solution, attempt);

    expect(result.correct).toBe(false);
    expect(result.stack).toEqual({
      expected: ["App.main"],
      found: ["App.main", "List.add"],
    });
  });

  test("frames are matched by their place on the stack, not their address", () => {
    const solution = step(
      [frame("1", "App.main", 0, { n: ref }), obj("@a", "Node", { next: ref })],
      [edge("1", "n", "@a")],
    );
    const attempt = step(
      [frame("7", "App.main", 3, { n: ref }), obj("@b", "Node", { next: ref })],
      [edge("7", "n", "@b")],
    );

    expect(checkAgainst(solution, attempt).correct).toBe(true);
  });

  test("a temporary local in a frame is allowed", () => {
    const solution = step([frame("1", "App.main", 0, { n: ref })]);
    const attempt = step([frame("1", "App.main", 0, { n: ref, tmp: ref })]);

    const result = checkAgainst(solution, attempt);

    expect(result.correct).toBe(true);
    expect(result.extra).toEqual(["0:App.main.tmp"]);
  });
});

