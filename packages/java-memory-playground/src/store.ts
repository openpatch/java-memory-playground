import { applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
import type { EdgeChange, NodeChange, Viewport } from "@xyflow/react";
import isDeepEqual from "fast-deep-equal";
import { throttle } from "throttle-debounce";
import { temporal } from "zundo";
import { persist, StateStorage, createJSONStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import { ExerciseResult, checkAgainst } from "./canonical";
import { getEdgesAndNodes, getMemory } from "./getEdgesAndNodes";
import { parseMemory, stepsOf } from "./helper";
import { Memory, Step, initialMemory } from "./memory";
import { deserializeState, serializeState } from "./serde";
import {
  Translations,
  detectBrowserLanguage,
  getTranslations,
  translations,
} from "./translations";
import { CustomEdgeType, CustomNodeType } from "./types";
import { isConnectedToMethodCall, isConnectedToVariable } from "./utils";

export type Route = "view" | "config";

/**
 * Who the playground is for.
 *
 * `view` is the student's playground: the whole diagram, every edit, steps to
 * walk through. `edit` adds the teacher's tools on top — configuring classes
 * and options, and authoring the steps of a trace.
 */
export type PlaygroundMode = "view" | "edit";

/** One step, in the shape React Flow wants. */
export type StoreStep = {
  label?: string;
  note?: string;
  exercise?: boolean;
  nodes: CustomNodeType[];
  edges: CustomEdgeType[];
};

export type GcPredictionResult = {
  /** Unreachable objects the prediction found. */
  found: number;
  /** Unreachable objects it missed. */
  missed: number;
  /** Objects it marked that are still reachable. */
  wrong: number;
};

type Updater<T> = T[] | ((current: T[]) => T[]);

export type RFState = {
  route: Route;
  mode: PlaygroundMode;
  selectedNodeId: string;
  /** Whether this store mirrors its memory into `location.hash`. */
  persistence: boolean;

  // Core data. The diagram lives here rather than in React Flow's local state,
  // so it survives switching to the config view and is never silently lost.
  //
  // A diagram is a sequence of steps; `currentStep` is the one on screen and
  // the one every edit applies to.
  steps: StoreStep[];
  currentStep: number;
  klasses: Memory["klasses"];
  options: Memory["options"];
  viewport: Viewport;

  /**
   * The authored contents of the exercise steps, kept aside in a student's
   * playground so that their attempt can be compared with it.
   */
  solutions: Record<number, StoreStep>;
  exerciseResult: ExerciseResult | null;

  /** Ids of the objects a prediction has marked as unreachable, while running. */
  gcPrediction: string[] | null;
  gcResult: GcPredictionResult | null;

  defaultLanguage?: string;
  /**
   * Bumped every time the user presses Save. The diagram itself is kept in the
   * store continuously; this is what tells a host "the user committed".
   */
  saveCount: number;

  // Actions
  save: () => void;
  goToStep: (index: number) => void;
  addStep: () => void;
  deleteStep: (index: number) => void;
  setStepLabel: (index: number, label: string) => void;
  /** The nodes and edges of the step on screen. */
  getNodes: () => CustomNodeType[];
  getEdges: () => CustomEdgeType[];
  /** Reconciles every step's objects with a new set of class definitions. */
  applyKlasses: (
    klasses: Memory["klasses"],
    options: Memory["options"],
  ) => void;
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

  // Exercises
  setStepExercise: (index: number, exercise: boolean) => void;
  checkExercise: () => void;
  revealSolution: () => void;
  clearExerciseResult: () => void;

  // Garbage collection
  startGcPrediction: () => void;
  toggleGcPrediction: (id: string) => void;
  cancelGcPrediction: () => void;
  /** Checks a prediction if one is running, then collects. */
  collectGarbage: () => void;

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

const toStoreStep = (step: Step): StoreStep => ({
  label: step.label,
  note: step.note,
  exercise: step.exercise,
  ...getEdgesAndNodes(step),
});

const copyStep = (step: StoreStep): StoreStep => ({
  nodes: step.nodes.map((n) => ({ ...n, data: { ...n.data } }) as CustomNodeType),
  edges: step.edges.map((e) => ({ ...e })),
});

/**
 * In a student's playground an exercise step is not shown — it is the answer.
 * The student starts from the step before it and builds the next one, so the
 * authored contents move aside and the step begins as a copy of its predecessor.
 */
const withExercisesHidden = (steps: StoreStep[]) => {
  const solutions: Record<number, StoreStep> = {};
  const working = steps.map((step, i) => {
    if (!step.exercise || i === 0) return step;
    solutions[i] = step;
    return { ...copyStep(steps[i - 1]), label: step.label, exercise: true };
  });
  return { steps: working, solutions };
};

const initialSteps: StoreStep[] = [toStoreStep(initialMemory as Step)];

/** Replaces the step at `index`, leaving the rest of the story alone. */
const withStep = (
  steps: StoreStep[],
  index: number,
  update: (step: StoreStep) => StoreStep,
): StoreStep[] =>
  steps.map((step, i) => (i === index ? update(step) : step));

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
export const createMemoryStore = (
  persistence: boolean = defaultPersistence,
  mode: PlaygroundMode = "view",
) => {
  const store = createStore<RFState>()(
    persist(
      temporal(
        (set, get) => ({
          route: "view" as Route,
          mode,
          selectedNodeId: "",
          persistence,

          steps: initialSteps,
          currentStep: 0,
          klasses: initialMemory.klasses,
          options: initialMemory.options,
          viewport: initialMemory.viewport,
          saveCount: 0,
          solutions: {},
          exerciseResult: null,
          gcPrediction: null,
          gcResult: null,

          save: () => set({ saveCount: get().saveCount + 1 }),

          getNodes: () => get().steps[get().currentStep]?.nodes ?? [],
          getEdges: () => get().steps[get().currentStep]?.edges ?? [],

          goToStep: (index) =>
            set({
              currentStep: Math.min(
                Math.max(index, 0),
                get().steps.length - 1,
              ),
            }),

          addStep: () => {
            const { steps, currentStep } = get();
            // A new step starts as a copy of the one on screen: a trace is
            // authored by duplicating and then changing what the next line did.
            const source = steps[currentStep];
            const copy: StoreStep = {
              nodes: source.nodes.map(
                (n) => ({ ...n, data: { ...n.data } }) as CustomNodeType,
              ),
              edges: source.edges.map((e) => ({ ...e })),
            };
            set({
              steps: [
                ...steps.slice(0, currentStep + 1),
                copy,
                ...steps.slice(currentStep + 1),
              ],
              currentStep: currentStep + 1,
            });
          },

          deleteStep: (index) => {
            const { steps, currentStep } = get();
            // A diagram always has at least one step to show.
            if (steps.length <= 1) return;
            const next = steps.filter((_, i) => i !== index);
            set({
              steps: next,
              currentStep: Math.min(currentStep, next.length - 1),
            });
          },

          setStepLabel: (index, label) =>
            set({
              steps: withStep(get().steps, index, (step) => ({
                ...step,
                label: label || undefined,
              })),
            }),
          // Configuration belongs to the teacher, so a student's playground
          // cannot be routed into it, by a shortcut or otherwise.
          setRoute: (route) =>
            set({
              route: route === "config" && get().mode !== "edit" ? "view" : route,
            }),
          selectNodeId: (selectedNodeId) => set({ selectedNodeId }),
          setDefaultLanguage: (defaultLanguage) => set({ defaultLanguage }),

          onNodesChange: (changes) => {
            const { steps, currentStep } = get();
            const moves = new Map(
              changes
                .filter((c) => c.type === "position" && c.position)
                .map((c: any) => [c.id, c.position]),
            );

            set({
              steps: steps.map((step, i) => {
                if (i === currentStep) {
                  return {
                    ...step,
                    nodes: applyNodeChanges(changes, step.nodes),
                  };
                }
                // Layout is a property of the diagram, not of one moment in it:
                // dragging a node moves it in every step it appears in, so the
                // picture does not jump around while scrubbing.
                if (moves.size === 0) return step;
                return {
                  ...step,
                  nodes: step.nodes.map((n) =>
                    moves.has(n.id)
                      ? { ...n, position: moves.get(n.id)! }
                      : n,
                  ),
                };
              }),
            });
          },

          onEdgesChange: (changes) =>
            set({
              steps: withStep(get().steps, get().currentStep, (step) => ({
                ...step,
                edges: applyEdgeChanges(changes, step.edges),
              })),
            }),

          // The updater form keeps the call sites identical to React Flow's
          // useNodesState/useEdgesState that these replaced.
          setNodes: (nodes) =>
            set({
              steps: withStep(get().steps, get().currentStep, (step) => ({
                ...step,
                nodes: typeof nodes === "function" ? nodes(step.nodes) : nodes,
              })),
            }),
          setEdges: (edges) =>
            set({
              steps: withStep(get().steps, get().currentStep, (step) => ({
                ...step,
                edges: typeof edges === "function" ? edges(step.edges) : edges,
              })),
            }),

          setStepExercise: (index, exercise) =>
            set({
              steps: withStep(get().steps, index, (step) => ({
                ...step,
                exercise: exercise || undefined,
              })),
            }),

          checkExercise: () => {
            const { steps, currentStep, solutions } = get();
            const solution = solutions[currentStep];
            if (!solution) return;
            set({ exerciseResult: checkAgainst(solution, steps[currentStep]) });
          },

          revealSolution: () => {
            const { currentStep, solutions } = get();
            const solution = solutions[currentStep];
            if (!solution) return;
            set({
              steps: withStep(get().steps, currentStep, (step) => ({
                ...copyStep(solution),
                label: step.label,
                exercise: true,
              })),
              exerciseResult: null,
            });
          },

          clearExerciseResult: () => set({ exerciseResult: null }),

          startGcPrediction: () => set({ gcPrediction: [], gcResult: null }),

          toggleGcPrediction: (id) => {
            const marked = get().gcPrediction;
            if (!marked) return;
            set({
              gcPrediction: marked.includes(id)
                ? marked.filter((m) => m !== id)
                : [...marked, id],
            });
          },

          cancelGcPrediction: () => set({ gcPrediction: null, gcResult: null }),

          collectGarbage: () => {
            const { steps, currentStep, gcPrediction } = get();
            const { nodes, edges } = steps[currentStep];

            const unreachable = nodes
              .filter(
                (n) =>
                  n.type === "object" &&
                  !isConnectedToVariable(n.id, nodes, edges) &&
                  !isConnectedToMethodCall(n.id, nodes, edges),
              )
              .map((n) => n.id);

            // Scoring happens before the sweep, while there is still something
            // to have been wrong about.
            const gcResult = gcPrediction
              ? {
                  found: gcPrediction.filter((id) => unreachable.includes(id))
                    .length,
                  missed: unreachable.filter(
                    (id) => !gcPrediction.includes(id),
                  ).length,
                  wrong: gcPrediction.filter((id) => !unreachable.includes(id))
                    .length,
                }
              : null;

            const collected = new Set(unreachable);
            set({
              gcPrediction: null,
              gcResult,
              steps: withStep(steps, currentStep, (step) => ({
                ...step,
                nodes: step.nodes.filter((n) => !collected.has(n.id)),
                edges: step.edges.filter(
                  (e) => !collected.has(e.target) && !collected.has(e.source),
                ),
              })),
            });
          },

          setKlasses: (klasses) => set({ klasses }),
          setOptions: (options) => set({ options }),
          setViewport: (viewport) => set({ viewport }),

          loadMemory: (memory) => {
            // Through stepsOf, so that a caller may hand over a diagram in
            // either shape — a one-step diagram still has no `steps` key.
            const loaded = stepsOf(memory).map(toStoreStep);
            const all = loaded.length > 0 ? loaded : initialSteps;
            const { steps, solutions } =
              get().mode === "edit"
                ? { steps: all, solutions: {} }
                : withExercisesHidden(all);

            set({
              steps,
              solutions,
              exerciseResult: null,
              gcPrediction: null,
              gcResult: null,
              currentStep: 0,
              klasses: memory.klasses,
              options: memory.options,
              viewport: memory.viewport,
            });
          },

          getMemory: () => {
            const state = get();
            // An exercise is written back as the teacher authored it, so that
            // saving from a student's playground shares the exercise rather
            // than whatever they had built when they pressed the button.
            const steps = state.steps.map((s, i) => state.solutions[i] ?? s).map((step) => ({
              ...(step.label ? { label: step.label } : {}),
              ...(step.note ? { note: step.note } : {}),
              ...(step.exercise ? { exercise: true } : {}),
              ...getMemory(step.edges, step.nodes),
            }));

            // A one-step diagram is written in the shape it has always had, so
            // a link to a single picture stays readable by older versions.
            if (steps.length === 1) {
              return {
                viewport: state.viewport,
                options: state.options,
                klasses: state.klasses,
                ...steps[0],
              } as Memory;
            }

            return {
              viewport: state.viewport,
              options: state.options,
              klasses: state.klasses,
              steps,
            } as Memory;
          },

          applyKlasses: (klasses, options) => {
            // A class definition belongs to the whole diagram, so adding or
            // removing an attribute has to reach every step's objects.
            const reconcile = (node: CustomNodeType): CustomNodeType => {
              if (node.type !== "object") return node;
              const definition = klasses[node.data.klass];
              if (!definition) return node;

              const names = Object.keys(definition.attributes);
              const attributes = { ...node.data.attributes };
              names.forEach((name) => {
                if (!attributes[name]) {
                  attributes[name] = {
                    dataType: definition.attributes[name],
                    value: undefined,
                  };
                }
              });
              Object.keys(attributes).forEach((name) => {
                if (!names.includes(name)) delete attributes[name];
              });
              return { ...node, data: { ...node.data, attributes } };
            };

            set({
              klasses,
              options,
              steps: get().steps.map((step) => {
                const nodes = step.nodes.map(reconcile);
                const byId = new Map(nodes.map((node) => [node.id, node]));

                // A reference lives on the edge rather than in the attribute,
                // so a field that is gone has to take its edge with it —
                // otherwise the reference survives with nothing to draw it
                // from and comes back if the field ever returns.
                const edges = step.edges.filter((edge) => {
                  const source = byId.get(edge.source);
                  if (!source || source.type !== "object") return true;
                  if (!edge.sourceHandle) return true;
                  // An unknown class keeps its objects as they were, and an
                  // array's slots are not attributes of a class.
                  if (!klasses[source.data.klass]) return true;
                  return edge.sourceHandle in source.data.attributes;
                });

                return { ...step, nodes, edges };
              }),
            });
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
            steps: state.steps.map((step) => ({
              label: step.label,
              note: step.note,
              nodes: step.nodes.map(undoableNode),
              edges: step.edges,
            })),
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

          const steps = stepsOf(memory).map(toStoreStep);
          return {
            ...current,
            steps: steps.length > 0 ? steps : current.steps,
            currentStep: 0,
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
