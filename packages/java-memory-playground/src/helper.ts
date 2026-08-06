import {
  Attribute,
  Memory,
  Obj,
  STRING_KLASS,
  Step,
  initialMemory,
} from "./memory";

const isReference = (value: unknown): value is string =>
  typeof value === "string" && value.startsWith("@");

/**
 * Older diagrams stored String literals with the quotes included, because the
 * quotes were typed by hand into the value field. They are decoration, so they
 * are rendered rather than stored.
 */
const stripQuotes = (value: string): string => {
  const trimmed = value.trim();
  if (
    trimmed.length >= 2 &&
    trimmed.startsWith('"') &&
    trimmed.endsWith('"')
  ) {
    return trimmed.slice(1, -1);
  }
  return value;
};

/**
 * Turns String values that were stored inside their owner into real heap
 * objects.
 *
 * The playground used to treat String as a primitive, so `username` held the
 * characters directly. It is a reference type, and whether a String is drawn as
 * its own box is now a display choice (`options.inlineStrings`) rather than
 * something baked into the saved diagram. Links written before that still open:
 * their inline values are converted here, on read.
 */
const migrateInlineStrings = (step: Step): Step => {
  const objects: Step["objects"] = { ...step.objects };
  const used = new Set(Object.keys(objects));
  let counter = 0;

  const nextId = () => {
    let id: string;
    do {
      id = `@s${++counter}`;
    } while (used.has(id));
    used.add(id);
    return id;
  };

  let converted = 0;
  const convert = (
    slot: Attribute,
    near: { x: number; y: number },
  ): Attribute => {
    if (slot.dataType !== STRING_KLASS) return slot;

    const raw = slot.value;
    // An empty String field meant "nothing here yet" in the old model, which is
    // a null reference now — not an object holding the empty string.
    if (raw === undefined || raw === null || raw === "") {
      return { dataType: slot.dataType, value: undefined };
    }
    if (isReference(raw)) return slot;

    const id = nextId();
    objects[id] = {
      klass: STRING_KLASS,
      literal: stripQuotes(String(raw)),
      attributes: {},
      position: { x: near.x + 280, y: near.y + converted++ * 70 },
    };
    return { dataType: slot.dataType, value: id };
  };

  const convertAll = (
    slots: Record<string, Attribute>,
    near: { x: number; y: number },
  ) => {
    const next: Record<string, Attribute> = {};
    Object.entries(slots).forEach(([name, slot]) => {
      next[name] = convert(slot, near);
    });
    return next;
  };

  Object.entries(step.objects ?? {}).forEach(([id, obj]) => {
    if (obj.klass === STRING_KLASS) return;
    objects[id] = {
      ...obj,
      attributes: convertAll(obj.attributes ?? {}, obj.position),
    } as Obj;
  });

  const methodCalls: Step["methodCalls"] = {};
  Object.entries(step.methodCalls ?? {}).forEach(([id, call]) => {
    methodCalls[id as unknown as number] = {
      ...call,
      localVariables: convertAll(call.localVariables ?? {}, call.position),
    };
  });

  return { ...step, objects, methodCalls };
};

/**
 * The steps of a diagram, whichever shape it was saved in.
 *
 * Diagrams written before stepping existed hold a single state in the top level
 * `objects` / `variables` / `methodCalls`, which is exactly one step.
 */
export const stepsOf = (m: Partial<Memory>): Step[] => {
  const steps = Array.isArray(m.steps) ? m.steps : [];
  if (steps.length > 0) {
    return steps.map((step) => ({
      label: step?.label,
      note: step?.note,
      exercise: step?.exercise,
      objects: step?.objects ?? {},
      variables: step?.variables ?? {},
      methodCalls: step?.methodCalls ?? {},
    }));
  }

  return [
    {
      objects: m.objects ?? {},
      variables: m.variables ?? {},
      methodCalls: m.methodCalls ?? {},
    },
  ];
};

/**
 * Normalizes whatever a host hands us into a complete `Memory`.
 *
 * Accepts a JSON string (what the web component receives through an attribute)
 * or an already parsed object, and fills in every top level section so that
 * partial input — e.g. only `klasses` and `objects` — is still safe to render.
 *
 * Returns `null` when the input is absent or not parsable, so callers can fall
 * back to whatever is already in the store.
 */
export const parseMemory = (memory?: string | Memory | null): Memory | null => {
  if (memory === undefined || memory === null || memory === "") {
    return null;
  }

  let parsed: unknown = memory;
  if (typeof memory === "string") {
    try {
      parsed = JSON.parse(memory);
    } catch (e) {
      console.warn("Could not parse memory", e);
      return null;
    }
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    console.warn("Memory has to be an object");
    return null;
  }

  const m = parsed as Partial<Memory>;
  return {
    viewport: m.viewport ?? { x: 0, y: 0, zoom: 1 },
    options: { ...initialMemory.options, ...m.options },
    klasses: m.klasses ?? {},
    steps: stepsOf(m).map(migrateInlineStrings),
  };
};
