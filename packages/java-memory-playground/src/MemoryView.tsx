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
import { ariaLabelsFor } from "./ariaLabels";
import { captureDiagram, downloadAllSteps } from "./exportSteps";
import { fitPaddingFor } from "./fitPadding";
import useStore, { useMemoryStore } from "./storeContext";
import { useUndoRedo } from "./useUndoRedo";
import { RFState } from "./store";
import { useShallow } from "zustand/shallow";
import ObjectNode, { ObjectNodeType } from "./ObjectNode";
import VariableNode from "./VariableNode";
import { useCallback, useState, useRef, useMemo } from "react";
import { Sidebar } from "./Sidebar";
import { StepBar } from "./StepBar";
import { diffSteps } from "./stepDiff";
import {
  Attribute,
  builtInDataTypes,
  defaultValueFor,
  numericDataTypes,
  DataType,
  STRING_KLASS,
} from "./memory";
import {
  getRanMemoryAdress,
  isConnectedTo,
  isConnectedToVariable,
} from "./utils";
import MethodCallNode, {
  isMethodCallNode,
} from "./MethodCallNode";
import ReferenceEdge from "./ReferenceEdge";
import { CustomEdgeType, CustomNodeType } from "./types";
import { ArrayCreationDialog } from "./ArrayCreationDialog";
import { SimpleInputDialog } from "./SimpleInputDialog";

/**
 * Where the help button goes: the documentation page served next to the app.
 *
 * Relative on purpose. Naming a domain here would be guessing at where any
 * given playground is deployed, and a guess that is wrong is a help button
 * that 404s.
 */
export const DOCUMENTATION_URL = "documentation.html";

