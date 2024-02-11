import { Node, Edge, getIncomers } from "reactflow";

export const isConnectedToVariable = (
  nodeId: string,
  nodes: Node[],
  edges: Edge[],
): boolean => {
  const incomers = getIncomers(
    { id: nodeId, data: {}, position: { x: 0, y: 0 } },
    nodes,
    edges,
  ).filter((n) => n.id !== nodeId);

  for (let incomer of incomers) {
    if (incomer.type === "variable") {
      return true;
    }
    if (isConnectedToVariable(incomer.id, nodes, edges)) {
      return true;
    }
  }

  return false;
};

export const isConnectedToMethodCall = (
  nodeId: string,
  nodes: Node[],
  edges: Edge[],
): boolean => {
  const incomers = getIncomers(
    { id: nodeId, data: {}, position: { x: 0, y: 0 } },
    nodes,
    edges,
  ).filter((n) => n.id !== nodeId);

  for (let incomer of incomers) {
    if (incomer.type === "method-call") {
      return true;
    }
    if (isConnectedToMethodCall(incomer.id, nodes, edges)) {
      return true;
    }
  }

  return false;
};

export const isConnectedTo = (
  nodeId: string,
  conntectedId: string,
  nodes: Node[],
  edges: Edge[],
): boolean => {

  const incomers = getIncomers(
    { id: nodeId, data: {}, position: { x: 0, y: 0 } },
    nodes,
    edges,
  ).filter((n) => n.id !== nodeId);

  for (let incomer of incomers) {
    if (incomer.id == conntectedId) {
      return true;
    }
    if (isConnectedTo(incomer.id, conntectedId, nodes, edges)) {
      return true;
    }
  }

  return false;
};
