import { ChangeEventHandler } from "react";
import {
  Handle,
  NodeProps,
  Node,
  Position,
  useEdges,
  useNodes,
  useReactFlow,
} from "@xyflow/react";
import { Attribute, Obj, numericDataTypes, primitveDataTypes } from "./memory";
import { isConnectedToMethodCall, isConnectedToVariable } from "./utils";
import { CustomEdgeType, CustomNodeType } from "./types";
import useStore from "./storeContext";
import { RFState } from "./store";
import { useShallow } from "zustand/shallow";

function AttributeHandle({
  name,
  value,
  isFinal,
  isConnectable,
  nodeId,
}: {
  name: string;
  value: Attribute;
  nodeId: string;
  isFinal: boolean;
  isConnected: boolean;
  isConnectable: boolean;
}) {
  const { setNodes } = useReactFlow<CustomNodeType, CustomEdgeType>();

  const onChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    let value: any = e.target.value;
    if (e.target.type === "checkbox") {
      value = e.target.checked;
    }
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id == nodeId && n.type === "object") {
          return {
            ...n,
            data: {
              ...n.data,
              attributes: {
                ...n.data.attributes,
                [name]: {
                  ...n.data.attributes[name],
                  value,
                },
              },
            },
          };
        }
        return n;
      })
    );
  };

  return !primitveDataTypes.includes(value.dataType) ? (
    <div className="object-node__attribute">
      <div className="object-node__attribute-name">{name} =</div>
      <Handle
        type="source"
        isConnectable={isConnectable}
        position={Position.Right}
        id={name}
      />
    </div>
  ) : (
    <div className="object-node__attribute">
      <div className="object-node__attribute-name">{name} =</div>
      {isFinal ? (
        <span className="object-node__attribute-value">{value.value}</span>
      ) : (
        <>
          {value.dataType === "boolean" && (
            <input
              type="checkbox"
              onChange={onChange}
              checked={Boolean(value.value)}
              className="object-node__attribute-value"
            />
          )}
          {numericDataTypes.includes(value.dataType) && (
            <input
              onChange={onChange}
              type="number"
              value={(value.value as number) || 0}
              className="object-node__attribute-value"
            />
          )}
          {value.dataType == "String" && (
            <input
              type="text"
              onChange={onChange}
              value={(value.value as string) || ""}
              className="object-node__attribute-value"
            />
          )}
        </>
      )}
    </div>
  );
}

export type ObjectNodeType = Node<Obj, "object">;

export function isObjectNode(node: CustomNodeType): node is ObjectNodeType {
  return node.type === "object";
}

const selector = (state: RFState) => ({
  ...state.options,
});

function ObjectNode({ id, data }: NodeProps<ObjectNodeType>) {
  const { disableGarbageCollector } = useStore(useShallow(selector));
  const nodes = useNodes();
  const edges = useEdges();
  const gc = !disableGarbageCollector &&
    !isConnectedToVariable(id, nodes, edges) &&
    !isConnectedToMethodCall(id, nodes, edges);

  const attributeEdges = edges.filter((e) => e.source == id);
  
  // For arrays, display the element type in the header
  const displayName = data.klass === "Array" && data.arrayElementType
    ? `:${data.arrayElementType}[]`
    : `:${data.klass}`;
  
  return (
    <>
      <div className={`object-node__header ${gc ? "gc" : ""}`}>
        <Handle
          type="target"
          isConnectable={!gc}
          isConnectableStart={false}
          position={Position.Left}
        />
        <div className="object-node__name">{displayName}</div>
        <div className="spacer-10"></div>
      </div>
      <div className={`object-node__body ${gc ? "gc" : ""}`}>
        {Object.entries(data.attributes).map(([name, value]) => (
          <AttributeHandle
            key={`${id}+${name}`}
            isFinal={false}
            isConnected={
              attributeEdges.find((e) => e.sourceHandle == name)?.target != null
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
