import ReactFlow, {
  Controls,
  Background,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  ReactFlowInstance,
  Node,
  Edge,
  OnConnectStart,
  OnConnectEnd,
  OnConnect,
  OnConnectStartParams,
  MarkerType,
} from "reactflow";
import { toPng } from "html-to-image";
import useStore, { RFState } from "./store";
import { shallow } from "zustand/shallow";
import { getEdgesAndNodes, getMemory } from "./getEdgesAndNodes";
import ObjectNode from "./ObjectNode";
import VariableNode from "./VariableNode";
import { useCallback, useState, DragEvent, useRef } from "react";
import { Sidebar } from "./Sidebar";
import { Obj, Variable } from "./memory";
import { isConnectedToVariable } from "./utils";

const selector = (state: RFState) => ({
  selectedNodeId: state.selectedNodeId,
  updateMemory: state.updateMemory,
  memory: state.memory,
  setRoute: state.setRoute,
});

const nodeTypes = {
  object: ObjectNode,
  variable: VariableNode,
};

const createAttributesForObject = (
  attributes: Record<string, string>,
): Record<string, string | boolean | number | null> => {
  const objAttributes: Record<string, string | null> = {};
  Object.entries(attributes).forEach(([name, dataType]) => {
    let value = null;
    if (
      ["int", "char", "float", "double", "boolean", "String"].includes(dataType)
    ) {
      value = "";
    }
    objAttributes[name] = value;
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
  const { memory, updateMemory, setRoute } = useStore(selector, shallow);
  const { edges: initialEdges, nodes: initialNodes } = getEdgesAndNodes(memory);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const connectingNode = useRef<OnConnectStartParams | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const nodeIds: string[] = nodes.map((n) => n.id);
  const onConnect = useCallback<OnConnect>((params) => {
    connectingNode.current = null;
    setEdges((eds) => addEdge(params, eds));
  }, []);
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

  const onConnectEnd = useCallback<OnConnectEnd>(
    (event) => {
      const node = nodes.find((n) => n.id == connectingNode.current?.nodeId);
      if (!connectingNode.current) return;
      const targetIsPane = (event.target as HTMLElement).classList.contains(
        "react-flow__pane",
      );

      if (targetIsPane && node?.type == "object" && reactFlowInstance != null) {
        const objNode: Node<Obj> = node as any;
        const klassName =
          memory.klasses[objNode.data["klass"]].attributes[
            connectingNode.current.handleId || ""
          ];
        const klass = memory.klasses[klassName];
        const position = reactFlowInstance.screenToFlowPosition({
          x: (event as any).clientX,
          y: (event as any).clientY,
        });
        const id = getId();

        const newNode: Node<Obj> = {
          id,
          type: "object",
          position,
          data: {
            klass: klassName,
            attributes: createAttributesForObject(klass.attributes),
            position,
          },
        };
        const newEdge: Edge = {
          id: getId(),
          source: connectingNode.current.nodeId || "",
          sourceHandle: connectingNode.current.handleId,
          target: id,
        };
        setNodes((nds) => nds.concat(newNode));
        setEdges((eds) => eds.concat(newEdge));
      }
      connectingNode.current = null;
    },
    [nodes, memory],
  );

  const onGC = () => {
    setNodes((nds) =>
      nds.filter((n) => n.type != "object" || isConnectedToVariable(n.id, nodes, edges)),
    );
  };

  const onEdit = () => {
    onSaveURL();
    setRoute("edit");
  };

  const onSaveURL = () => {
    updateMemory({ ...memory, ...getMemory(edges, nodes) });
  };

  const onDownloadPng = () => {
    toPng(document.querySelector(".memory") as any, {
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

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (reactFlowInstance == null) return;

      const type = event.dataTransfer.getData(
        "application/java-memory-playground",
      );

      // check if the dropped element is valid
      if (typeof type === "undefined" || !type) {
        return;
      }

      // reactFlowInstance.project was renamed to reactFlowInstance.screenToFlowPosition
      // and you don't need to subtract the reactFlowBounds.left/top anymore
      // details: https://reactflow.dev/whats-new/2023-11-10
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const k = memory.klasses[type];

      if (type != "variable") {
        const name = window.prompt(`Name for the new ${type}?`);
        let objAttributes = createAttributesForObject(k?.attributes || {});

        if (type == "Array") {
          const length = window.prompt(`Length of the ${name} array?`);
          if (length == null) return;
          objAttributes = {
            length: Number.parseInt(length),
          };
          for (let i = 0; i < Number.parseInt(length); i++) {
            objAttributes[`[${i}]`] = null;
          }
        }
        if (name != null) {
          const newNode: Node<Obj> = {
            id: getId(),
            type: "object",
            position,
            data: {
              klass: type,
              attributes: objAttributes,
              position,
            },
          };
          const newVar: Node<Variable> = {
            id: getId(),
            type: "variable",
            position: {
              x: position.x - 100,
              y: position.y,
            },
            data: {
              name,
              value: null,
              position: {
                x: position.x - 100,
                y: position.y,
              },
              dataType: type,
            },
          };
          setNodes((nds) => nds.concat(newNode, newVar));

          const newEdge: Edge = {
            id: getId(),
            source: newVar.id,
            target: newNode.id,
          };
          setEdges((egs) => egs.concat(newEdge));
        }
      } else if (type == "variable") {
        const name = window.prompt("Name for the new variable?");

        if (name != null) {
          const newNode: Node<Variable> = {
            id: getId(),
            type: "variable",
            position,
            data: { name, value: null, position, dataType: "List" },
          };
          setNodes((nds) => nds.concat(newNode));
        }
      }
    },
    [reactFlowInstance],
  );

  return (
    <div className="memory-view">
      {!memory.options.hideSidebar && <Sidebar memory={memory} />}
      <ReactFlowProvider>
        <ReactFlow
          className="memory"
          nodes={nodes}
          elevateEdgesOnSelect={true}
          defaultEdgeOptions={{
            type: "smoothstep",
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          }}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          proOptions={{
            hideAttribution: true,
          }}
          edges={edges}
          fitView
          nodeTypes={nodeTypes}
          minZoom={0.1}
        >
          <Panel position="top-right">
            <div className="button-group">
              <button onClick={onSaveURL}>Save (URL)</button>
              <button onClick={onDownloadPng}>Download (PNG)</button>
              <button onClick={onEdit}>Edit</button>
            </div>
          </Panel>
          <Panel position="bottom-right">
            <div className="button-group">
              <button className="button-gc" onClick={onGC}>Run Garbage Collector</button>
            </div>
          </Panel>
          <Controls />
          <Background />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};
