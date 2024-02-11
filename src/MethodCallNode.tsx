import { ChangeEventHandler } from "react";
import { Handle, NodeProps, Position, useEdges, useReactFlow } from "reactflow";
import {
  Attribute,
  MethodCall,
  numericDataTypes,
  primitveDataTypes,
} from "./memory";

function LocalVariableHandle({
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
  const { setNodes } = useReactFlow();

  const onChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    let value: any = e.target.value;
    if (e.target.type === "checkbox") {
      value = e.target.checked;
    }
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id == nodeId) {
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
      }),
    );
  };

  const onDelete = () => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id == nodeId) {
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
      }),
    );
  }

  return !primitveDataTypes.includes(value.dataType) ? (
    <div className="method-call-node__variable">
      <button onClick={onDelete} className="method-call-node__delete">X</button>
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
          {value.dataType == "String" && (
            <input
              type="text"
              onChange={onChange}
              value={(value.value as string) || ""}
              className="method-call-node__variable-value"
            />
          )}
        </>
      )}
    </div>
  );
}

function MethodCallNode({ id, data }: NodeProps<MethodCall>) {
  const { setNodes } = useReactFlow();
  const edges = useEdges();

  const localVariablesEdges = edges.filter((e) => e.source == id);

  const handleDeclareLocaleVariable = () => {
    const name = window.prompt("Name for the new local variable?");
    if (name != null) {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id == id) {
            return {
              ...n,
              data: {
                ...n.data,
                localVariables: {
                  ...n.data.localVariables,
                  [name]: {
                    value: null,
                  },
                },
              },
            };
          }
          return n;
        }),
      );
    }
  };

  return (
    <>
      <div className={`method-call-node__header`}>
        <div className="method-call-node__name">{data.index}: {data.name}()</div>
        <div className="spacer-10"></div>
      </div>
      <div className={`method-call-node__body`}>
        {Object.entries(data.localVariables).map(([name, value]) => (
          <LocalVariableHandle
            key={`${id}+${name}`}
            isFinal={false}
            isConnectable={true}
            isConnected={
              localVariablesEdges.find((e) => e.sourceHandle == name)?.target != null
            }
            nodeId={id}
            name={name}
            value={value}
          />
        ))}

        <button onClick={handleDeclareLocaleVariable}>
          Declare Local Variable
        </button>
      </div>
    </>
  );
}

export default MethodCallNode;
