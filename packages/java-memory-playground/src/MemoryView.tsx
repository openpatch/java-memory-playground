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
import {
  CaptureSession,
  captureDiagramCanvas,
  downloadAllSteps,
} from "./exportSteps";
import { fitPaddingFor } from "./fitPadding";
import { Toolbar, ToolbarItem } from "./Toolbar";

/**
 * Below either size the playground switches to its compact layout: phones,
 * tablets, and the iframes and embeds a course page puts a diagram in. The
 * compact layout leaves the diagram most of the room, which is worth it long
 * before the regular one actually runs out of space; only a full desktop
 * window keeps the palette, the full toolbar and the zoom buttons out.
 */
const COMPACT_WIDTH = 1024;
const COMPACT_HEIGHT = 640;
import { paletteFor } from "./palette";
import { useColorMode } from "./colorMode";
import useStore, { useMemoryStore } from "./storeContext";
import { useUndoRedo } from "./useUndoRedo";
import { RFState } from "./store";
import { useShallow } from "zustand/shallow";
import ObjectNode, { ObjectNodeType } from "./ObjectNode";
import VariableNode from "./VariableNode";
import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { Sidebar } from "./Sidebar";
import { StepBar } from "./StepBar";
import { diffSteps } from "./stepDiff";
import { wrongSlots } from "./checkMessages";
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
  exerciseResult: state.getExerciseResult(),
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
    exerciseResult,
    t,
  } = useStore(useShallow(selector));
  const {
    screenToFlowPosition,
    getViewport,
    setViewport,
    fitView,
    getInternalNode,
  } =
    useReactFlow();

  const store = useMemoryStore();
  const connectingNode = useRef<OnConnectStartParams | null>(null);
  // Scoped to this instance so that exporting works when a page embeds more
  // than one playground.
  const flowRef = useRef<HTMLDivElement>(null);

  /**
   * Whether the diagram is currently drawn for paper.
   *
   * The whole view switches, not just the download, so that what is on screen
   * is what comes out of the printer — and because the PNG is a photograph of
   * the live diagram, there is nothing else it could be. Deliberately not part
   * of the saved memory: it is how you are looking at a diagram, not something
   * about the diagram, and a link shared in print mode would arrive grey.
   */
  const [printMode, setPrintMode] = useState(false);

  // The scheme the host is in, read from this view's own element — the same
  // color-scheme the CSS light-dark() pairs resolve against, so the colours
  // drawn inline into the SVG (which cannot read `var(--jmp-…)`) agree with
  // the chrome around them. Print is paper: always the light half.
  const viewRef = useRef<HTMLDivElement>(null);
  const colorMode = useColorMode(viewRef);

  // The layout follows the playground's own size rather than the window's: a
  // small embed on a large screen is as short of room as a phone.
  const compact = useStore((state) => state.compact);
  const setCompact = useStore((state) => state.setCompact);
  useEffect(() => {
    const element = viewRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setCompact(width < COMPACT_WIDTH || height < COMPACT_HEIGHT);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [setCompact]);

  // Which of the compact layout's folded panels is open.
  const [paletteOpen, setPaletteOpen] = useState(false);

  // The first frame is fitted before the playground has measured itself, so
  // a phone gets the desktop's margins — a palette's width out of 390 pixels.
  // Fit again whenever the layout changes, with the margins it now has.
  const lastLayout = useRef(false);
  useEffect(() => {
    if (lastLayout.current === compact) return;
    lastLayout.current = compact;
    const frame = requestAnimationFrame(() =>
      fitView({ padding: fitPaddingFor(options, compact) }),
    );
    return () => cancelAnimationFrame(frame);
    // Only a change of layout re-frames; an option toggled in the config view
    // should not throw away where the reader has panned to.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compact]);
  const palette = paletteFor(printMode ? "light" : colorMode);

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

  const nextFrame = () =>
    new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  /**
   * Waits until what is on screen can be photographed: React has rendered the
   * step and React Flow has measured every node in it. A fixed timeout either
   * waited far longer than that — it was most of the time an export of a long
   * trace took — or, on a slow machine, not long enough.
   */
  const settle = async () => {
    await nextFrame();
    const deadline = performance.now() + 1000;
    while (performance.now() < deadline) {
      // React Flow's own record of each node, which is where a measurement
      // lands; the nodes handed to it do not always carry one back.
      const measured = store
        .getState()
        .getNodes()
        .every((n) => {
          const size = getInternalNode(n.id)?.measured;
          return Boolean(size?.width && size?.height);
        });
      if (measured) break;
      await nextFrame();
    }
  };

  /**
   * Photographs the step on screen, framing the whole diagram first so that
   * nothing scrolled out of view is missing from the picture, and putting the
   * view back afterwards.
   */
  const captureStepCanvas = async (session?: CaptureSession) => {
    if (!flowRef.current) return null;
    const before = getViewport();
    await settle();
    await fitView({ padding: 0.12, duration: 0 });
    // The new viewport is applied on the next render.
    await nextFrame();
    const canvas = await captureDiagramCanvas(
      flowRef.current,
      store.getState().getNodes(),
      getViewport(),
      // The PNG is a photograph of the live diagram, so its caption and
      // backdrop wear the scheme the diagram on screen is drawn in.
      printMode ? "light" : colorMode,
      session,
    );
    setViewport(before);
    return canvas;
  };

  const onDownloadPng = async () => {
    const canvas = await captureStepCanvas();
    if (!canvas) return;
    const a = document.createElement("a");
    a.setAttribute("download", "java-memory-playground.png");
    a.setAttribute("href", canvas.toDataURL("image/png"));
    a.click();
  };

  const onDownloadAllPng = async () => {
    if (!flowRef.current) return;
    const back = currentStep;
    // One session for the whole trace, so the fonts are read once.
    const session: CaptureSession = {};
    await downloadAllSteps({
      stepCount: steps.length,
      labelFor: (i) => steps[i]?.label ?? "",
      showStep: async (i) => {
        goToStep(i);
      },
      captureNow: () => captureStepCanvas(session),
      mode: printMode ? "light" : colorMode,
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

  // What the last check found wrong, so the diagram points at it: the node
  // holding the slot, and the reference leaving it if there is one.
  const wrong = useMemo(() => wrongSlots(exerciseResult), [exerciseResult]);
  const wrongOwners = useMemo(
    () => new Set([...wrong].map((slot) => slot.split(" ")[0])),
    [wrong],
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

  // The toolbar, grouped by what each part acts on: history, pictures of the
  // diagram, the setup. Each item can be switched off by the host; a group
  // with nothing left in it takes its divider with it, and a toolbar with
  // nothing left in it is not drawn at all. Undo and redo stay in the row;
  // the rest goes in the toolbar's menu.
  const toolbarItems: ToolbarItem[] = [
    !options.hideUndoRedo && {
      key: "undo", group: 0, icon: "↶", label: t.undo, onClick: undo, disabled: !canUndo,
    },
    !options.hideUndoRedo && {
      key: "redo", group: 0, icon: "↷", label: t.redo, onClick: redo, disabled: !canRedo,
    },
    !options.hideDownloadPng && {
      key: "png", group: 1, label: t.downloadPng, onClick: onDownloadPng,
    },
    !options.hideDownloadAllPng && steps.length > 1 && {
      key: "all", group: 1, label: t.downloadAllPng, title: t.downloadAllPngHint,
      onClick: onDownloadAllPng,
    },
    // A toggle rather than a third download: it changes the diagram, and the
    // downloads beside it then follow.
    !options.hidePrintMode && {
      key: "print", group: 1, label: t.printMode, title: t.printModeHint,
      pressed: printMode, onClick: () => setPrintMode((on) => !on),
    },
    // The zoom controls are not drawn in the compact layout — they would sit
    // in the corner the step card needs, and a phone pinches to zoom — but
    // framing the whole diagram again is still worth a button.
    compact && {
      key: "fit", group: 2, icon: "⛶", label: t.a11y.fitView,
      onClick: () => fitView({ padding: fitPaddingFor(options, true), duration: 200 }),
    },
    mode === "edit" && {
      key: "config", group: 2, label: t.config, onClick: onConfig,
    },
    // A link rather than a button, so that whatever owns navigation around
    // the playground opens it the way it opens any link: a new tab in a
    // browser, the external browser from a VS Code webview. `window.open` is
    // blocked in some of those hosts.
    !options.hideHelp && {
      key: "help", group: 2, icon: "?", label: t.help, href: DOCUMENTATION_URL,
    },
    !options.hideSave && {
      key: "save", group: 2, label: persistence ? t.saveUrl : t.save,
      onClick: save, primary: true,
    },
  ].filter(Boolean) as ToolbarItem[];

  return (
    <div className={`memory-view${compact ? " jmp-compact" : ""}`} ref={viewRef}>
      <ReactFlow
        ref={flowRef}
        // Flips React Flow's own `dark` class, so the parts of its chrome the
        // --xy-* tokens above do not reach (connection line, handles while
        // dragging) follow the host's scheme too — the same prop bitflow
        // derives from the same color-scheme.
        colorMode={colorMode}
        // The palette is a floating panel, so the toolbar opposite it has to
        // know whether that corner is occupied before it decides how wide it
        // may be. See `.with-palette` in index.css.
        // `jmp-print` goes here rather than on the container so that it lands
        // on the element the export photographs: html-to-image resolves the
        // custom properties of everything inside the clone root, and this is
        // the clone root.
        className={`memory${options.hideSidebar ? "" : " with-palette"}${
          printMode ? " jmp-print" : ""
        }`}
        nodes={visibleNodes.map((n) => {
          const classes = [stackClass.get(n.id) ?? ""];
          if (showChanges) {
            if (diff.added.has(n.id)) classes.push("step-added");
            else if (diff.changed.has(n.id)) classes.push("step-changed");
          }
          if (gcPrediction?.includes(n.id)) classes.push("gc-predicted");
          if (wrongOwners.has(n.id)) classes.push("check-wrong");
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
          const checkWrong = wrong.has(`${e.source} ${e.sourceHandle ?? ""}`);
          const classes = [live ? "last-method-call" : stack];
          if (changed) classes.push("step-changed");
          if (checkWrong) classes.push("check-wrong");
          return {
            ...e,
            className: classes.filter(Boolean).join(" "),
            deletable: live,
            // Inline rather than left to the stylesheet, and a literal rather
            // than a `var()`: exporting deep-clones the edge SVG and renders it
            // where neither the stylesheet nor the custom properties reach. A
            // reference with no stroke is an invisible one. See `palette.ts`.
            // The print block in the stylesheet cannot reach an edge for the
            // same reason: the state a colour was carrying has to become a
            // line style here instead, so a changed reference is the dashed
            // one on paper.
            style: {
              stroke: printMode
                ? palette.BLACK
                : checkWrong
                  ? palette.DANGER
                  : changed
                    ? palette.WARNING
                    : palette.TEXT_MUTED,
              strokeWidth: 4,
              strokeDasharray: printMode && changed ? "12 7" : undefined,
              opacity: changed || checkWrong || live ? 1 : stack ? 0.6 : 0.2,
            },
          };
        })}
        elevateEdgesOnSelect={true}
        defaultEdgeOptions={{
          type: "smoothstep",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            // React Flow puts this in the marker's inline style, which the
            // export carries along unread — so a literal, for the same reason
            // the line above it is one. The head then matches its line both on
            // screen and in the picture.
            color: printMode ? palette.BLACK : palette.TEXT_MUTED,
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
        fitViewOptions={{ padding: fitPaddingFor(options, compact) }}
        ariaLabelConfig={ariaLabelsFor(t)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.1}
      >
        {(!options.hideSidebar || !options.disableGarbageCollector) && (
          <Panel position="top-left">
            {/* In the compact layout the palette folds behind one button, so a
                phone keeps its width for the diagram. It stays open while a
                garbage prediction runs: that mode has a count and a way out,
                and they must not be hidden. */}
            {compact && !options.hideSidebar && (
              <button
                className={`jmp-fold-button jmp-panel${paletteOpen ? " open" : ""}`}
                onClick={() => setPaletteOpen(!paletteOpen)}
                aria-expanded={paletteOpen || gcPrediction !== null}
                title={paletteOpen ? t.hidePalette : t.showPalette}
              >
                <span aria-hidden="true">{paletteOpen ? "×" : "+"}</span>
                {t.paletteHeading}
              </button>
            )}
            {(!compact || options.hideSidebar || paletteOpen || gcPrediction !== null) && (
              <>
                {!options.hideSidebar && (!compact || paletteOpen) && (
                  <Sidebar
                    klasses={klasses}
                    options={options}
                    onNodeDrop={(...args) => {
                      onNodeDrop(...args);
                      // What was added should be seen, not hidden under the
                      // palette that added it.
                      if (compact) setPaletteOpen(false);
                    }}
                  />
                )}
                {/* Under the palette, because collecting is another thing done
                    to what is on the canvas — the palette puts objects there,
                    this takes them away. A prediction is a mode, with a running
                    count and a way out, and a column has the room for that. */}
                {!options.disableGarbageCollector && (
                  <div className="gc-panel jmp-panel">
                    {gcResult && (
                      <span className="gc-result">
                        {t.gcScore(gcResult.found, gcResult.missed, gcResult.wrong)}
                      </span>
                    )}
                    {options.gcPrediction && gcPrediction === null && (
                      <button className="button-danger" onClick={startGcPrediction}>
                        {t.predictGarbage}
                      </button>
                    )}
                    {gcPrediction !== null && (
                      <>
                        <span className="gc-hint">
                          {t.predictGarbageHint(gcPrediction.length)}
                        </span>
                        <button className="button-ghost" onClick={cancelGcPrediction}>
                          {t.cancel}
                        </button>
                      </>
                    )}
                    {(!options.gcPrediction || gcPrediction !== null) && (
                      <button
                        className="button-danger"
                        onClick={() => {
                          collectGarbage();
                          if (compact) setPaletteOpen(false);
                        }}
                      >
                        {gcPrediction !== null
                          ? t.checkAndCollect
                          : t.runGarbageCollector}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </Panel>
        )}
        {toolbarItems.length > 0 && (
          <Panel position="top-right">
            <Toolbar items={toolbarItems} t={t} />
          </Panel>
        )}
        {!options.hideSteps && (
          <Panel position="bottom-center">
            <StepBar editable={mode === "edit"} />
          </Panel>
        )}
        {!compact && <Controls />}
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
