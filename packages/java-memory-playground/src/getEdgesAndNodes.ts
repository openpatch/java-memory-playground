import { MethodCall, Obj, Step, Variable, primitveDataTypes } from "./memory";
import { CustomEdgeType, CustomNodeType } from "./types";

export type EdgeData = {};

/** Builds the React Flow graph for one step of a diagram. */
export const getEdgesAndNodes = (
  memory: Partial<Step>,
): {
  edges: CustomEdgeType[];
  nodes: CustomNodeType[];
} => {
  const nodes: CustomNodeType[] = [];
  const edges: CustomEdgeType[] = [];

  // Diagrams saved by older versions can be missing whole sections — the very
  // first ones had no `methodCalls` at all — and a shared link must still open.
  const variables = memory.variables ?? {};
  const methodCalls = memory.methodCalls ?? {};
  const objects = memory.objects ?? {};

  Object.entries(variables).forEach(([id, data]) => {
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

  Object.entries(methodCalls).forEach(([id, data]) => {
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

  Object.entries(objects).forEach(([id, data]) => {
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

/** Serializes a React Flow graph back into one step of a diagram. */
export const getMemory = (
  edges: CustomEdgeType[],
  nodes: CustomNodeType[],
): Step => {
  const variables: Step["variables"] = {};
  const objects: Step["objects"] = {};
  const methodCalls: Step["methodCalls"] = {};

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
