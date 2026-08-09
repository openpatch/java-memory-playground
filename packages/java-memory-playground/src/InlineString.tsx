import { ChangeEventHandler } from "react";
import { useShallow } from "zustand/shallow";

import { STRING_KLASS } from "./memory";
import { RFState } from "./store";
import useStore from "./storeContext";
import { CustomEdgeType, CustomNodeType } from "./types";
import { getRanMemoryAdress } from "./utils";

const selector = (state: RFState) => ({
  nodes: state.steps[state.currentStep]?.nodes ?? [],
  edges: state.steps[state.currentStep]?.edges ?? [],
  setNodes: state.setNodes,
  setEdges: state.setEdges,
});

/**
 * Edits the String object referenced from one attribute or local variable,
 * showing it where the reference is rather than as its own box.
 *
 * Reads the store rather than React Flow, because while `inlineStrings` is on
 * the String objects and their edges are deliberately left out of the drawing —
 * they still exist, which is the whole point.
 */
export function InlineString({
  nodeId,
  handleId,
  readOnly,
}: {
  nodeId: string;
  handleId: string;
  readOnly?: boolean;
}) {
  const { nodes, edges, setNodes, setEdges } = useStore(useShallow(selector));

  const edge = edges.find(
    (e) => e.source === nodeId && e.sourceHandle === handleId,
  );
  const target = edge ? nodes.find((n) => n.id === edge.target) : undefined;
  const literal =
    target?.type === "object" && target.data.klass === STRING_KLASS
      ? (target.data.literal ?? "")
      : "";

  const onChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const next = event.target.value;

    if (target) {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === target.id && n.type === "object"
            ? { ...n, data: { ...n.data, literal: next } }
            : n,
        ),
      );
      return;
    }

    // First keystroke into a null reference: allocate the String object.
    const owner = nodes.find((n) => n.id === nodeId);
    const position = {
      x: (owner?.position.x ?? 0) + 220,
      y: (owner?.position.y ?? 0) + 40,
    };
    const id = getRanMemoryAdress(16, new Set(nodes.map((n) => n.id)));

    setNodes((nds) =>
      nds.concat({
        id,
        type: "object",
        position,
        data: {
          klass: STRING_KLASS,
          literal: next,
          attributes: {},
          position,
        },
      } as CustomNodeType),
    );
    setEdges((eds) =>
      eds.concat({
        id: `${nodeId}+${handleId}`,
        source: nodeId,
        sourceHandle: handleId,
        target: id,
        type: "reference",
      } as CustomEdgeType),
    );
  };

  return (
    <span className="inline-string">
      <span className="inline-string__quote">&quot;</span>
      {readOnly ? (
        <span className="inline-string__value">{literal}</span>
      ) : (
        <input
          type="text"
          value={literal}
          onChange={onChange}
          // Sized to what it holds: an empty String should not reserve room
          // for a sentence, and a long one should not be cut off mid-word.
          size={Math.min(Math.max(literal.length + 1, 4), 18)}
          className="object-node__attribute-value inline-string__input nodrag"
        />
      )}
      <span className="inline-string__quote">&quot;</span>
    </span>
  );
}

export default InlineString;
