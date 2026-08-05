import "@xyflow/react/dist/style.css";
import "./index.css";
import { ReactFlowProvider } from "@xyflow/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { shallow } from "zustand/shallow";

import { ConfigView } from "./ConfigView";
import { MemoryView } from "./MemoryView";
import { parseMemory } from "./helper";
import { Memory } from "./memory";
import { RFState } from "./store";
import useStore, { StoreProvider } from "./storeContext";
import { DnDProvider } from "./useDnD";

export interface MemoryPlaygroundProps {
  /**
   * The diagram to show, either as a `Memory` object or as a JSON string.
   * Omit it to keep whatever the store already holds — the standalone app
   * restores that from the URL.
   */
  memory?: string | Memory;
  /**
   * Overrides for `memory.options`, applied on top of the options that come
   * with `memory`. Handy for hiding the sidebar or the garbage collector
   * without rewriting the whole diagram.
   */
  options?: Partial<Memory["options"]>;
  /**
   * Mirror the diagram into `location.hash`. Defaults to the value set through
   * `setPersistence`, which is off unless a host opts in.
   */
  persistence?: boolean;
  /**
   * Called with the full memory whenever the user saves. The web component
   * wrapper uses this to dispatch its `change` event.
   */
  onChange?: (memory: Memory) => void;
}

const selector = (state: RFState) => ({
  route: state.route,
  memory: state.memory,
  updateMemory: state.updateMemory,
});

function Playground({ memory, options, onChange }: MemoryPlaygroundProps) {
  const {
    route,
    memory: currentMemory,
    updateMemory,
  } = useStore(selector, shallow);
  // MemoryView copies the memory into local React Flow state on mount, so a new
  // diagram needs a fresh instance rather than a prop update.
  const [loadCount, setLoadCount] = useState(0);
  const loadedFromProps = useRef<Memory | null>(null);
  const hasMounted = useRef(false);

  // Serialized so that a host passing an inline object literal does not reload
  // the diagram — and throw away the user's edits — on every render.
  const memoryKey = useMemo(
    () =>
      typeof memory === "string" ? memory : JSON.stringify(memory ?? null),
    [memory],
  );
  const optionsKey = useMemo(() => JSON.stringify(options ?? null), [options]);

  useEffect(() => {
    const parsed = parseMemory(memory);
    if (!parsed && !options) return;

    const base = parsed ?? currentMemory;
    const merged: Memory = options
      ? { ...base, options: { ...base.options, ...options } }
      : base;

    loadedFromProps.current = merged;
    updateMemory(merged);
    setLoadCount((c) => c + 1);
    // currentMemory is deliberately not a dependency: this effect loads the
    // diagram from the props, it must not re-run on the user's own edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoryKey, optionsKey, updateMemory]);

  useEffect(() => {
    // Mounting is not a change. Without this the host would receive an event
    // carrying the default diagram before its own `memory` was even applied.
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    // Do not echo a prop back to the host as if the user had changed it.
    if (loadedFromProps.current === currentMemory) return;

    onChange?.(currentMemory);
  }, [currentMemory, onChange]);

  return (
    <div className="java-memory-playground">
      <DnDProvider>
        {route === "view" && <MemoryView key={loadCount} />}
        {route === "config" && <ConfigView />}
      </DnDProvider>
    </div>
  );
}

/**
 * A self-contained Java memory playground.
 *
 * Every instance gets its own store and React Flow provider, so a page can host
 * several playgrounds side by side without them sharing state.
 */
export function MemoryPlayground({
  persistence,
  ...props
}: MemoryPlaygroundProps) {
  return (
    <StoreProvider persistence={persistence}>
      <ReactFlowProvider>
        <Playground {...props} />
      </ReactFlowProvider>
    </StoreProvider>
  );
}

export default MemoryPlayground;
