import MemoryPlayground, {
  MemoryPlaygroundEditor,
} from "./MemoryPlayground";

export { MemoryPlayground, MemoryPlaygroundEditor };
export type { MemoryPlaygroundProps } from "./MemoryPlayground";

export { MemoryView } from "./MemoryView";
export { ConfigView } from "./ConfigView";
export { KeyboardShortcuts, defaultKeyBindings } from "./KeyboardShortcuts";
export { InlineString } from "./InlineString";
export { StepBar } from "./StepBar";
export { diffSteps, emptyDiff } from "./stepDiff";
export { canonicalRoots, checkAgainst } from "./canonical";
export type { ExerciseResult } from "./canonical";
export { ClassSource } from "./ClassSource";
export { ConfirmDialog } from "./ConfirmDialog";
export { parseJavaClasses, toJavaSource } from "./javaSource";
export type { ParsedClasses } from "./javaSource";
export { klassImpact, hasImpact } from "./klassImpact";
export type { KlassImpact } from "./klassImpact";
export { optionPresets } from "./presets";
export type { PresetName } from "./presets";
export { captureDiagram, downloadAllSteps } from "./exportSteps";
export type { StepDiff } from "./stepDiff";

export {
  createMemoryStore,
  setPersistence,
  isPersistenceEnabled,
} from "./store";
export type {
  RFState,
  Route,
  PlaygroundMode,
  MemoryStore,
  StoreStep,
  GcPredictionResult,
} from "./store";
export {
  useStore,
  useMemoryStore,
  useTemporalStore,
  StoreProvider,
} from "./storeContext";
export { useUndoRedo } from "./useUndoRedo";

export {
  translations,
  getTranslations,
  getLanguage,
  detectBrowserLanguage,
} from "./translations";
export type { Translations } from "./translations";

export { parseMemory } from "./helper";
export { getEdgesAndNodes, getMemory } from "./getEdgesAndNodes";
export { serializeState, deserializeState } from "./serde";
export {
  initialMemory,
  defaultValueFor,
  primitveDataTypes,
  numericDataTypes,
  builtInDataTypes,
  STRING_KLASS,
} from "./memory";
export type {
  Memory,
  Step,
  Obj,
  Variable,
  MethodCall,
  Klass,
  Attribute,
  DataType,
} from "./memory";
export type { KeyBinding, KeyBindings } from "./types";
