import type { BuiltInNode, BuiltInEdge } from "@xyflow/react";
import { ObjectNodeType } from "./ObjectNode";
import { VariableNode } from "./VariableNode";
import { MethodCallNodeType } from "./MethodCallNode";
import { ReferenceEdge } from "./ReferenceEdge";

export type CustomNodeType = BuiltInNode | ObjectNodeType | VariableNode | MethodCallNodeType;
export type CustomEdgeType = BuiltInEdge | ReferenceEdge;
