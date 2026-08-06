import { Memory } from "./memory";

export type PresetName = "references" | "stack" | "everything";

/**
 * Option sets for the stages a course goes through.
 *
 * The options already describe a teaching sequence — references before the
 * stack, arrays and the collector after — but only as flags a teacher has to
 * remember the combination of. These name the combinations.
 */
export const optionPresets: Record<PresetName, Memory["options"]> = {
  // Objects and the names that point at them. No stack yet: a named handle on
  // an object is enough to teach reference versus object.
  references: {
    hideSidebar: false,
    hideCallMethod: true,
    hideDeclareGlobalVariable: false,
    hideNewArray: true,
    disableGarbageCollector: true,
    createNewOnEdgeDrop: true,
    inlineStrings: true,
    hideSteps: true,
    hideStepChanges: false,
  },
  // Method calls arrive, so the stack does too, and with it stepping — a frame
  // pushed and popped is a thing that happens over time.
  stack: {
    hideSidebar: false,
    hideCallMethod: false,
    hideDeclareGlobalVariable: true,
    hideNewArray: true,
    disableGarbageCollector: true,
    createNewOnEdgeDrop: true,
    inlineStrings: true,
    hideSteps: false,
    hideStepChanges: false,
  },
  // Arrays, the garbage collector, and Strings as the heap objects they are.
  everything: {
    hideSidebar: false,
    hideCallMethod: false,
    hideDeclareGlobalVariable: false,
    hideNewArray: false,
    disableGarbageCollector: false,
    createNewOnEdgeDrop: true,
    inlineStrings: false,
    hideSteps: false,
    hideStepChanges: false,
  },
};
