import {
  Handle,
  NodeProps,
  Position,
} from "reactflow";
import { Variable } from "./memory";

function VariableNode({ id, data }: NodeProps<Variable>) {
  return (
    <div id={id} className="variable-node">
      <div className="variable-node__name">{data.name} =</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default VariableNode;
