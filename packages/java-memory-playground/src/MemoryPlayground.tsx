import "@xyflow/react/dist/style.css";
import "./index.css";
import { ReactFlowProvider } from "@xyflow/react";
import { useEffect, useMemo, useRef } from "react";
import { useShallow } from "zustand/shallow";

import { ConfigView } from "./ConfigView";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { MemoryView } from "./MemoryView";
import { parseMemory } from "./helper";
import { Memory } from "./memory";
import { PlaygroundMode, RFState } from "./store";
import useStore, { StoreProvider, useMemoryStore } from "./storeContext";
import { KeyBindings } from "./types";
import { DnDProvider } from "./useDnD";

export interface MemoryPlaygroundProps {
  /**
   * The diagram to show, either as a `Memory` object or as a JSON string.
   * Omit it to keep whatever the store already holds — the standalone app
   * restores that from the URL.
   */
  memory?: string | Memory;
  /**
   * Overrides for the diagram options, applied on top of the options that come
   * with `memory`. Handy for hiding the sidebar or the garbage collector
   * without rewriting the whole diagram.
   */
  options?: Partial<Memory["options"]>;
  /**
   * UI language: `"en"`, `"de"`, or `"auto"` to follow the browser. Defaults to
   * the browser language.
   */
  language?: string;
  /**
   * Mirror the diagram into `location.hash`. Defaults to the value set through
   * `setPersistence`, which is off unless a host opts in.
   */
  persistence?: boolean;
  /** Overrides for the default keyboard shortcuts. */
  keyBindings?: Partial<KeyBindings>;
  /**
   * The step to show, zero based. Set it to drive the diagram from the page
   * around it — prose can walk a reader through a trace.
   */
  step?: number;
  /** Called with the step index whenever the shown step changes. */
  onStepChange?: (step: number) => void;
  /**
   * Who this playground is for. `view`, the default, is the student's: the whole
   * diagram and every edit, but no class configuration and no step authoring.
   * `edit` adds those. Prefer the `MemoryPlaygroundEditor` component, which is
   * this with `mode` already set.
   */
  mode?: PlaygroundMode;
  /**
   * Called with the full memory whenever the user saves. The web component
   * wrapper uses this to dispatch its `change` event.
   */
  onChange?: (memory: Memory) => void;
  /**
   * Called with the full memory on every edit — each drag, each value typed —
   * rather than only when the user saves.
   *
   * A host that owns the file and has a save of its own, like an editor with a
   * dirty marker, needs to hear about edits as they happen; a host that only
   * wants the finished diagram wants `onChange`. Loading a new `memory` prop is
   * not an edit, and neither is panning or zooming, though the viewport is
   * written along with the next real edit.
   */
  onEdit?: (memory: Memory) => void;
}

const selector = (state: RFState) => ({
  route: state.route,
  saveCount: state.saveCount,
  currentStep: state.currentStep,
  stepCount: state.steps.length,
  goToStep: state.goToStep,
  loadMemory: state.loadMemory,
  getMemory: state.getMemory,
  setDefaultLanguage: state.setDefaultLanguage,
});

function Playground({
  memory,
  options,
  language,
  keyBindings,
  step,
  onChange,
  onEdit,
  onStepChange,
}: MemoryPlaygroundProps) {
  const {
    route,
    saveCount,
    currentStep,
    stepCount,
    goToStep,
    loadMemory,
    getMemory,
    setDefaultLanguage,
  } = useStore(useShallow(selector));

  const store = useMemoryStore();
  const loadingFromProps = useRef(false);
  /** The diagram as it was when `onEdit` last ran, serialized. */
  const lastReported = useRef<string | null>(null);

  // Held in a ref so that a host passing an inline arrow does not resubscribe
  // on every render.
  const onEditRef = useRef(onEdit);
  onEditRef.current = onEdit;

  useEffect(
    () =>
      store.subscribe((state, previous) => {
        if (loadingFromProps.current) return;
        // Selection, the current step and the viewport all move without the
        // diagram changing, so the cheap check comes first.
        if (
          state.steps === previous.steps &&
          state.klasses === previous.klasses &&
          state.options === previous.options
        ) {
          return;
        }

        // React Flow writes measurements back through `onNodesChange` as it
        // mounts, which replaces `steps` without changing the diagram. Only
        // what would actually be written to a file counts as an edit.
        const memory = getMemory();
        const serialized = JSON.stringify(memory);
        if (serialized === lastReported.current) return;
        lastReported.current = serialized;

        onEditRef.current?.(memory);
      }),
    [store, getMemory],
  );

  // Serialized so that a host passing an inline object literal does not reload
  // the diagram — and throw away the user's edits — on every render.
  const memoryKey = useMemo(
    () =>
      typeof memory === "string" ? memory : JSON.stringify(memory ?? null),
    [memory],
  );
  const optionsKey = useMemo(() => JSON.stringify(options ?? null), [options]);

  useEffect(() => {
    setDefaultLanguage(language ?? "auto");
  }, [language, setDefaultLanguage]);

  useEffect(() => {
    const parsed = parseMemory(memory);
    if (!parsed && !options) return;

    const base = parsed ?? getMemory();
    // Reading the diagram back out of the props is not the user editing it, and
    // `subscribe` runs inside `set`, so the flag only has to survive this call.
    loadingFromProps.current = true;
    try {
      loadMemory(
        options ? { ...base, options: { ...base.options, ...options } } : base,
      );
      // The baseline an edit is measured against, so that the normalising
      // `loadMemory` does itself is not reported back as the user's doing.
      lastReported.current = JSON.stringify(getMemory());
    } finally {
      loadingFromProps.current = false;
    }
    // getMemory is only read here, so it is not a dependency: this effect loads
    // the diagram from the props, it must not re-run on the user's own edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoryKey, optionsKey, loadMemory]);

  useEffect(() => {
    if (step === undefined) return;
    goToStep(step);
  }, [step, stepCount, goToStep]);

  const reportedStep = useRef<number | null>(null);
  useEffect(() => {
    if (reportedStep.current === currentStep) return;
    reportedStep.current = currentStep;
    onStepChange?.(currentStep);
  }, [currentStep, onStepChange]);

  useEffect(() => {
    // saveCount starts at 0 and is only ever bumped by the Save button, so this
    // fires exactly when the user commits — never on mount.
    if (saveCount === 0) return;
    onChange?.(getMemory());
    // getMemory is read at save time; it is not what triggers the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveCount, onChange]);

  return (
    <div className="java-memory-playground">
      <DnDProvider>
        <KeyboardShortcuts keyBindings={keyBindings} />
        {route === "view" && <MemoryView />}
        {route === "config" && (
          // The configuration is a form, not a canvas: it is as tall as its
          // content, so it needs to scroll where the diagram fills the frame
          // exactly. Wrapped here rather than inside `ConfigView` so the bar
          // scrolls with the form and the scrollbar sits at the frame edge.
          <div className="config-scroll">
            <ConfigView />
          </div>
        )}
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
  mode,
  ...props
}: MemoryPlaygroundProps) {
  return (
    <StoreProvider persistence={persistence} mode={mode}>
      <ReactFlowProvider>
        <Playground {...props} />
      </ReactFlowProvider>
    </StoreProvider>
  );
}

/**
 * The playground with the teacher's tools: everything a student can do, plus
 * configuring classes and options and authoring the steps of a trace.
 */
export function MemoryPlaygroundEditor(
  props: Omit<MemoryPlaygroundProps, "mode">,
) {
  return <MemoryPlayground {...props} mode="edit" />;
}

export default MemoryPlayground;
