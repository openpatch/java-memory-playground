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

  let className = "sidebar-item sidebar-class";
  let label = type === "Array" ? t.newArray : t.newInstanceOf(type ?? "");

  if (type === "method-call") {
    className = "sidebar-item sidebar-method-call";
    label = t.callMethod;
  } else if (type === "variable") {
    className = "sidebar-item sidebar-variable";
    label = t.declareGlobalVariable;
  }


  return (
    <div
      className={`dndnode ghostnode ${className}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px) translate(-50%, -50%)`,
      }}
    >
      <span className="sidebar-item__swatch" aria-hidden="true" />
      {label}
    </div>
  );
}

/** One thing to drag onto the canvas, with a swatch of the box it makes. */
const PaletteItem = ({
  kind,
  label,
  onPointerDown,
}: {
  kind: "class" | "variable" | "method-call";
  label: string;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
}) => (
  <div
    className={`dndnode sidebar-item sidebar-${kind}`}
    onPointerDown={onPointerDown}
    title={label}
  >
    <span className="sidebar-item__swatch" aria-hidden="true" />
    <span className="sidebar-item__label">{label}</span>
  </div>
);

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

  const start =
    (type: string) => (event: React.PointerEvent<HTMLDivElement>) => {
      setType(type);
      onDragStart(event, makeOnDropAction(type));
    };

  // Heap first, then the roots that point into it: the order a diagram is
  // usually built in, and the order the three colours appear on the canvas.
  return (
    <>
      {isDragging && <DragGhost type={type} />}
      <aside className="sidebar jmp-panel" aria-label={t.paletteHeading}>
        <div className="jmp-panel__heading">{t.paletteHeading}</div>
        {Object.keys(klasses).map((name) => (
          <PaletteItem
            key={name}
            kind="class"
            label={t.newInstanceOf(name)}
            onPointerDown={start(name)}
          />
        ))}
        {!options.hideNewArray && (
          <PaletteItem kind="class" label={t.newArray} onPointerDown={start("Array")} />
        )}
        {!options.hideDeclareGlobalVariable && (
          <PaletteItem
            kind="variable"
            label={t.declareGlobalVariable}
            onPointerDown={start("variable")}
          />
        )}
        {!options.hideCallMethod && (
          <PaletteItem
            kind="method-call"
            label={t.callMethod}
            onPointerDown={start("method-call")}
          />
        )}
      </aside>
    </>
  );
};
