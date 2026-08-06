import { createContext, ReactNode, useContext, useRef } from "react";
import type { TemporalState } from "zundo";
import { useStore as useZustandStore } from "zustand";

import {
  createMemoryStore,
  MemoryStore,
  PlaygroundMode,
  RFState,
} from "./store";

const StoreContext = createContext<MemoryStore | null>(null);

export const StoreProvider = ({
  persistence,
  mode,
  children,
}: {
  persistence?: boolean;
  mode?: PlaygroundMode;
  children: ReactNode;
}) => {
  // Created once per mounted playground, never shared between instances.
  const storeRef = useRef<MemoryStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = createMemoryStore(persistence, mode);
  }

  return (
    <StoreContext.Provider value={storeRef.current}>
      {children}
    </StoreContext.Provider>
  );
};

/**
 * Reads from the store of the surrounding `MemoryPlayground`.
 *
 * For a selector that builds an object, wrap it in zustand's `useShallow` so
 * the component only re-renders when one of the picked values actually changes.
 */
export function useStore<U>(selector: (state: RFState) => U): U {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error("useStore has to be used inside a MemoryPlayground");
  }
  return useZustandStore(store, selector);
}

/** The raw store instance, for reading or subscribing outside of React. */
export function useMemoryStore(): MemoryStore {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error("useMemoryStore has to be used inside a MemoryPlayground");
  }
  return store;
}

/**
 * Reads the undo/redo history of the surrounding `MemoryPlayground`.
 *
 * `undo`, `redo`, `pastStates` and `futureStates` come from zundo.
 */
export function useTemporalStore<U>(
  selector: (state: TemporalState<Partial<RFState>>) => U,
): U {
  const store = useMemoryStore();
  return useZustandStore(store.temporal, selector);
}

export default useStore;
