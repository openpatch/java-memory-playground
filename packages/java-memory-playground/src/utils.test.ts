import { describe, expect, test } from "vitest";
import { Edge, Node } from "@xyflow/react";
import {
  isConnectedTo,
  isConnectedToMethodCall,
  isConnectedToVariable,
} from "./utils";

const node = (id: string, type: string): Node =>
  ({ id, type, data: {}, position: { x: 0, y: 0 } }) as Node;

const edge = (source: string, target: string): Edge =>
  ({ id: `${source}->${target}`, source, target }) as Edge;

describe("reachability", () => {
  test("follows a chain of references back to a variable", () => {
    const nodes = [node("@v", "variable"), node("@a", "object"), node("@b", "object")];
    const edges = [edge("@v", "@a"), edge("@a", "@b")];

    expect(isConnectedToVariable("@b", nodes, edges)).toBe(true);
  });

  test("an object nothing points at is unreachable", () => {
    const nodes = [node("@v", "variable"), node("@a", "object"), node("@junk", "object")];
    const edges = [edge("@v", "@a")];

    expect(isConnectedToVariable("@junk", nodes, edges)).toBe(false);
  });

  test("a cycle between two objects terminates", () => {
    // Two objects holding each other, reachable from nothing. Walking this
    // without remembering where it had been overflowed the stack, which took
    // the whole playground down — a circular list did it too.
    const nodes = [node("@v", "variable"), node("@x", "object"), node("@y", "object")];
    const edges = [edge("@x", "@y"), edge("@y", "@x")];

    expect(isConnectedToVariable("@x", nodes, edges)).toBe(false);
    expect(isConnectedToMethodCall("@x", nodes, edges)).toBe(false);
  });

  test("a cycle that a variable does reach stays reachable", () => {
    const nodes = [node("@v", "variable"), node("@x", "object"), node("@y", "object")];
    const edges = [edge("@v", "@x"), edge("@x", "@y"), edge("@y", "@x")];

    expect(isConnectedToVariable("@y", nodes, edges)).toBe(true);
  });

  test("a circular list is reachable from its head", () => {
    const nodes = [
      node("@v", "variable"),
      node("@1", "object"),
      node("@2", "object"),
      node("@3", "object"),
    ];
    const edges = [
      edge("@v", "@1"),
      edge("@1", "@2"),
      edge("@2", "@3"),
      edge("@3", "@1"),
    ];

    expect(isConnectedToVariable("@3", nodes, edges)).toBe(true);
  });

  test("a frame reaches what its locals point at", () => {
    const nodes = [node("1", "method-call"), node("@a", "object")];
    const edges = [edge("1", "@a")];

    expect(isConnectedToMethodCall("@a", nodes, edges)).toBe(true);
    expect(isConnectedToVariable("@a", nodes, edges)).toBe(false);
  });

  test("isConnectedTo finds a specific ancestor through a cycle", () => {
    const nodes = [node("1", "method-call"), node("@x", "object"), node("@y", "object")];
    const edges = [edge("1", "@x"), edge("@x", "@y"), edge("@y", "@x")];

    expect(isConnectedTo("@y", "1", nodes, edges)).toBe(true);
    expect(isConnectedTo("@y", "nope", nodes, edges)).toBe(false);
  });
});
