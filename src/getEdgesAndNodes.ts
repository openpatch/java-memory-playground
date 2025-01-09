import { Memory, MethodCall, Obj, Variable, primitveDataTypes } from "./memory";
import { CustomEdgeType, CustomNodeType } from "./types";

export type EdgeData = {};

export const getEdgesAndNodes = (
  memory: Memory,
): {
  edges: CustomEdgeType[];
  nodes: CustomNodeType[];
} => {
  const nodes: CustomNodeType[] = [];
  const edges: CustomEdgeType[] = [];

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

  Object.entries(memory.methodCalls).forEach(([id, data]) => {
    nodes.push({
      id,
      type: "method-call",
      data,
      position: data.position,
    });

    const methodCallData = data as MethodCall;

    Object.entries(methodCallData.localVariables).forEach(([name, value]) => {
      if (!primitveDataTypes.includes(value.dataType) && value.value != null) {
        edges.push({
          id: `method-call-${id}+${name}`,
          type: "reference",
          source: id,
          sourceHandle: name,
          target: value.value as string,
        });
      }
    });
  });

  Object.entries(memory.objects).forEach(([id, data]) => {
    nodes.push({
      id,
      type: "object",
      data,
      position: data.position,
    });

    Object.entries(data.attributes).forEach(([name, value]) => {
      if (!primitveDataTypes.includes(value.dataType) && value.value != null) {
        edges.push({
          id: `${id}+${name}`,
          source: id,
          type: "reference",
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
  edges: CustomEdgeType[],
  nodes: CustomNodeType[],
): Partial<Memory> => {
  const variables: Memory["variables"] = {};
  const objects: Memory["objects"] = {};
  const methodCalls: Memory["methodCalls"] = {};

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
          obj.attributes[name] = {
            dataType: value.dataType,
            value: e?.target,
          };
        }
      });
      objects[n.id] = obj;
    } else if (n.type == "method-call") {
      const methodCall: MethodCall = {
        ...(n.data as MethodCall),
        position: n.position,
      };
      Object.entries(methodCall.localVariables).forEach(([name, value]) => {
        if (!primitveDataTypes.includes(value.dataType)) {
          const e = edges.find(
            (e) => e.source == n.id && e.sourceHandle == name,
          );
          methodCall.localVariables[name] = {
            dataType: value.dataType,
            value: e?.target,
          };
        }
      });
      methodCalls[methodCall.index] = methodCall;
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
  return { variables, objects, methodCalls };
};
