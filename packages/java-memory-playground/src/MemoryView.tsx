import {
  ReactFlow,
  Controls,
  Background,
  Panel,
  addEdge,
  OnConnectStart,
  OnConnectEnd,
  OnConnect,
  OnConnectStartParams,
  MarkerType,
  useReactFlow,
} from "@xyflow/react";
import { toPng } from "html-to-image";
import useStore from "./storeContext";
import { useUndoRedo } from "./useUndoRedo";
import { RFState } from "./store";
import { shallow } from "zustand/shallow";
import ObjectNode, { ObjectNodeType } from "./ObjectNode";
import VariableNode from "./VariableNode";
import { useCallback, useState, useRef, useMemo } from "react";
import { Sidebar } from "./Sidebar";
import {
  Attribute,
  numericDataTypes,
  DataType,
  primitveDataTypes,
} from "./memory";
import {
  isConnectedTo,
  isConnectedToMethodCall,
  isConnectedToVariable,
} from "./utils";
import MethodCallNode, {
  isMethodCallNode,
} from "./MethodCallNode";
import ReferenceEdge from "./ReferenceEdge";
import { CustomEdgeType, CustomNodeType } from "./types";
import { ArrayCreationDialog } from "./ArrayCreationDialog";
import { SimpleInputDialog } from "./SimpleInputDialog";

const selector = (state: RFState) => ({
  selectedNodeId: state.selectedNodeId,
  klasses: state.klasses,
  options: state.options,
  setRoute: state.setRoute,
  persistence: state.persistence,
  nodes: state.nodes,
  edges: state.edges,
  setNodes: state.setNodes,
  setEdges: state.setEdges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  save: state.save,
  t: state.getTranslations(),
});

const edgeTypes = {
  reference: ReferenceEdge,
};

const createAttributesForObject = (
  attributes: Record<string, string>
): Record<string, Attribute> => {
  const objAttributes: Record<string, Attribute> = {};
  Object.entries(attributes).forEach(([name, dataType]) => {
    let value = undefined;
    if (dataType == "boolean") {
      value = false;
    } else if (numericDataTypes.includes(dataType)) {
      value = 0;
    } else if (dataType == "String") {
      value = "";
    }
    objAttributes[name] = {
      value,
      dataType,
    };
  });
  return objAttributes;
};

const getRanMemoryAdress = (size: number): string => {
  let result = [];
  let hexRef = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
  ];

  for (let n = 0; n < size; n++) {
    result.push(hexRef[Math.floor(Math.random() * 16)]);
  }
  return `@${result.join("")}`;
};

