import { createContext, ReactNode, useContext, useRef } from "react";
import { useStoreWithEqualityFn } from "zustand/traditional";

import { createMemoryStore, MemoryStore, RFState } from "./store";

const StoreContext = createContext<MemoryStore | null>(null);

export const StoreProvider = ({
  persistence,
  children,
}: {
  persistence?: boolean;
  children: ReactNode;
}) => {
  // Created once per mounted playground, never shared between instances.
  const storeRef = useRef<MemoryStore>();
  if (!storeRef.current) {
    storeRef.current = createMemoryStore(persistence);
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
 * Mirrors the zustand hook API: pass a selector and an optional equality
 * function.
 */
export function useStore<U>(
  selector: (state: RFState) => U,
  equalityFn?: (a: U, b: U) => boolean,
): U {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error("useStore has to be used inside a MemoryPlayground");
  }
  return useStoreWithEqualityFn(store, selector, equalityFn);
}

/** The raw store instance, for reading or subscribing outside of React. */
export function useMemoryStore(): MemoryStore {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error("useMemoryStore has to be used inside a MemoryPlayground");
  }
  return store;
}

export default useStore;
