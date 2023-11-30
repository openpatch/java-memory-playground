import { Edge, Node } from "reactflow";
import { Memory, Obj, Variable, primitveDataTypes } from "./memory";

export type EdgeData = {};

export const getEdgesAndNodes = (
  memory: Memory,
): {
  edges: Edge<EdgeData>[];
  nodes: Node<Obj | Variable>[];
} => {
  const nodes: Node<Obj | Variable>[] = [];
  const edges: Edge<EdgeData>[] = [];

  Object.entries(memory.variables).forEach(([id, data]) => {
    nodes.push({
      id,
      type: "variable",
      data,
      position: data.position,
    });

    if (data.value?.startsWith("@")) {
      edges.push({
        id: `${id}+${data.value}`,
        source: id,
        target: data.value,
      });
    }
  });

  Object.entries(memory.objects).forEach(([id, data]) => {
    nodes.push({
      id,
      type: "object",
      data,
      position: data.position,
    });

    Object.entries(data.attributes).forEach(([name, value]) => {
      if (!primitveDataTypes.includes(value.dataType)) {
        edges.push({
          id: `${id}+${name}`,
          source: id,
          sourceHandle: name,
          target: value.value as string,
        });
      }
    });
  });

  return {
    edges,
    nodes,
  };
};

export const getMemory = (
  edges: Edge<EdgeData>[],
  nodes: Node<Obj | Variable>[],
): Partial<Memory> => {
  const variables: Memory["variables"] = {};
  const objects: Memory["objects"] = {};
  nodes.forEach((n) => {
    if (n.type == "object") {
      const obj: Obj = {
        ...(n.data as Obj),
        position: n.position,
      };
      Object.entries(obj.attributes).forEach(([name, value]) => {
        if (!primitveDataTypes.includes(value.dataType)) {
          const e = edges.find(
            (e) => e.source == n.id && e.sourceHandle == name,
          );
          if (e?.target) {
            obj.attributes[name] = {
              ...value,
              value: e.target,
            };
          }
        }
      });
      objects[n.id] = obj;
    } else if (n.type == "variable") {
      const variable: Variable = {
        ...(n.data as Variable),
        position: n.position,
      };
      const e = edges.find((e) => e.source == n.id);
      variable.value = e?.target || null;
      variables[n.id] = variable;
    }
  });
  return { variables, objects };
};
