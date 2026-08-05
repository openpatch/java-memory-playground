import { describe, expect, test } from "vitest";
import { getEdgesAndNodes, getMemory } from "./getEdgesAndNodes";
import { Memory, initialMemory } from "./memory";

const roundTrip = (memory: Memory) => {
  const { nodes, edges } = getEdgesAndNodes(memory);
  return getMemory(edges, nodes);
};

describe("getEdgesAndNodes", () => {
  test("builds a node per object, variable and method call", () => {
    const { nodes } = getEdgesAndNodes(initialMemory);

    const byType = nodes.reduce<Record<string, number>>((acc, n) => {
      acc[n.type!] = (acc[n.type!] ?? 0) + 1;
      return acc;
    }, {});

    expect(byType.object).toBe(Object.keys(initialMemory.objects!).length);
    expect(byType["method-call"]).toBe(
      Object.keys(initialMemory.methodCalls!).length,
    );
  });

  test("draws an edge for every reference that is set", () => {
    const { edges } = getEdgesAndNodes(initialMemory);

    // @33.next, @44.next and @44.content are null and get no edge. @55's two
    // String attributes do get one: a String is a reference, it is only drawn
    // collapsed.
    expect(edges.map((e) => `${e.source}:${e.sourceHandle}`).sort()).toEqual([
      "1:myList",
      "@11:current",
      "@11:first",
      "@33:content",
      "@55:username",
      "@55:text",
    ].sort());
  });

  test("does not draw edges for primitive attributes", () => {
    const { edges } = getEdgesAndNodes(initialMemory);

    // isRead is a boolean, so it stays inside the object.
    expect(
      edges.filter((e) => e.source === "@55" && e.sourceHandle === "isRead"),
    ).toHaveLength(0);
  });

  test("tolerates a diagram saved without every section", () => {
    // Links shared by the earliest versions carry no `methodCalls` key at all.
    const partial = {
      options: {},
      viewport: { x: 0, y: 0, zoom: 1 },
      klasses: { Node: { attributes: { next: "Node" } } },
      objects: {
        "@aa": {
          klass: "Node",
          attributes: { next: { dataType: "Node" } },
          position: { x: 0, y: 0 },
        },
      },
      variables: {},
    } as unknown as Memory;

    expect(() => getEdgesAndNodes(partial)).not.toThrow();
    expect(getEdgesAndNodes(partial).nodes).toHaveLength(1);
  });
});

describe("getMemory", () => {
  test("round-trips the default diagram", () => {
    const result = roundTrip(initialMemory);

    expect(result.objects).toEqual(initialMemory.objects);
    expect(result.variables).toEqual(initialMemory.variables);
    // Method calls come back keyed by their stack index rather than by the key
    // they were written under, so compare the entries themselves.
    expect(Object.values(result.methodCalls!)).toEqual(
      Object.values(initialMemory.methodCalls!),
    );
  });

  test("round-trips a diagram with global variables", () => {
    const memory: Memory = {
      viewport: { x: 0, y: 0, zoom: 1 },
      options: {},
      klasses: { Node: { attributes: { next: "Node" } } },
      objects: {
        "@aa": {
          klass: "Node",
          attributes: { next: { dataType: "Node", value: "@bb" } },
          position: { x: 10, y: 20 },
        },
        "@bb": {
          klass: "Node",
          attributes: { next: { dataType: "Node", value: undefined } },
          position: { x: 30, y: 40 },
        },
      },
      variables: {
        "@v1": {
          name: "head",
          dataType: "Node",
          value: "@aa",
          position: { x: 0, y: 0 },
        },
      },
      methodCalls: {},
    };

    const result = roundTrip(memory);

    expect(result.variables!["@v1"].value).toBe("@aa");
    expect(result.objects!["@aa"].attributes.next.value).toBe("@bb");
    // A reference that points nowhere stays empty rather than dangling.
    expect(result.objects!["@bb"].attributes.next.value).toBeUndefined();
  });

  test("keeps positions, which is what makes the URL a shareable diagram", () => {
    const result = roundTrip(initialMemory);

    expect(result.objects!["@55"].position).toEqual(
      initialMemory.objects!["@55"].position,
    );
  });

  test("a variable with no outgoing edge serializes as null", () => {
    const memory: Memory = {
      viewport: { x: 0, y: 0, zoom: 1 },
      options: {},
      klasses: {},
      objects: {},
      variables: {
        "@v1": {
          name: "dangling",
          dataType: "Node",
          value: null,
          position: { x: 0, y: 0 },
        },
      },
      methodCalls: {},
    };

    expect(roundTrip(memory).variables!["@v1"].value).toBeNull();
  });

  test("method calls are keyed by their stack index", () => {
    const memory: Memory = {
      viewport: { x: 0, y: 0, zoom: 1 },
      options: {},
      klasses: {},
      objects: {},
      variables: {},
      methodCalls: {
        7: {
          name: "App.main",
          index: 3,
          localVariables: {},
          position: { x: 0, y: 0 },
        },
      },
    };

    // The node id is the original key, but serialization re-keys by index.
    expect(Object.keys(roundTrip(memory).methodCalls!)).toEqual(["3"]);
  });
});
