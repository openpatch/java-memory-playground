import { Memory } from "./memory";
import { useDraggable } from "@neodrag/react";
import { useRef } from "react";

interface DraggableNodeProps {
  className: string;
  children: React.ReactNode;
  nodeType: string;
  onDrop: (nodeType: string, offsetX: number, offsetY: number) => void;
}

function DraggableNode({ className, children, nodeType, onDrop }: DraggableNodeProps) {
  const draggableRef = useRef<HTMLDivElement>(null);

  useDraggable(draggableRef, {
    onDragEnd: (data) => {
      onDrop(nodeType, data.offsetX, data.offsetY);
    },
  });

  return (
    <div ref={draggableRef} className={className} style={{ cursor: 'grab' }}>
      {children}
    </div>
  );
}

export const Sidebar = ({
  memory,
  onNodeDrop,
}: {
  memory: Memory;
  onNodeDrop: (nodeType: string, offsetX: number, offsetY: number) => void;
}) => {
  return (
    <div className="sidebar">
      {Object.entries(memory.klasses).map(([name]) => (
        <DraggableNode
          key={name}
          className="sidebar-class"
          nodeType={name}
          onDrop={onNodeDrop}
        >
          new {name}
        </DraggableNode>
      ))}
      {!memory.options.hideNewArray && (
        <DraggableNode
          className="sidebar-class"
          nodeType="Array"
          onDrop={onNodeDrop}
        >
          new Array
        </DraggableNode>
      )}
      {!memory.options.hideDeclareGlobalVariable && (
        <DraggableNode
          className="sidebar-variable"
          nodeType="variable"
          onDrop={onNodeDrop}
        >
          Declare Global Variable
        </DraggableNode>
      )}
      {!memory.options.hideCallMethod && (
        <DraggableNode
          className="sidebar-method-call"
          nodeType="method-call"
          onDrop={onNodeDrop}
        >
          Call Method
        </DraggableNode>
      )}
    </div>
  );
};
