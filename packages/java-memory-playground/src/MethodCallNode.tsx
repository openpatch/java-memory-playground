import { ChangeEventHandler } from "react";
import {
  Node,
  Handle,
  NodeProps,
  Position,
  useEdges,
  useNodes,
  useReactFlow,
} from "@xyflow/react";
import {
  Attribute,
  MethodCall,
  numericDataTypes,
  primitveDataTypes,
  STRING_KLASS,
} from "./memory";
import { CustomEdgeType, CustomNodeType } from "./types";
import useStore from "./storeContext";
import { InlineString } from "./InlineString";

function LocalVariableHandle({
  name,
  value,
  isFinal,
  isConnectable,
  nodeId,
  inlineStrings,
}: {
  name: string;
  value: Attribute;
  nodeId: string;
  isFinal: boolean;
  isConnected: boolean;
  isConnectable: boolean;
  inlineStrings?: boolean;
}) {
  const { setNodes, setEdges } = useReactFlow<CustomNodeType, CustomEdgeType>();

  const onChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    let value: any = e.target.value;
    if (e.target.type === "checkbox") {
      value = e.target.checked;
    }
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id == nodeId && n.type === "method-call") {
          return {
            ...n,
            data: {
              ...n.data,
              localVariables: {
                ...n.data.localVariables,
                [name]: {
                  ...n.data.localVariables[name],
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

  const onDelete = () => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id == nodeId && n.type === "method-call") {
          delete n.data.localVariables[name];
          return {
            ...n,
            data: {
              ...n.data,
              localVariables: {
                ...n.data.localVariables,
              },
            },
          };
        }
        return n;
      })
    );
    setEdges((eds) =>
      eds.filter((e) => !(e.source == nodeId && e.sourceHandle == name))
    );
  };

  if (value.dataType === STRING_KLASS && inlineStrings) {
    return (
      <div className="method-call-node__variable">
        <div className="method-call-node__variable-name">{name} =</div>
        <InlineString nodeId={nodeId} handleId={name} readOnly={isFinal} />
      </div>
    );
  }

  return !primitveDataTypes.includes(value.dataType) ? (
    <div className="method-call-node__variable">
      <button onClick={onDelete} className="method-call-node__delete">
        X
      </button>
      <div className="method-call-node__variable-name">{name} =</div>
      <Handle
        type="source"
        isConnectable={isConnectable}
        position={Position.Right}
        id={name}
      />
    </div>
  ) : (
    <div className="method-call-node__variable">
      <div className="method-call-node__variable-name">{name} =</div>
      {isFinal ? (
        <span className="method-call-node__variable-value">{value.value}</span>
      ) : (
        <>
          {value.dataType === "boolean" && (
            <input
              type="checkbox"
              onChange={onChange}
              checked={Boolean(value.value)}
              className="method-call-node__variable-value"
            />
          )}
          {numericDataTypes.includes(value.dataType) && (
            <input
              onChange={onChange}
              type="number"
              value={(value.value as number) || 0}
              className="method-call-node__variable-value"
            />
          )}
        </>
      )}
    </div>
  );
}

export type MethodCallNodeType = Node<MethodCall, "method-call">;

export function isMethodCallNode(node: Node): node is MethodCallNodeType {
  return node.type === "method-call";
}

function MethodCallNode({ 
  id, 
  data,
  onDeclareVariable,
}: NodeProps<MethodCallNodeType> & { onDeclareVariable?: (nodeId: string) => void }) {
  const { setNodes, setEdges } = useReactFlow<CustomNodeType, CustomEdgeType>();
  const edges = useEdges<CustomEdgeType>();
  const nodes = useNodes<CustomNodeType>();
  const t = useStore((state) => state.getTranslations());
  const inlineStrings = useStore((state) => state.options.inlineStrings);

  const localVariablesEdges = edges.filter((e) => e.source == id);

  // Only the frame on top of the stack can return. Popping one from the middle
  // is the one thing a stack cannot do, so the button says so rather than
  // disappearing — that a call has to finish first is the lesson.
  const isTopOfStack = !nodes.some(
    (n) => isMethodCallNode(n) && n.data.index > data.index,
  );

  const handleReturn = () => {
    if (!isTopOfStack) return;
    setNodes((nds) => nds.filter((n) => n.id != id));
    // The references the frame held go with it; the objects they pointed at may
    // now be unreachable, which is exactly what the garbage collector shows.
    setEdges((eds) => eds.filter((e) => e.source != id));
  };

  const handleDeclareLocaleVariable = () => {
    if (onDeclareVariable) {
      onDeclareVariable(id);
    }
  };

  return (
    <>
      <div className={`method-call-node__header`}>
        <div className="method-call-node__name">
          {data.index}: {data.name}()
        </div>
        <div className="spacer-10"></div>
      </div>
      <div className={`method-call-node__body`}>
        {Object.entries(data.localVariables).map(([name, value]) => (
          <LocalVariableHandle
            key={`${id}+${name}`}
            isFinal={false}
            isConnectable={true}
            isConnected={
              localVariablesEdges.find((e) => e.sourceHandle == name)?.target !=
              null
            }
            nodeId={id}
            name={name}
            value={value}
            inlineStrings={inlineStrings}
          />
        ))}

        <div className="method-call-node__buttons">
          <button
            className="method-call-node__declare"
            onClick={handleDeclareLocaleVariable}
          >
            {t.declareLocalVariable}
          </button>
          <button
            className="method-call-node__return"
            onClick={handleReturn}
            disabled={!isTopOfStack}
            title={isTopOfStack ? undefined : t.returnOnlyTopOfStack}
          >
            {t.returnMethod}
          </button>
        </div>
      </div>
    </>
  );
}

export default MethodCallNode;
