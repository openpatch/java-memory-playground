import { Memory } from "./memory";
import { useEffect, useState } from "react";

export const Sidebar = ({
  memory,
  onTouchItemSelect,
}: {
  memory: Memory;
  onTouchItemSelect?: (nodeType: string) => void;
}) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detect touch device
    const checkTouch = () => {
      setIsTouchDevice(
        "ontouchstart" in window ||
          navigator.maxTouchPoints > 0 ||
          (navigator as any).msMaxTouchPoints > 0
      );
    };
    checkTouch();
  }, []);

  const onDragStart = (event: any, nodeType: string) => {
    event.dataTransfer.setData("application/java-memory-playground", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const onTouchStart = (nodeType: string) => {
    if (onTouchItemSelect) {
      onTouchItemSelect(nodeType);
    }
  };

  const getItemProps = (nodeType: string) => {
    if (isTouchDevice) {
      return {
        onTouchStart: (e: any) => {
          e.preventDefault();
          onTouchStart(nodeType);
        },
      };
    }
    return {
      onDragStart: (e: any) => onDragStart(e, nodeType),
      draggable: true,
    };
  };

  return (
    <div className="sidebar">
      {Object.entries(memory.klasses).map(([name]) => (
        <div key={name} className="sidebar-class" {...getItemProps(name)}>
          new {name}
        </div>
      ))}
      {!memory.options.hideNewArray && (
        <div className="sidebar-class" {...getItemProps("Array")}>
          new Array
        </div>
      )}
      {!memory.options.hideDeclareGlobalVariable && (
        <div className="sidebar-variable" {...getItemProps("variable")}>
          Declare Global Variable
        </div>
      )}
      {!memory.options.hideCallMethod && (
        <div className="sidebar-method-call" {...getItemProps("method-call")}>
          Call Method
        </div>
      )}
    </div>
  );
};
