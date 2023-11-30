import { Memory } from "./memory";

export const Sidebar = ({ memory }: { memory: Memory }) => {
  const onDragStart = (event: any, nodeType: string) => {
    event.dataTransfer.setData("application/java-memory-playground", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="sidebar">
      {Object.entries(memory.klasses).map(([name]) => (
        <div
          key={name}
          className="sidebar-class"
          onDragStart={(e) => onDragStart(e, name)}
          draggable
        >
          new {name}
        </div>
      ))}
      <div
        className="sidebar-class"
        onDragStart={(e) => onDragStart(e, "Array")}
        draggable
      >
        new Array
      </div>
      <div
        className="sidebar-variable"
        onDragStart={(e) => onDragStart(e, "variable")}
        draggable
      >
        Declare Variable
      </div>
    </div>
  );
};
