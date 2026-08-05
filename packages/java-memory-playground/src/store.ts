import { applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
import type { EdgeChange, NodeChange, Viewport } from "@xyflow/react";
import isDeepEqual from "fast-deep-equal";
import { throttle } from "throttle-debounce";
import { temporal } from "zundo";
import { persist, StateStorage, createJSONStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import { getEdgesAndNodes, getMemory } from "./getEdgesAndNodes";
import { parseMemory } from "./helper";
import { Memory, initialMemory } from "./memory";
import { deserializeState, serializeState } from "./serde";
import {
  Translations,
  detectBrowserLanguage,
  getTranslations,
  translations,
} from "./translations";
import { CustomEdgeType, CustomNodeType } from "./types";

export type Route = "view" | "config";

type Updater<T> = T[] | ((current: T[]) => T[]);

export type RFState = {
  route: Route;
  selectedNodeId: string;
  /** Whether this store mirrors its memory into `location.hash`. */
  persistence: boolean;

  // Core data. The diagram lives here rather than in React Flow's local state,
  // so it survives switching to the config view and is never silently lost.
  nodes: CustomNodeType[];
  edges: CustomEdgeType[];
  klasses: Memory["klasses"];
  options: Memory["options"];
  viewport: Viewport;

  defaultLanguage?: string;
  /**
   * Bumped every time the user presses Save. The diagram itself is kept in the
   * store continuously; this is what tells a host "the user committed".
   */
  saveCount: number;

  // Actions
  save: () => void;
  setRoute: (route: Route) => void;
  selectNodeId: (nodeId: string) => void;
  setDefaultLanguage: (language: string) => void;
  onNodesChange: (changes: NodeChange<CustomNodeType>[]) => void;
  onEdgesChange: (changes: EdgeChange<CustomEdgeType>[]) => void;
  setNodes: (nodes: Updater<CustomNodeType>) => void;
  setEdges: (edges: Updater<CustomEdgeType>) => void;
  setKlasses: (klasses: Memory["klasses"]) => void;
  setOptions: (options: Memory["options"]) => void;
  setViewport: (viewport: Viewport) => void;

  // Bulk operations
  loadMemory: (memory: Memory) => void;
  getMemory: () => Memory;

  // Computed getters
  getLanguage: () => string;
  getTranslations: () => Translations;
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

const writeHash = (hash: string) => {
  // replaceState rather than assigning `location.hash`: the diagram is now
  // written on every edit, and assigning would push a history entry per edit,
  // turning the back button into an undo with no way out.
  if (typeof history !== "undefined" && history.replaceState) {
    history.replaceState(null, "", "#" + hash);
  } else {
    location.hash = hash;
  }
};

const createHashStorage = (enabled: boolean): StateStorage => {
  // Compressing the whole diagram on every dragged pixel is wasteful, so writes
  // are throttled. The trailing call guarantees the final state still lands.
  const write = throttle(
    300,
    (value: string) => writeHash(serializeState(value)),
    { noLeading: false, noTrailing: false },
  );

  return {
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
      write(newValue);
    },
    removeItem: (_): void => {
      if (!enabled) return;
      writeHash("");
    },
  };
};

const initialNodesAndEdges = getEdgesAndNodes(initialMemory);

/**
 * Strips the fields React Flow maintains itself. What is left is the part of a
 * node the user actually authored, which is the only thing worth undoing.
 */
const undoableNode = (node: CustomNodeType) => {
  const { measured, selected, dragging, width, height, ...rest } =
    node as CustomNodeType & Record<string, unknown>;
  return rest;
};

/**
 * Creates an independent playground store.
 *
 * One store per `MemoryPlayground` instance, so that a page can host several
 * playgrounds without them overwriting each other's diagrams.
 */
export const createMemoryStore = (persistence: boolean = defaultPersistence) => {
  const store = createStore<RFState>()(
    persist(
      temporal(
        (set, get) => ({
          route: "view" as Route,
          selectedNodeId: "",
          persistence,

          nodes: initialNodesAndEdges.nodes,
          edges: initialNodesAndEdges.edges,
          klasses: initialMemory.klasses,
          options: initialMemory.options,
          viewport: initialMemory.viewport,
          saveCount: 0,

          save: () => set({ saveCount: get().saveCount + 1 }),
          setRoute: (route) => set({ route }),
          selectNodeId: (selectedNodeId) => set({ selectedNodeId }),
          setDefaultLanguage: (defaultLanguage) => set({ defaultLanguage }),

          onNodesChange: (changes) =>
            set({ nodes: applyNodeChanges(changes, get().nodes) }),
          onEdgesChange: (changes) =>
            set({ edges: applyEdgeChanges(changes, get().edges) }),

          // The updater form keeps the call sites identical to React Flow's
          // useNodesState/useEdgesState that these replaced.
          setNodes: (nodes) =>
            set({
              nodes: typeof nodes === "function" ? nodes(get().nodes) : nodes,
            }),
          setEdges: (edges) =>
            set({
              edges: typeof edges === "function" ? edges(get().edges) : edges,
            }),

          setKlasses: (klasses) => set({ klasses }),
          setOptions: (options) => set({ options }),
          setViewport: (viewport) => set({ viewport }),

          loadMemory: (memory) => {
            const { nodes, edges } = getEdgesAndNodes(memory);
            set({
              nodes,
              edges,
              klasses: memory.klasses,
              options: memory.options,
              viewport: memory.viewport,
            });
          },

          getMemory: () => {
            const state = get();
            return {
              viewport: state.viewport,
              options: state.options,
              klasses: state.klasses,
              ...getMemory(state.edges, state.nodes),
            } as Memory;
          },

          getLanguage: () => {
            const language = get().defaultLanguage;
            if (language && language !== "auto" && translations[language]) {
              return language;
            }
            return detectBrowserLanguage();
          },
          getTranslations: () => getTranslations(get().getLanguage()),
        }),
        {
          // Only the diagram itself is undoable — opening a dialog or switching
          // to the config view should not consume an undo step. React Flow's
          // own bookkeeping (measurements on mount, selection, the dragging
          // flag) is stripped too, so it neither creates history entries nor
          // gets restored on undo.
          partialize: (state: RFState) => ({
            nodes: state.nodes.map(undoableNode),
            edges: state.edges,
            klasses: state.klasses,
            options: state.options,
          }),
          equality: (a, b) => isDeepEqual(a, b),
          // Leading edge, no trailing: the first change of a drag records the
          // position the drag started from, and the pixels in between are not
          // each worth an undo step.
          handleSet: (handleSet) =>
            throttle<typeof handleSet>(
              1000,
              (state) => {
                handleSet(state);
              },
              { noLeading: false, noTrailing: true },
            ),
        },
      ),
      {
        name: "pako",
        storage: createJSONStorage(() => createHashStorage(persistence)),
        // Hydration is explicit so that a non-persisting store never touches
        // the URL, not even to read it.
        skipHydration: true,
        // The URL keeps holding a `Memory`, not the store's shape, so links
        // shared before this refactor still open.
        partialize: (state): any => ({ memory: state.getMemory() }),
        merge: (persisted, current): RFState => {
          const stored = (persisted as { memory?: Memory } | undefined)?.memory;
          // Through parseMemory, because a link may have been written by an
          // older version that left whole sections out — early diagrams have no
          // `methodCalls` at all, and reading those raw used to throw in here,
          // silently dropping the user back to the default diagram.
          const memory = parseMemory(stored);
          if (!memory) return current;

          const { nodes, edges } = getEdgesAndNodes(memory);
          return {
            ...current,
            nodes,
            edges,
            klasses: memory.klasses,
            options: memory.options,
            viewport: memory.viewport ?? current.viewport,
          };
        },
      },
    ),
  );

  if (persistence) {
    store.persist.rehydrate();
  }

  return store;
};

export type MemoryStore = ReturnType<typeof createMemoryStore>;
