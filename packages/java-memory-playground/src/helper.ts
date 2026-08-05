import { Memory, initialMemory } from "./memory";

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
export const parseMemory = (
  memory?: string | Memory | null,
): Memory | null => {
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
    objects: m.objects ?? {},
    variables: m.variables ?? {},
    methodCalls: m.methodCalls ?? {},
  };
};
