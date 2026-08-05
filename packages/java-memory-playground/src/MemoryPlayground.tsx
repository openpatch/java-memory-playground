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
import { RFState } from "./store";
import useStore, { StoreProvider } from "./storeContext";
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
   * Called with the full memory whenever the user saves. The web component
   * wrapper uses this to dispatch its `change` event.
   */
  onChange?: (memory: Memory) => void;
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
    loadMemory(
      options ? { ...base, options: { ...base.options, ...options } } : base,
    );
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
