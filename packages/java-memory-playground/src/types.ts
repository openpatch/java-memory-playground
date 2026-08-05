import type { BuiltInEdge } from "@xyflow/react";
import { ObjectNodeType } from "./ObjectNode";
import { VariableNode } from "./VariableNode";
import { MethodCallNodeType } from "./MethodCallNode";
import { ReferenceEdge } from "./ReferenceEdge";

// Only the three node types registered in `nodeTypes` can occur. Including
// React Flow's BuiltInNode here widened the union to nodes that require a
// `data.label`, which made every setNodes call fail to type check.
export type CustomNodeType = ObjectNodeType | VariableNode | MethodCallNodeType;
export type CustomEdgeType = BuiltInEdge | ReferenceEdge;
