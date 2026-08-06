import { describe, expect, test } from "vitest";

import { hasImpact, klassImpact } from "./klassImpact";
import { CustomEdgeType, CustomNodeType } from "./types";

const object = (
  id: string,
  klass: string,
  attributes: Record<string, { dataType: string; value?: unknown }>,
): CustomNodeType =>
  ({
    id,
    type: "object",
    position: { x: 0, y: 0 },
    data: { klass, attributes, position: { x: 0, y: 0 } },
  }) as unknown as CustomNodeType;

const step = (nodes: CustomNodeType[], edges: CustomEdgeType[] = []) => ({
  nodes,
  edges,
});

describe("klassImpact", () => {
  test("adding a field costs nothing", () => {
    const impact = klassImpact(
      [step([object("1", "Node", { value: { dataType: "int", value: 3 } })])],
      { Node: { attributes: { value: "int", next: "Node" } } },
    );

    expect(hasImpact(impact)).toBe(false);
  });

  test("removing a field that holds a value reports it", () => {
    const impact = klassImpact(
      [step([object("1", "Node", { value: { dataType: "int", value: 3 } })])],
      { Node: { attributes: {} } },
    );

    expect(impact.dropped).toEqual([{ klass: "Node", field: "value", count: 1 }]);
  });

  test("an empty field takes nothing with it", () => {
    const impact = klassImpact(
      [step([object("1", "Node", { next: { dataType: "Node" } })])],
      { Node: { attributes: {} } },
    );

    expect(hasImpact(impact)).toBe(false);
  });

  test("a field holding a reference is reported even with no value", () => {
    const impact = klassImpact(
      [
        step(
          [object("1", "Node", { next: { dataType: "Node" } })],
          [{ id: "e", source: "1", sourceHandle: "next", target: "2" }],
        ),
      ],
      { Node: { attributes: {} } },
    );

    expect(impact.dropped).toEqual([{ klass: "Node", field: "next", count: 1 }]);
  });

  test("an object whose class is gone is orphaned", () => {
    const impact = klassImpact(
      [step([object("1", "Message", { text: { dataType: "String", value: "hi" } })])],
      { Node: { attributes: {} } },
    );

    expect(impact.orphaned).toEqual([{ klass: "Message", count: 1 }]);
    // Its fields are not also reported: the object keeps them.
    expect(impact.dropped).toEqual([]);
  });

  test("the same object in several steps counts once", () => {
    const node = object("1", "Node", { value: { dataType: "int", value: 3 } });
    const impact = klassImpact([step([node]), step([node]), step([node])], {
      Node: { attributes: {} },
    });

    expect(impact.dropped).toEqual([{ klass: "Node", field: "value", count: 1 }]);
  });

  test("different objects of the same class are counted separately", () => {
    const impact = klassImpact(
      [
        step([
          object("1", "Node", { value: { dataType: "int", value: 1 } }),
          object("2", "Node", { value: { dataType: "int", value: 2 } }),
        ]),
      ],
      { Node: { attributes: {} } },
    );

    expect(impact.dropped).toEqual([{ klass: "Node", field: "value", count: 2 }]);
  });

  test("Strings and Arrays are never orphaned", () => {
    const impact = klassImpact(
      [
        step([
          object("1", "String", { value: { dataType: "String", value: "hi" } }),
          object("2", "Array", { "[0]": { dataType: "int", value: 0 } }),
        ]),
      ],
      {},
    );

    expect(hasImpact(impact)).toBe(false);
  });

  test("an empty diagram costs nothing", () => {
    expect(hasImpact(klassImpact([], { Node: { attributes: {} } }))).toBe(false);
  });

  test("variables and frames are not objects", () => {
    const impact = klassImpact(
      [
        step([
          {
            id: "v",
            type: "variable",
            position: { x: 0, y: 0 },
            data: { name: "a", position: { x: 0, y: 0 } },
          } as unknown as CustomNodeType,
        ]),
      ],
      {},
    );

    expect(hasImpact(impact)).toBe(false);
  });

  test("reports in a stable order", () => {
    const impact = klassImpact(
      [
        step([
          object("1", "Zebra", { b: { dataType: "int", value: 1 } }),
          object("2", "Alpha", { z: { dataType: "int", value: 1 } }),
          object("3", "Alpha", { a: { dataType: "int", value: 1 } }),
        ]),
      ],
      { Alpha: { attributes: {} }, Zebra: { attributes: {} } },
    );

    expect(impact.dropped.map((d) => `${d.klass}.${d.field}`)).toEqual([
      "Alpha.a",
      "Alpha.z",
      "Zebra.b",
    ]);
  });
});
