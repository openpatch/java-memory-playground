import { useCallback, useState } from "react";
import { Memory } from "./memory";
import { useDnDPosition, useDnD, OnDropAction } from "./useDnD";
import useStore from "./storeContext";

interface DragGhostProps {
  type: string | null;
}

// The DragGhost component is used to display a ghost node when dragging a node into the flow.
export function DragGhost({ type }: DragGhostProps) {
  const { position } = useDnDPosition();
  const t = useStore((state) => state.getTranslations());

  if (!position) return null;

  let className = "sidebar-class";
  let label = type === "Array" ? t.newArray : t.newInstanceOf(type ?? "");

  if (type === "method-call") {
    className = "sidebar-method-call";
    label = t.callMethod;
  } else if (type === "variable") {
    className = "sidebar-variable";
    label = t.declareGlobalVariable;
  }


  return (
    <div
      className={`dndnode ghostnode ${className}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px) translate(-50%, -50%)`,
      }}
    >
      {label}
    </div>
  );
}

export const Sidebar = ({
  klasses,
  options,
  onNodeDrop,
}: {
  klasses: Memory["klasses"];
  options: Memory["options"];
  onNodeDrop: (nodeType: string, offsetX: number, offsetY: number) => void;
}) => {
  const { onDragStart, isDragging } = useDnD();
  const t = useStore((state) => state.getTranslations());
  // The type of the node that is being dragged.
  const [type, setType] = useState<string | null>(null);

  const makeOnDropAction = useCallback(
    (type: string): OnDropAction => ({ position }) => {
      onNodeDrop(type, position.x, position.y);
    },
    [onNodeDrop]
  );

  return (
    <>
      {isDragging && <DragGhost type={type} />}
      <aside className="sidebar">
        {Object.entries(klasses).map(([name]) => (
          <div
            key={name}
            className="dndnode sidebar-class"
            onPointerDown={(event) => {
              setType(name);
              onDragStart(event, makeOnDropAction(name));
            }}
          >
            {t.newInstanceOf(name)}
          </div>
        ))}
        {!options.hideNewArray && (
          <div
            className="dndnode sidebar-class"
            onPointerDown={(event) => {
              setType('Array');
              onDragStart(event, makeOnDropAction('Array'));
            }}
          >
            {t.newArray}
          </div>
        )}
        {!options.hideDeclareGlobalVariable && (
          <div
            className="sidebar-variable"
            onPointerDown={(event) => {
              setType('variable');
              onDragStart(event, makeOnDropAction('variable'));
            }}
          >
            {t.declareGlobalVariable}
          </div>
        )}
        {!options.hideCallMethod && (
          <div
            className="sidebar-method-call"
            onPointerDown={(event) => {
              setType('method-call');
              onDragStart(event, makeOnDropAction('method-call'));
            }}
          >
            {t.callMethod}
          </div>
        )}
      </aside>
    </>
  );
};