export const MemoryView = () => {
  const {
    klasses,
    options,
    setRoute,
    persistence,
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    save,
    t,
  } = useStore(selector, shallow);
  const { screenToFlowPosition } = useReactFlow();
  const connectingNode = useRef<OnConnectStartParams | null>(null);
  // Scoped to this instance so that exporting works when a page embeds more
  // than one playground.
  const flowRef = useRef<HTMLDivElement>(null);

  const { undo, redo, canUndo, canRedo } = useUndoRedo();

  const nodeIds: string[] = nodes.map((n) => n.id);

  // Array creation dialog state
  const [showArrayDialog, setShowArrayDialog] = useState(false);
  const [arrayDialogCallback, setArrayDialogCallback] = useState<
    ((name: string, length: number, elementType: DataType) => void) | null
  >(null);

  // Simple input dialog state
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [inputDialogConfig, setInputDialogConfig] = useState<{
    title: string;
    label: string;
    placeholder?: string;
    onConfirm: (value: string) => void;
  } | null>(null);

  // Local variable declaration dialog state
  const [showLocalVarDialog, setShowLocalVarDialog] = useState(false);
  const [localVarDialogNodeId, setLocalVarDialogNodeId] = useState<string | null>(null);

  const { previousMethodCall, lastMethodCall } = useMemo(() => {
    const methodCalls = nodes.filter(isMethodCallNode);
    if (methodCalls.length === 0) {
      return { previousMethodCall: undefined, lastMethodCall: undefined };
    }
    let prev = methodCalls[0];
    let last = methodCalls[0];
    methodCalls.forEach((methodCall) => {
      if (last.data.index < methodCall.data.index) {
        prev = last;
        last = methodCall;
      }
    });
    return { previousMethodCall: prev, lastMethodCall: last };
  }, [nodes]);

  const onConnect = useCallback<OnConnect>(
    (params) => {
      connectingNode.current = null;
      setEdges((eds) =>
        addEdge(
          params,
          eds.filter(
            (e) =>
              !(
                e.source === params.source &&
                e.sourceHandle == params.sourceHandle
              )
          )
        )
      );
    },
    [setEdges]
  );

  const onConnectStart = useCallback<OnConnectStart>((_, params) => {
    if (params.handleType == "source") {
      connectingNode.current = params;
    } else {
      connectingNode.current = null;
    }
  }, []);

  const getId = () => {
    let ma = getRanMemoryAdress(16);
    while (nodeIds.includes(ma)) {
      ma = getRanMemoryAdress(16);
    }
    nodeIds.push(ma);
    return ma;
  };

  // Helper function to show array creation dialog
  const showArrayCreationDialog = (
    callback: (name: string, length: number, elementType: DataType) => void
  ) => {
    setArrayDialogCallback(() => callback);
    setShowArrayDialog(true);
  };

  // Helper function to show input dialog
  const showSimpleInputDialog = (
    title: string,
    label: string,
    onConfirm: (value: string) => void,
    placeholder?: string
  ) => {
    setInputDialogConfig({ title, label, placeholder, onConfirm });
    setShowInputDialog(true);
  };

  // Get available types for arrays: primitives + defined classes
  const getAvailableTypes = (): DataType[] => {
    return [...primitveDataTypes, ...Object.keys(klasses)];
  };

  // Handler for declaring local variables
  const handleDeclareLocalVariable = useCallback((nodeId: string) => {
    setLocalVarDialogNodeId(nodeId);
    setShowLocalVarDialog(true);
    // No dependencies: a stable identity keeps `nodeTypes` stable, which stops
    // React Flow from remounting every node whenever the dialog toggles.
  }, []);

  const handleLocalVarDialogConfirm = (name: string) => {
    if (localVarDialogNodeId) {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === localVarDialogNodeId && n.type === "method-call") {
            return {
              ...n,
              data: {
                ...n.data,
                localVariables: {
                  ...n.data.localVariables,
                  [name]: {
                    dataType: "object",
                  },
                },
              },
            };
          }
          return n;
        })
      );
    }
    setShowLocalVarDialog(false);
    setLocalVarDialogNodeId(null);
  };

  // Create nodeTypes with access to handleDeclareLocalVariable
  const nodeTypes = useMemo(
    () => ({
      object: ObjectNode,
      variable: VariableNode,
      "method-call": (props: any) => (
        <MethodCallNode {...props} onDeclareVariable={handleDeclareLocalVariable} />
      ),
    }),
    [handleDeclareLocalVariable]
  );

  const onConnectEnd = useCallback<OnConnectEnd>(
    (event, connectionState) => {
      if (!connectingNode.current || !options.createNewOnEdgeDrop)
        return;
      if (!connectionState.isValid) {
        const node = nodes.find((n) => n.id == connectingNode.current?.nodeId);

        if (node?.type == "object") {
          const objNode: ObjectNodeType = node as any;

          // Special handling for Array elements
          let klassName: string;
          if (objNode.data.klass === "Array") {
            // For array elements, get the dataType from the specific element
            const handleId = connectingNode.current.handleId || "";
            const elementAttribute = objNode.data.attributes[handleId];
            if (!elementAttribute) return;
            klassName = elementAttribute.dataType;
          } else {
            // For regular objects, look up the type from the class definition
            const objKlass = klasses[objNode.data["klass"]];
            if (!objKlass) return;
            klassName = objKlass.attributes[connectingNode.current.handleId || ""];
          }

          const klass = klasses[klassName];

          const { clientX, clientY } =
            'changedTouches' in event ? event.changedTouches[0] : event;

          const position = screenToFlowPosition({
            x: clientX,
            y: clientY,
          });

          const id = getId();

          // Handle Array type specially
          let objAttributes: Record<string, Attribute>;
          if (klassName === "Array") {
            // Show dialog for array creation
            showArrayCreationDialog((_name, length, elementType) => {
              const tempAttributes: Record<string, Attribute> = {
                length: {
                  dataType: "int",
                  value: length,
                },
              };
              for (let i = 0; i < length; i++) {
                let value = undefined;
                if (elementType === "boolean") {
                  value = false;
                } else if (numericDataTypes.includes(elementType)) {
                  value = 0;
                } else if (elementType === "String") {
                  value = "";
                }
                tempAttributes[`[${i}]`] = {
                  dataType: elementType,
                  value: value,
                };
              }

              const newNode: CustomNodeType = {
                id,
                type: "object",
                position,
                data: {
                  klass: klassName,
                  attributes: tempAttributes,
                  position,
                  arrayElementType: elementType,
                },
              };
              const newEdge: CustomEdgeType = {
                id: getId(),
                source: connectingNode.current!.nodeId || "",
                sourceHandle: connectingNode.current!.handleId,
                target: id,
              };
              setNodes((nds) => nds.concat(newNode));
              setEdges((eds) =>
                eds
                  .filter(
                    (e) =>
                      !(
                        e.source == connectingNode.current?.nodeId &&
                        e.sourceHandle == connectingNode.current?.handleId
                      )
                  )
                  .concat(newEdge)
              );
            });
            return;
          } else if (klass) {
            objAttributes = createAttributesForObject(klass.attributes);
          } else {
            // Unknown klass type, cannot create object
            return;
          }

          const newNode: CustomNodeType = {
            id,
            type: "object",
            position,
            data: {
              klass: klassName,
              attributes: objAttributes,
              position,
            },
          };
          const newEdge: CustomEdgeType = {
            id: getId(),
            source: connectingNode.current.nodeId || "",
            sourceHandle: connectingNode.current.handleId,
            target: id,
          };
          setNodes((nds) => nds.concat(newNode));
          setEdges((eds) =>
            eds
              .filter(
                (e) =>
                  !(
                    e.source == connectingNode.current?.nodeId &&
                    e.sourceHandle == connectingNode.current?.handleId
                  )
              )
              .concat(newEdge)
          );
        }
      }
      connectingNode.current = null;
    },
    [nodes, klasses, options, setNodes, setEdges]
  );

  const onGC = () => {
    setNodes((nds) =>
      nds.filter(
        (n) =>
          n.type != "object" ||
          isConnectedToVariable(n.id, nodes, edges) ||
          isConnectedToMethodCall(n.id, nodes, edges)
      )
    );
  };

  const onConfig = () => {
    setRoute("config");
  };

  const onDownloadPng = () => {
    if (!flowRef.current) return;
    toPng(flowRef.current, {
      filter: (node) => {
        // we don't want to add the minimap and the controls to the image
        if (
          node?.classList?.contains("react-flow__minimap") ||
          node?.classList?.contains("react-flow__controls") ||
          node?.classList?.contains("button-group")
        ) {
          return false;
        }

        return true;
      },
    }).then((dataUrl) => {
      const a = document.createElement("a");

      a.setAttribute("download", "java-memory-playground.png");
      a.setAttribute("href", dataUrl);
      a.click();
    });
  };

  const createNodeAtPosition = (type: string, position: { x: number; y: number }) => {
    const k = klasses[type];

    if (type == "method-call") {
      showSimpleInputDialog(
        t.createMethodCall,
        t.methodName,
        (name) => {
          const index = nodes.filter((n) => n.type === "method-call").length;
          const newNode: CustomNodeType = {
            id: getId(),
            type: "method-call",
            position,
            data: {
              index,
              name,
              position,
              localVariables: {
                this: {
                  dataType: "object",
                  value: undefined,
                },
              },
            },
          };
          setNodes((nds) => nds.concat(newNode));
        },
        t.methodNamePlaceholder
      );
      return;
    }

    if (type != "variable") {
      if (type == "Array") {
        // Show dialog for array creation
        showArrayCreationDialog((name, length, elementType) => {
          const objAttributes: Record<string, Attribute> = {
            length: {
              dataType: "int",
              value: length,
            },
          };
          for (let i = 0; i < length; i++) {
            let value = undefined;
            if (elementType === "boolean") {
              value = false;
            } else if (numericDataTypes.includes(elementType)) {
              value = 0;
            } else if (elementType === "String") {
              value = "";
            }
            objAttributes[`[${i}]`] = {
              dataType: elementType,
              value: value,
            };
          }

          const newNode: CustomNodeType = {
            id: getId(),
            type: "object",
            position,
            data: {
              klass: type,
              attributes: objAttributes,
              position,
              arrayElementType: elementType,
            },
          };

          if (lastMethodCall === undefined) {
            const newVar: CustomNodeType = {
              id: getId(),
              type: "variable",
              position: {
                x: position.x - 100,
                y: position.y,
              },
              data: {
                name,
                value: newNode.id,
                position: {
                  x: position.x - 100,
                  y: position.y,
                },
                dataType: type,
              },
            };
            setNodes((nds) => nds.concat(newNode, newVar));
            const newEdge: CustomEdgeType = {
              id: getId(),
              source: newVar.id,
              target: newNode.id,
            };
            setEdges((egs) => egs.concat(newEdge));
          } else {
            setNodes((nds) =>
              nds
                .map((n) => {
                  if (n.id == lastMethodCall.id) {
                    (n.data as any).localVariables[name] = {
                      dataType: newNode.data.klass || "Object",
                      value: newNode.id,
                    };
                    return n;
                  }
                  return n;
                })
                .concat(newNode)
            );
            const newEdge: CustomEdgeType = {
              id: getId(),
              source: lastMethodCall.id,
              sourceHandle: name,
              target: newNode.id,
            };
            setEdges((egs) => egs.concat(newEdge));
          }
        });
        return;
      }

      showSimpleInputDialog(
        t.createObject(type),
        t.objectName,
        (name) => {
          let objAttributes = createAttributesForObject(k?.attributes || {});

          const newNode: CustomNodeType = {
            id: getId(),
            type: "object",
            position,
            data: {
              klass: type,
              attributes: objAttributes,
              position,
            },
          };

          if (lastMethodCall === undefined) {
            const newVar: CustomNodeType = {
              id: getId(),
              type: "variable",
              position: {
                x: position.x - 100,
                y: position.y,
              },
              data: {
                name,
                value: newNode.id,
                position: {
                  x: position.x - 100,
                  y: position.y,
                },
                dataType: type,
              },
            };
            setNodes((nds) => nds.concat(newNode, newVar));
            const newEdge: CustomEdgeType = {
              id: getId(),
              source: newVar.id,
              target: newNode.id,
            };
            setEdges((egs) => egs.concat(newEdge));
          } else {
            setNodes((nds) =>
              nds
                .map((n) => {
                  if (n.id == lastMethodCall.id) {
                    (n.data as any).localVariables[name] = {
                      dataType: newNode.data.klass || "Object",
                      value: newNode.id,
                    };
                    return n;
                  }
                  return n;
                })
                .concat(newNode)
            );
            const newEdge: CustomEdgeType = {
              id: getId(),
              source: lastMethodCall.id,
              sourceHandle: name,
              target: newNode.id,
            };
            setEdges((egs) => egs.concat(newEdge));
          }
        },
        t.variableNamePlaceholder
      );
    } else if (type == "variable") {
      showSimpleInputDialog(
        t.createGlobalVariable,
        t.variableName,
        (name) => {
          const newNode: CustomNodeType = {
            id: getId(),
            type: "variable",
            position,
            data: { name, value: null, position, dataType: "Object" },
          };
          setNodes((nds) => nds.concat(newNode));
        },
        t.variableNamePlaceholder
      );
    }
  };

  const onNodeDrop = useCallback(
    (nodeType: string, offsetX: number, offsetY: number) => {
      createNodeAtPosition(nodeType, { x: offsetX, y: offsetY });
    },
    [createNodeAtPosition]);

  return (
    <div className="memory-view">
      {!options.hideSidebar && <Sidebar klasses={klasses} options={options} onNodeDrop={onNodeDrop} />}
      <ReactFlow
        ref={flowRef}
        className="memory"
        nodes={nodes.map((n) => {
          n.className = "";
          n.deletable = options.disableGarbageCollector;
          if (
            previousMethodCall !== undefined &&
            isConnectedTo(n.id, previousMethodCall.id, nodes, edges)
          ) {
            n.className = "previous-method-call";
          }
          if (n.id === previousMethodCall?.id) {
            n.className = "previous-method-call";
          }
          if (
            (lastMethodCall !== undefined &&
              isConnectedTo(n.id, lastMethodCall.id, nodes, edges)) ||
            isConnectedToVariable(n.id, nodes, edges)
          ) {
            n.className = "last-method-call";
          }
          if (n.id === lastMethodCall?.id) {
            n.className = "last-method-call";
          }
          if (n.type === "variable") {
            n.deletable = true;
          }
          return { ...n };
        })}
        edges={edges.map((e) => {
          const node = nodes.find((n) => n.id == e.source);
          e.className = "";
          e.deletable = false;
          if (node && node.className?.includes("previous-method-call")) {
            e.className = "previous-method-call";
          }
          if (
            (node && node.className?.includes("last-method-call")) ||
            node?.type === "variable"
          ) {
            e.className = "last-method-call";
            e.deletable = true;
          }
          return { ...e };
        })}
        elevateEdgesOnSelect={true}
        defaultEdgeOptions={{
          type: "smoothstep",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#778899",
          },
        }}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        proOptions={{
          hideAttribution: true,
        }}
        fitView
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.1}
      >
        <Panel position="top-right">
          <div className="button-group">
            <button
              className="button-icon"
              onClick={undo}
              disabled={!canUndo}
              title={t.undo}
              aria-label={t.undo}
            >
              ↶
            </button>
            <button
              className="button-icon"
              onClick={redo}
              disabled={!canRedo}
              title={t.redo}
              aria-label={t.redo}
            >
              ↷
            </button>
            <button onClick={save}>{persistence ? t.saveUrl : t.save}</button>
            <button onClick={onDownloadPng}>{t.downloadPng}</button>
            <button onClick={onConfig}>{t.config}</button>
          </div>
        </Panel>
        {!options.disableGarbageCollector && <Panel position="bottom-right">
          <div className="button-group">
            <button className="button-gc" onClick={onGC}>
              {t.runGarbageCollector}
            </button>
          </div>
        </Panel>}
        <Controls />
        <Background />
      </ReactFlow>
      {showArrayDialog && arrayDialogCallback && (
        <ArrayCreationDialog
          onConfirm={(name, length, elementType) => {
            arrayDialogCallback(name, length, elementType);
            setShowArrayDialog(false);
            setArrayDialogCallback(null);
          }}
          onCancel={() => {
            setShowArrayDialog(false);
            setArrayDialogCallback(null);
          }}
          availableTypes={getAvailableTypes()}
        />
      )}
      {showInputDialog && inputDialogConfig && (
        <SimpleInputDialog
          title={inputDialogConfig.title}
          label={inputDialogConfig.label}
          placeholder={inputDialogConfig.placeholder}
          onConfirm={(value) => {
            inputDialogConfig.onConfirm(value);
            setShowInputDialog(false);
            setInputDialogConfig(null);
          }}
          onCancel={() => {
            setShowInputDialog(false);
            setInputDialogConfig(null);
          }}
        />
      )}
      {showLocalVarDialog && (
        <SimpleInputDialog
          title={t.declareLocalVariableTitle}
          label={t.variableName}
          placeholder={t.variableNamePlaceholder}
          onConfirm={handleLocalVarDialogConfirm}
          onCancel={() => {
            setShowLocalVarDialog(false);
            setLocalVarDialogNodeId(null);
          }}
        />
      )}
    </div>
  );
};
