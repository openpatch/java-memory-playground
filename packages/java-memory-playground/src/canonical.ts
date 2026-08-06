import { STRING_KLASS, primitveDataTypes } from "./memory";
import { StoreStep } from "./store";
import { CustomEdgeType, CustomNodeType } from "./types";

/**
 * The shape of a diagram, written so that two diagrams built independently can
 * be compared.
 *
 * Addresses cannot be compared: a student who allocates an object gets whatever
 * address the playground handed out, never the one in the teacher's solution.
 * What can be compared is the shape reachable from the roots — the named
 * variables and the locals of each frame — because those names are authored.
 */

const targetOf = (
  edges: CustomEdgeType[],
  source: string,
  handle: string,
) => edges.find((e) => e.source === source && e.sourceHandle === handle)?.target;

const describe = (
  id: string | undefined,
  nodes: Map<string, CustomNodeType>,
  edges: CustomEdgeType[],
  seen: Map<string, number>,
): string => {
  if (!id) return "null";

  const node = nodes.get(id);
  if (!node || node.type !== "object") return "null";

  // A cycle is part of the shape, so it is written as a back reference rather
  // than followed forever.
  const already = seen.get(id);
  if (already !== undefined) return `#${already}`;
  seen.set(id, seen.size);

  const data = node.data;
  if (data.klass === STRING_KLASS) return `"${data.literal ?? ""}"`;

  const attributes = Object.keys(data.attributes ?? {})
    .sort()
    .map((name) => {
      const attribute = data.attributes[name];
      if (primitveDataTypes.includes(attribute.dataType)) {
        return `${name}=${String(attribute.value ?? "")}`;
      }
      return `${name}=${describe(targetOf(edges, id, name), nodes, edges, seen)}`;
    });

  return `${data.klass}{${attributes.join(",")}}`;
};

/**
 * The canonical form of each root, keyed by the root's name.
 *
 * Comparing per root rather than as one string is what lets a check say which
 * variable is wrong instead of only that something is.
 */
export const canonicalRoots = (step: StoreStep): Record<string, string> => {
  const nodes = new Map(step.nodes.map((n) => [n.id, n]));
  const roots: Record<string, string> = {};

  step.nodes.forEach((node) => {
    if (node.type === "variable") {
      const seen = new Map<string, number>();
      roots[node.data.name] = describe(
        targetOf(step.edges, node.id, "") ??
          step.edges.find((e) => e.source === node.id)?.target,
        nodes,
        step.edges,
        seen,
      );
    }

    if (node.type === "method-call") {
      const frame = node.data;
      Object.keys(frame.localVariables ?? {})
        .sort()
        .forEach((name) => {
          const local = frame.localVariables[name];
          const key = `${frame.index}:${frame.name}.${name}`;
          if (primitveDataTypes.includes(local.dataType)) {
            roots[key] = String(local.value ?? "");
            return;
          }
          const seen = new Map<string, number>();
          roots[key] = describe(
            targetOf(step.edges, node.id, name),
            nodes,
            step.edges,
            seen,
          );
        });
    }
  });

  return roots;
};

export type ExerciseResult = {
  correct: boolean;
  /** Roots the solution has that the attempt got right. */
  matched: string[];
  /** Roots whose shape differs, or that the attempt never created. */
  wrong: string[];
  /** Roots the attempt invented. */
  extra: string[];
};

/** Compares a student's diagram with the one the exercise asks for. */
export const checkAgainst = (
  solution: StoreStep,
  attempt: StoreStep,
): ExerciseResult => {
  const expected = canonicalRoots(solution);
  const actual = canonicalRoots(attempt);

  const matched: string[] = [];
  const wrong: string[] = [];

  Object.keys(expected).forEach((name) => {
    if (actual[name] === expected[name]) matched.push(name);
    else wrong.push(name);
  });

  const extra = Object.keys(actual).filter((name) => !(name in expected));

  return {
    correct: wrong.length === 0 && extra.length === 0,
    matched,
    wrong,
    extra,
  };
};