const selector = (state: RFState) => ({
  selectedNodeId: state.selectedNodeId,
  klasses: state.klasses,
  options: state.options,
  setRoute: state.setRoute,
  persistence: state.persistence,
  nodes: state.steps[state.currentStep]?.nodes ?? [],
  edges: state.steps[state.currentStep]?.edges ?? [],
  setNodes: state.setNodes,
  setEdges: state.setEdges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  save: state.save,
  mode: state.mode,
  previousStep: state.steps[state.currentStep - 1],
  steps: state.steps,
  currentStep: state.currentStep,
  goToStep: state.goToStep,
  gcPrediction: state.gcPrediction,
  gcResult: state.gcResult,
  startGcPrediction: state.startGcPrediction,
  toggleGcPrediction: state.toggleGcPrediction,
  cancelGcPrediction: state.cancelGcPrediction,
  collectGarbage: state.collectGarbage,
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
    objAttributes[name] = {
      value: defaultValueFor(dataType),
      dataType,
    };
  });
  return objAttributes;
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
    mode,
    previousStep,
    steps,
    currentStep,
    goToStep,
    gcPrediction,
    gcResult,
    startGcPrediction,
    toggleGcPrediction,
    cancelGcPrediction,
    collectGarbage,
    t,
  } = useStore(useShallow(selector));
  const { screenToFlowPosition, getViewport, setViewport, fitView } =
    useReactFlow();
  const store = useMemoryStore();
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
    return [...builtInDataTypes, ...Object.keys(klasses)];
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


  const onConfig = () => {
    setRoute("config");
  };

  const settle = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * Photographs the step on screen, framing the whole diagram first so that
   * nothing scrolled out of view is missing from the picture, and putting the
   * view back afterwards.
   */
  const captureCurrentStep = async () => {
    if (!flowRef.current) return null;
    const before = getViewport();
    fitView({ padding: 0.12, duration: 0 });
    await settle(120);
    const dataUrl = await captureDiagram(
      flowRef.current,
      store.getState().getNodes(),
      getViewport(),
    );
    setViewport(before);
    return dataUrl;
  };

  const onDownloadPng = async () => {
    const dataUrl = await captureCurrentStep();
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.setAttribute("download", "java-memory-playground.png");
    a.setAttribute("href", dataUrl);
    a.click();
  };

  const onDownloadAllPng = async () => {
    if (!flowRef.current) return;
    const back = currentStep;
    await downloadAllSteps({
      stepCount: steps.length,
      labelFor: (i) => steps[i]?.label ?? "",
      showStep: async (i) => {
        goToStep(i);
        // Let the step render and be measured before it is photographed.
        await settle(320);
      },
      captureNow: captureCurrentStep,
    });
    goToStep(back);
  };

  const createNodeAtPosition = (type: string, position: { x: number; y: number }) => {
    const k = klasses[type];

    if (type == "method-call") {
      showSimpleInputDialog(
        t.createMethodCall,
        t.methodName,
        (name) => {
          // One past the deepest frame. Counting the frames instead used to
          // hand out an index that a surviving frame already had.
          const index =
            nodes.filter(isMethodCallNode).reduce((max, n) => Math.max(max, n.data.index), -1) + 1;
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
            objAttributes[`[${i}]`] = {
              dataType: elementType,
              value: defaultValueFor(elementType),
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

  // How far down the call stack a node hangs, for the fading of older frames.
  // Computed once rather than assigned onto the store's nodes while rendering,
  // which the edges below then read back.
  const stackClass = useMemo(() => {
    const classes = new Map<string, string>();
    nodes.forEach((n) => {
      let c = "";
      if (
        previousMethodCall !== undefined &&
        isConnectedTo(n.id, previousMethodCall.id, nodes, edges)
      ) {
        c = "previous-method-call";
      }
      if (n.id === previousMethodCall?.id) c = "previous-method-call";
      if (
        (lastMethodCall !== undefined &&
          isConnectedTo(n.id, lastMethodCall.id, nodes, edges)) ||
        isConnectedToVariable(n.id, nodes, edges)
      ) {
        c = "last-method-call";
      }
      if (n.id === lastMethodCall?.id) c = "last-method-call";
      classes.set(n.id, c);
    });
    return classes;
  }, [nodes, edges, previousMethodCall, lastMethodCall]);

  // What this step changed. The first step of a story changed nothing.
  const showChanges = !options.hideStepChanges;
  const diff = useMemo(
    () => diffSteps(previousStep, { nodes, edges }),
    [previousStep, nodes, edges],
  );

  // While Strings are inlined they are still real objects with real references
  // — they are only left out of the drawing, and out of it as edge targets.
  const { visibleNodes, visibleEdges } = useMemo(() => {
    if (!options.inlineStrings) {
      return { visibleNodes: nodes, visibleEdges: edges };
    }
    const inlined = new Set(
      nodes
        .filter((n) => n.type === "object" && n.data.klass === STRING_KLASS)
        .map((n) => n.id),
    );
    return {
      visibleNodes: nodes.filter((n) => !inlined.has(n.id)),
      visibleEdges: edges.filter((e) => !inlined.has(e.target)),
    };
  }, [nodes, edges, options.inlineStrings]);

  return (
    <div className="memory-view">
      <ReactFlow
        ref={flowRef}
        // The palette is a floating panel, so the toolbar opposite it has to
        // know whether that corner is occupied before it decides how wide it
        // may be. See `.with-palette` in index.css.
        className={`memory${options.hideSidebar ? "" : " with-palette"}`}
        nodes={visibleNodes.map((n) => {
          const classes = [stackClass.get(n.id) ?? ""];
          if (showChanges) {
            if (diff.added.has(n.id)) classes.push("step-added");
            else if (diff.changed.has(n.id)) classes.push("step-changed");
          }
          if (gcPrediction?.includes(n.id)) classes.push("gc-predicted");
          return {
            ...n,
            className: classes.filter(Boolean).join(" "),
            deletable:
              n.type === "variable" ? true : options.disableGarbageCollector,
          };
        })}
        edges={visibleEdges.map((e) => {
          const source = nodes.find((n) => n.id == e.source);
          const stack = stackClass.get(e.source) ?? "";
          const live = stack === "last-method-call" || source?.type === "variable";
          const changed = showChanges && diff.edges.has(e.id);
          const classes = [live ? "last-method-call" : stack];
          if (changed) classes.push("step-changed");
          return {
            ...e,
            className: classes.filter(Boolean).join(" "),
            deletable: live,
            // Inline rather than left to the stylesheet: exporting deep-clones
            // the edge SVG, which drops anything a stylesheet contributed, and
            // a reference with no stroke is an invisible one.
            style: {
              stroke: changed ? "var(--jmp-warning)" : "var(--jmp-text-muted)",
              strokeWidth: 4,
              opacity: changed || live ? 1 : stack ? 0.6 : 0.2,
            },
          };
        })}
        elevateEdgesOnSelect={true}
        defaultEdgeOptions={{
          type: "smoothstep",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            // React Flow puts this in the marker's inline style, so a custom
            // property resolves; the arrowhead then matches the line it caps.
            color: "var(--jmp-text-muted)",
          },
        }}
        onNodeClick={(_, node) => {
          if (gcPrediction === null) return;
          if (node.type === "object") toggleGcPrediction(node.id);
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
        fitViewOptions={{ padding: fitPaddingFor(options) }}
        ariaLabelConfig={ariaLabelsFor(t)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.1}
      >
        {!options.hideSidebar && (
          <Panel position="top-left">
            <Sidebar
              klasses={klasses}
              options={options}
              onNodeDrop={onNodeDrop}
            />
          </Panel>
        )}
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
            {steps.length > 1 && (
              <button onClick={onDownloadAllPng} title={t.downloadAllPngHint}>
                {t.downloadAllPng}
              </button>
            )}
            {mode === "edit" && (
              <button onClick={onConfig}>{t.config}</button>
            )}
            {/* A link rather than a button, so that whatever owns navigation
                around the playground opens it the way it opens any link: a new
                tab in a browser, the external browser from a VS Code webview.
                `window.open` is blocked in some of those hosts. */}
            <a
              className="button-icon"
              href={DOCUMENTATION_URL}
              target="_blank"
              rel="noreferrer noopener"
              title={t.help}
              aria-label={t.help}
            >
              ?
            </a>
          </div>
        </Panel>
        {/* One row along the bottom. The step bar and the collector used to be
            their own panels, pinned to the centre and the right, which meant
            they slid into each other on a narrow screen and the collector
            covered "Add step". Sharing a row, they cannot overlap. */}
        {(!options.hideSteps || !options.disableGarbageCollector) && (
          <Panel position="bottom-center">
            <div className="bottom-bar">
              {!options.hideSteps && <StepBar editable={mode === "edit"} />}
              {!options.disableGarbageCollector && (
                <div className="button-group gc-panel">
                  {gcResult && (
                    <span className="gc-result">
                      {t.gcScore(
                        gcResult.found,
                        gcResult.missed,
                        gcResult.wrong,
                      )}
                    </span>
                  )}
                  {options.gcPrediction && gcPrediction === null && (
                    <button className="button-gc" onClick={startGcPrediction}>
                      {t.predictGarbage}
                    </button>
                  )}
                  {gcPrediction !== null && (
                    <>
                      <span className="gc-hint">
                        {t.predictGarbageHint(gcPrediction.length)}
                      </span>
                      <button onClick={cancelGcPrediction}>{t.cancel}</button>
                    </>
                  )}
                  {(!options.gcPrediction || gcPrediction !== null) && (
                    <button className="button-gc" onClick={collectGarbage}>
                      {gcPrediction !== null
                        ? t.checkAndCollect
                        : t.runGarbageCollector}
                    </button>
                  )}
                </div>
              )}
            </div>
          </Panel>
        )}
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
