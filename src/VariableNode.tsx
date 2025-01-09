import {
  Handle,
  Node,
  NodeProps,
  Position,
} from "@xyflow/react";
import { Variable } from "./memory";

export type VariableNode = Node<Variable, "variable">

function VariableNode({ id, data }: NodeProps<VariableNode>) {
  return (
    <div id={id} className="variable-node">
      <div className="variable-node__name">{data.name} =</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default VariableNode;
