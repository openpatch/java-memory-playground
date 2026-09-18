import { primitveDataTypes } from "./memory";
import { CustomEdgeType, CustomNodeType } from "./types";

/**
 * Assignments a reader can fire at the diagram, one at a time.
 *
 * Dragging an edge onto its target says where a reference should end up. It
 * cannot say what `neu.next = current.next` means, because that depends on
 * where `current.next` points *at the moment the line runs* — which is the
 * whole difficulty of rewiring a linked list. An assignment executed against
 * the current state says it: run the two lines the other way round and the
 * reader watches the node point at itself.
 *
 * The right-hand side is read from the diagram on screen, never from the text,
 * so a wrong order produces the broken picture rather than a wrong answer.
 */

/** One side of an assignment: a root name followed by attribute steps. */
type Path = {
  root: string;
  attributes: string[];
};

/**
 * A place a reference can be written to: an edge leaving `nodeId`. A global
 * variable has one nameless outgoing edge; an object attribute and a local
 * variable of a frame each have one per handle.
 */
export type Slot = {
  nodeId: string;
  /** The source handle, or undefined for a global variable. */
  handle?: string;
};

export type StatementError =
  | { code: "malformed" }
  | { code: "unknownName"; name: string }
  | { code: "nullDereference"; path: string }
  | { code: "unknownAttribute"; name: string; klass: string }
  | { code: "notAReference"; path: string };

export type StatementResult =
  | { ok: true; edges: CustomEdgeType[] }
  | { ok: false; error: StatementError };

const splitPath = (text: string): Path | null => {
  const parts = text
    .trim()
    .split(".")
    .map((p) => p.trim());
  if (parts.length === 0 || parts.some((p) => p.length === 0)) return null;
  return { root: parts[0], attributes: parts.slice(1) };
};

/** Splits `a.b = c.d` into its two sides. */
export const parseStatement = (
  text: string,
): { target: Path; source: Path | null } | null => {
  const withoutSemicolon = text.trim().replace(/;$/, "");
  const sides = withoutSemicolon.split("=");
  if (sides.length !== 2) return null;

  const target = splitPath(sides[0]);
  if (!target) return null;

  const raw = sides[1].trim();
  // `null` is a value, not a name, so it never resolves to a node.
  const source = raw === "null" ? null : splitPath(raw);
  if (raw !== "null" && !source) return null;

  return { target, source };
};

const targetOf = (edges: CustomEdgeType[], slot: Slot) =>
  edges.find(
    (e) =>
      e.source === slot.nodeId &&
      (e.sourceHandle ?? undefined) === slot.handle,
  )?.target;

/** The slot a root name stands for: a global variable or a local of a frame. */
const rootSlot = (name: string, nodes: CustomNodeType[]): Slot | null => {
  const variable = nodes.find(
    (n) => n.type === "variable" && (n.data as { name?: string }).name === name,
  );
  if (variable) return { nodeId: variable.id };

  const frame = nodes.find(
    (n) =>
      n.type === "method-call" &&
      (n.data as { localVariables?: Record<string, unknown> })
        .localVariables?.[name] !== undefined,
  );
  if (frame) return { nodeId: frame.id, handle: name };

  return null;
};

/**
 * Walks a path to the slot it names, following the references that are in the
 * diagram right now.
 */
const resolve = (
  path: Path,
  nodes: CustomNodeType[],
  edges: CustomEdgeType[],
): { slot: Slot } | { error: StatementError } => {
  let slot = rootSlot(path.root, nodes);
  if (!slot) return { error: { code: "unknownName", name: path.root } };

  let walked = path.root;
  for (const attribute of path.attributes) {
    const holder = targetOf(edges, slot);
    if (!holder) return { error: { code: "nullDereference", path: walked } };

    const node = nodes.find((n) => n.id === holder);
    if (!node || node.type !== "object") {
      return { error: { code: "nullDereference", path: walked } };
    }

    const data = node.data as {
      klass: string;
      attributes: Record<string, { dataType: string }>;
    };
    const declared = data.attributes?.[attribute];
    if (!declared) {
      return {
        error: {
          code: "unknownAttribute",
          name: attribute,
          klass: data.klass,
        },
      };
    }
    // An int field holds a number, not an arrow. Writing one would put an edge
    // where the diagram draws a value, so it is refused rather than drawn.
    if (primitveDataTypes.includes(declared.dataType)) {
      return {
        error: { code: "notAReference", path: `${walked}.${attribute}` },
      };
    }

    walked = `${walked}.${attribute}`;
    slot = { nodeId: holder, handle: attribute };
  }

  return { slot };
};

/** The edge id the diagram would have given this reference. */
const edgeIdFor = (
  slot: Slot,
  target: string,
  nodes: CustomNodeType[],
): string => {
  if (slot.handle === undefined) return `${slot.nodeId}+${target}`;
  const node = nodes.find((n) => n.id === slot.nodeId);
  return node?.type === "method-call"
    ? `method-call-${slot.nodeId}+${slot.handle}`
    : `${slot.nodeId}+${slot.handle}`;
};

const write = (
  slot: Slot,
  target: string | undefined,
  nodes: CustomNodeType[],
  edges: CustomEdgeType[],
): CustomEdgeType[] => {
  // A slot holds one reference, so the old one goes before the new one lands.
  const rest = edges.filter(
    (e) =>
      !(
        e.source === slot.nodeId &&
        (e.sourceHandle ?? undefined) === slot.handle
      ),
  );
  if (!target) return rest;

  const edge = {
    id: edgeIdFor(slot, target, nodes),
    source: slot.nodeId,
    target,
    ...(slot.handle === undefined
      ? {}
      : { type: "reference", sourceHandle: slot.handle }),
  } as CustomEdgeType;

  return rest.concat(edge);
};

/**
 * Runs one assignment against a diagram and returns the edges it leaves behind.
 *
 * Nothing is mutated: a caller that gets an error can show it without having
 * half-applied the line.
 */
export const executeStatement = (
  text: string,
  nodes: CustomNodeType[],
  edges: CustomEdgeType[],
): StatementResult => {
  const parsed = parseStatement(text);
  if (!parsed) return { ok: false, error: { code: "malformed" } };

  // The right-hand side is read first, from the state the line starts in.
  let value: string | undefined;
  if (parsed.source) {
    const resolved = resolve(parsed.source, nodes, edges);
    if ("error" in resolved) return { ok: false, error: resolved.error };
    value = targetOf(edges, resolved.slot);
  }

  const destination = resolve(parsed.target, nodes, edges);
  if ("error" in destination) return { ok: false, error: destination.error };

  return { ok: true, edges: write(destination.slot, value, nodes, edges) };
};

/** Splits an authored list, so that a teacher may type them on one line. */
export const parseStatementList = (text: string): string[] =>
  text
    .split(/[;\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
