import { describe, expect, test } from "vitest";
import {
  executeStatement,
  parseStatement,
  parseStatementList,
} from "./statements";
import { CustomEdgeType, CustomNodeType } from "./types";

const node = (id: string, next?: string) =>
  ({
    id,
    type: "object",
    position: { x: 0, y: 0 },
    data: {
      klass: "ListNode",
      attributes: {
        next: { dataType: "ListNode", value: next },
        content: { dataType: "String", value: undefined },
        count: { dataType: "int", value: 0 },
      },
      position: { x: 0, y: 0 },
    },
  }) as unknown as CustomNodeType;

const variable = (id: string, name: string) =>
  ({
    id,
    type: "variable",
    position: { x: 0, y: 0 },
    data: { name, dataType: "ListNode", value: null, position: { x: 0, y: 0 } },
  }) as unknown as CustomNodeType;

const frame = (id: string, locals: string[]) =>
  ({
    id,
    type: "method-call",
    position: { x: 0, y: 0 },
    data: {
      name: "append",
      index: Number(id),
      localVariables: Object.fromEntries(
        locals.map((l) => [l, { dataType: "ListNode", value: undefined }]),
      ),
      position: { x: 0, y: 0 },
    },
  }) as unknown as CustomNodeType;

const reference = (source: string, handle: string, target: string) =>
  ({
    id: `${source}+${handle}`,
    source,
    sourceHandle: handle,
    target,
    type: "reference",
  }) as CustomEdgeType;

const points = (source: string, target: string) =>
  ({ id: `${source}+${target}`, source, target }) as CustomEdgeType;

/** first -> @a -> @b -> @c, with @neu waiting beside the chain. */
const liste = () => ({
  nodes: [
    variable("@v1", "first"),
    variable("@v2", "current"),
    variable("@v3", "neu"),
    node("@a", "@b"),
    node("@b", "@c"),
    node("@c"),
    node("@neu"),
  ],
  edges: [
    points("@v1", "@a"),
    points("@v2", "@b"),
    points("@v3", "@neu"),
    reference("@a", "next", "@b"),
    reference("@b", "next", "@c"),
  ],
});

/** The chain from `first`, or "cycle" if it never ends. */
const chain = (edges: CustomEdgeType[]) => {
  const start = edges.find((e) => e.source === "@v1")?.target;
  const seen: string[] = [];
  let at = start;
  while (at) {
    if (seen.includes(at)) return "cycle";
    seen.push(at);
    at = edges.find(
      (e) => e.source === at && e.sourceHandle === "next",
    )?.target;
  }
  return seen.join(" -> ");
};

const run = (
  statements: string[],
  start = liste(),
): { edges: CustomEdgeType[]; nodes: CustomNodeType[] } => {
  let edges = start.edges;
  statements.forEach((s) => {
    const result = executeStatement(s, start.nodes, edges);
    if (!result.ok) throw new Error(`${s}: ${result.error.code}`);
    edges = result.edges;
  });
  return { edges, nodes: start.nodes };
};

describe("parseStatement", () => {
  test("splits both sides into root and attributes", () => {
    expect(parseStatement("neu.next = current.next")).toEqual({
      target: { root: "neu", attributes: ["next"] },
      source: { root: "current", attributes: ["next"] },
    });
  });

  test("reads null as a value rather than a name", () => {
    expect(parseStatement("neu.next = null")?.source).toBeNull();
  });

  test("tolerates a trailing semicolon", () => {
    expect(parseStatement("first = neu;")).toEqual({
      target: { root: "first", attributes: [] },
      source: { root: "neu", attributes: [] },
    });
  });

  test("rejects what is not an assignment", () => {
    expect(parseStatement("first.next")).toBeNull();
    expect(parseStatement("a = b = c")).toBeNull();
    expect(parseStatement("a. = b")).toBeNull();
  });
});

describe("executeStatement", () => {
  test("inserting in the right order links the new node in", () => {
    const { edges } = run([
      "neu.next = current.next",
      "current.next = neu",
    ]);
    expect(chain(edges)).toBe("@a -> @b -> @neu -> @c");
  });

  test("inserting in the wrong order makes the node point at itself", () => {
    // The point of the whole feature: `current.next` is read after it has
    // already been overwritten, so the new node ends up as its own successor.
    const { edges } = run([
      "current.next = neu",
      "neu.next = current.next",
    ]);
    expect(chain(edges)).toBe("cycle");
  });

  test("assigning null clears the reference", () => {
    const { edges } = run(["current.next = null"]);
    expect(chain(edges)).toBe("@a -> @b");
  });

  test("moving a root leaves the nodes in front of it unreachable", () => {
    const { edges } = run(["first = current"]);
    expect(chain(edges)).toBe("@b -> @c");
  });

  test("a variable keeps its single nameless edge", () => {
    const { edges } = run(["first = neu"]);
    expect(edges.filter((e) => e.source === "@v1")).toHaveLength(1);
    expect(edges.find((e) => e.source === "@v1")?.target).toBe("@neu");
    expect(edges.find((e) => e.source === "@v1")?.sourceHandle).toBeUndefined();
  });

  test("an attribute keeps its handle and one edge", () => {
    const { edges } = run(["current.next = neu"]);
    const written = edges.filter(
      (e) => e.source === "@b" && e.sourceHandle === "next",
    );
    expect(written).toHaveLength(1);
    expect(written[0].target).toBe("@neu");
    expect(written[0].type).toBe("reference");
  });

  test("walks a path of several attributes", () => {
    const { edges } = run(["first.next.next = neu"]);
    expect(chain(edges)).toBe("@a -> @b -> @neu");
  });

  test("reads through a local variable of a frame", () => {
    const start = liste();
    const nodes = start.nodes.concat(frame("0", ["tmp"]));
    const edges = start.edges.concat(reference("0", "tmp", "@neu"));
    const result = executeStatement("first = tmp", nodes, edges);
    expect(result.ok).toBe(true);
    if (result.ok) expect(chain(result.edges)).toBe("@neu");
  });

  test("writes into a local variable of a frame", () => {
    const start = liste();
    const nodes = start.nodes.concat(frame("0", ["tmp"]));
    const result = executeStatement("tmp = first", nodes, start.edges);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const written = result.edges.find(
        (e) => e.source === "0" && e.sourceHandle === "tmp",
      );
      expect(written?.target).toBe("@a");
      expect(written?.id).toBe("method-call-0+tmp");
    }
  });

  test("nothing is mutated when a line fails", () => {
    const start = liste();
    const before = JSON.stringify(start.edges);
    executeStatement("neu.next.next = first", start.nodes, start.edges);
    expect(JSON.stringify(start.edges)).toBe(before);
  });
});

describe("executeStatement reports why a line cannot run", () => {
  const cases: [string, string][] = [
    ["nowhere = first", "unknownName"],
    ["first = nowhere", "unknownName"],
    ["neu.next.next = first", "nullDereference"],
    ["first.missing = neu", "unknownAttribute"],
    ["first.count = neu", "notAReference"],
    ["first", "malformed"],
  ];

  test.each(cases)("%s -> %s", (statement, code) => {
    const start = liste();
    const result = executeStatement(statement, start.nodes, start.edges);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe(code);
  });
});

describe("parseStatementList", () => {
  test("splits on semicolons and newlines, dropping the empties", () => {
    expect(parseStatementList("a = b;  c = d\n\n e = f ; ")).toEqual([
      "a = b",
      "c = d",
      "e = f",
    ]);
  });
});
