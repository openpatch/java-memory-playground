import { persist, StateStorage, createJSONStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import { deserializeState, serializeState } from "./serde";
import { Memory, initialMemory } from "./memory";

export type Route = "view" | "config";

export type RFState = {
  route: Route;
  selectedNodeId: string;
  memory: Memory;
  /** Whether this store mirrors its memory into `location.hash`. */
  persistence: boolean;
  setRoute: (route: Route) => void;
  updateMemory: (memory: Memory) => void;
  selectNodeId: (nodeId: string) => void;
};

// Persisting to `location.hash` is right for the standalone app but wrong for an
// embedded playground, which must not take over the URL of its host page. Hosts
// opt in once, before the first playground mounts.
let defaultPersistence = false;

/**
 * Set whether playgrounds created from now on mirror their state into
 * `location.hash`. Off by default; the standalone web app turns it on during
 * bootstrap. Embedded usages (React hosts, the web component) leave it off and
 * drive state through the `memory` prop and the `change` event instead.
 */
export function setPersistence(enabled: boolean) {
  defaultPersistence = enabled;
}

/** The persistence setting new playgrounds are created with. */
export function isPersistenceEnabled() {
  return defaultPersistence;
}

const createHashStorage = (enabled: boolean): StateStorage => ({
  getItem: (_): string | null => {
    if (!enabled) return null;
    try {
      return deserializeState(location.hash.slice(1));
    } catch (e) {
      // A truncated or hand-edited hash must not take down the whole app.
      console.warn("Could not restore state from URL", e);
      return null;
    }
  },
  setItem: (_, newValue): void => {
    if (!enabled) return;
    location.hash = serializeState(newValue);
  },
  removeItem: (_): void => {
    if (!enabled) return;
    location.hash = "";
  },
});

/**
 * Creates an independent playground store.
 *
 * One store per `MemoryPlayground` instance, so that a page can host several
 * playgrounds without them overwriting each other's diagrams.
 */
export const createMemoryStore = (persistence: boolean = defaultPersistence) => {
  const store = createStore<RFState>()(
    persist(
      (set) => ({
        route: "view",
        setRoute: (route: Route) => {
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
        persistence,
        updateMemory: (memory: Memory) => {
          set({
            memory: memory,
          });
        },
      }),
      {
        name: "pako",
        storage: createJSONStorage(() => createHashStorage(persistence)),
        // Hydration is explicit so that a non-persisting store never touches
        // the URL, not even to read it.
        skipHydration: true,
        partialize: (state): any => ({
          memory: state.memory,
        }),
      },
    ),
  );

  if (persistence) {
    store.persist.rehydrate();
  }

  return store;
};

export type MemoryStore = ReturnType<typeof createMemoryStore>;
