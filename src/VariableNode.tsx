import { Handle, NodeProps, Position, getOutgoers, useEdges, useNodes } from "reactflow";
import { Variable } from "./memory";

function VariableNode({ id, data }: NodeProps<Variable>) {
  const nodes = useNodes();
  const edges = useEdges();
  const outgoers = getOutgoers({id, position:{x:0,y:0}, data: {}}, nodes, edges);
  return (
    <div id={id} className="variable-node">
      <div className="variable-node__name">{data.name} =</div>
      <Handle type="source" isConnectable={outgoers.length == 0} position={Position.Right} />
    </div>
  );
}

export default VariableNode;
