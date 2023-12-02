import { persist, createJSONStorage } from "zustand/middleware";

import { Memory, initialMemory } from "./memory";
import { createWithEqualityFn } from "zustand/traditional";

export type RFState = {
  route: string;
  selectedNodeId: string;
  memory: Memory;
  setRoute: (route: string) => void;
  updateMemory: (memory: Memory) => void;
  selectNodeId: (nodeId: string) => void;
};

/**
const hashStorage: StateStorage = {
  getItem: (_): string => {
    return deserializeState(location.hash.slice(1));
  },
  setItem: (_, newValue): void => {
    location.hash = serializeState(newValue);
  },
  removeItem: (_): void => {
    location.hash = "";
  },
};
*/

// this is our useStore hook that we can use in our components to get parts of the store and call actions
const useStore = createWithEqualityFn(
  persist<RFState>(
    (set) => ({
      route: "view",
      setRoute: (route: string) => {
        set({
          route,
        });
      },
      selectedNodeId: "",
      selectNodeId: (nodeId: string) => {
        set({
          selectedNodeId: nodeId,
        });
      },
      memory: initialMemory,
      updateMemory: (memory: Memory) => {
        set({
          memory: memory,
        });
      },
    }),
    {
      name: "pako",
      storage: createJSONStorage(() => localStorage),
      partialize: (state): any => ({
        memory: state.memory,
      }),
    },
  ),
);

export default useStore;
