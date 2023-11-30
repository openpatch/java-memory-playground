import {
  Handle,
  NodeProps,
  Position,
  useEdges,
  useNodes,
} from "reactflow";
import { Obj } from "./memory";
import { isConnectedToVariable } from "./utils";

function Attribute({
  name,
  value,
  isConnected,
  isConnectable,
}: {
  name: string;
  value: string | number | boolean | null;
  nodeId: string;
  isConnected: boolean;
  isConnectable: boolean;
}) {
  return (typeof value == "string" && value?.startsWith("@")) ||
    value == null ? (
    <div className="object-node__attribute">
      <div className="object-node__attribute-name">{name} =</div>
      <Handle
        type="source"
        isConnectable={!isConnected && isConnectable}
        position={Position.Right}
        id={name}
      />
    </div>
  ) : (
    <div className="object-node__attribute">
      <div className="object-node__attribute-name">
        {name} = {value}
      </div>
    </div>
  );
}


function ObjectNode({ id, data }: NodeProps<Obj>) {
  const nodes = useNodes();
  const edges = useEdges();
  const gc = !isConnectedToVariable(id, nodes, edges);

  const attributeEdges = edges.filter((e) => e.source == id);
  return (
    <>
      <div className={`object-node__header ${gc ? "gc" : ""}`}>
        <Handle
          type="target"
          isConnectable={!gc}
          isConnectableStart={false}
          position={Position.Left}
        />
        <div className="object-node__name">:{data.klass}</div>
        <div className="spacer-10"></div>
      </div>
      <div className={`object-node__body ${gc ? "gc" : ""}`}>
        {Object.entries(data.attributes).map(([name, value]) => (
          <Attribute
            key={`${id}+${name}`}
            isConnected={
              attributeEdges.find((e) => e.sourceHandle == name) != null
            }
            isConnectable={!gc}
            nodeId={id}
            name={name}
            value={value}
          />
        ))}
      </div>
    </>
  );
}

export default ObjectNode;
