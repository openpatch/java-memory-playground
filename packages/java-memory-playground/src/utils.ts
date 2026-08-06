import { Node, Edge, getIncomers } from "@xyflow/react";

/**
 * Whether any node matching `matches` reaches `nodeId` by following references.
 *
 * `seen` is what keeps this terminating: a diagram may contain reference
 * cycles — a circular list, or two objects holding each other — and without it
 * the walk goes round forever and takes the whole playground down with it.
 */
const isReachedFrom = (
  nodeId: string,
  nodes: Node[],
  edges: Edge[],
  matches: (node: Node) => boolean,
  seen: Set<string> = new Set(),
): boolean => {
  if (seen.has(nodeId)) return false;
  seen.add(nodeId);

  const incomers = getIncomers(
    { id: nodeId, data: {}, position: { x: 0, y: 0 } },
    nodes,
    edges,
  ).filter((n) => n.id !== nodeId);

  for (const incomer of incomers) {
    if (matches(incomer)) return true;
    if (isReachedFrom(incomer.id, nodes, edges, matches, seen)) return true;
  }

  return false;
};

export const isConnectedToVariable = (
  nodeId: string,
  nodes: Node[],
  edges: Edge[],
): boolean =>
  isReachedFrom(nodeId, nodes, edges, (n) => n.type === "variable");

export const isConnectedToMethodCall = (
  nodeId: string,
  nodes: Node[],
  edges: Edge[],
): boolean =>
  isReachedFrom(nodeId, nodes, edges, (n) => n.type === "method-call");

export const isConnectedTo = (
  nodeId: string,
  conntectedId: string,
  nodes: Node[],
  edges: Edge[],
): boolean =>
  isReachedFrom(nodeId, nodes, edges, (n) => n.id === conntectedId);

/**
 * A random hexadecimal address, optionally avoiding ids already in use.
 */
export const getRanMemoryAdress = (
  size: number,
  taken: Set<string> = new Set(),
): string => {
  const hex = "0123456789abcdef";
  let address: string;
  do {
    let result = "";
    for (let n = 0; n < size; n++) {
      result += hex[Math.floor(Math.random() * 16)];
    }
    address = `@${result}`;
  } while (taken.has(address));
  return address;
};
