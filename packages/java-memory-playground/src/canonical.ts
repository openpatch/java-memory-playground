import { STRING_KLASS, defaultValueFor, primitveDataTypes } from "./memory";
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

/** How strictly an exercise step is checked. Authored by the teacher. */
export type CheckOptions = {
  /**
   * Roots of the solution that are not checked, by root key. Kept as the
   * roots to leave out rather than the ones to check, so that a variable the
   * teacher adds later is checked without anyone having to remember to.
   */
  ignoreRoots?: string[];
  /**
   * Whether the attempt may have roots the solution does not, such as a
   * temporary variable. Allowed unless the exercise is about removing one.
   */
  extraRoots?: "allow" | "forbid";
  /**
   * Compare Strings as objects, so two equal literals in separate boxes are
   * not the same String. Off by default, which is `.equals()`; on teaches `==`.
   */
  stringIdentity?: boolean;
};

/** A root of a diagram: a variable, or a local of a frame on the stack. */
export type Root = {
  /**
   * Stable across diagrams built independently: the name for a variable, and
   * the frame's position on the stack, its method and the local's name for a
   * local — a frame's address is handed out like an object's.
   */
  key: string;
  name: string;
  /** The method of the frame the local belongs to. */
  frame?: string;
  /** The node the root lives in, and the handle its reference leaves from. */
  owner: string;
  handle: string;
  primitive: boolean;
  /** The value of a primitive root. */
  value?: string;
};

const frameNodesOf = (step: StoreStep) =>
  step.nodes
    .filter((n) => n.type === "method-call")
    .sort((a, b) => (a.data.index ?? 0) - (b.data.index ?? 0));

const valueOf = (dataType: string, value: unknown) =>
  String(value ?? defaultValueFor(dataType) ?? "");

/** Every root of a step, variables first, then the stack from the bottom. */
export const rootsOf = (step: StoreStep): Root[] => {
  const roots: Root[] = [];

  step.nodes
    .filter((n) => n.type === "variable")
    .sort((a, b) => String(a.data.name).localeCompare(String(b.data.name)))
    .forEach((node) => {
      const primitive = primitveDataTypes.includes(node.data.dataType);
      roots.push({
        key: node.data.name,
        name: node.data.name,
        owner: node.id,
        handle: "",
        primitive,
        value: primitive ? valueOf(node.data.dataType, node.data.value) : undefined,
      });
    });

  frameNodesOf(step).forEach((node, position) => {
    const frame = node.data;
    Object.keys(frame.localVariables ?? {})
      .sort()
      .forEach((name) => {
        const local = frame.localVariables[name];
        const primitive = primitveDataTypes.includes(local.dataType);
        roots.push({
          key: `${position}:${frame.name}.${name}`,
          name,
          frame: frame.name,
          owner: node.id,
          handle: name,
          primitive,
          value: primitive ? valueOf(local.dataType, local.value) : undefined,
        });
      });
  });

  return roots;
};

/** Where in the attempt a difference is, so the diagram can point at it. */
export type DiffLocation = {
  /** The node holding the slot that is wrong. */
  owner: string;
  /** The slot within it: an attribute or a local, `""` for a variable. */
  handle: string;
};

/**
 * One way the attempt differs from the solution.
 *
 * `path` reads the way the reader would write it in Java, `head.next[2]`;
 * `frame` names the method a local belongs to.
 */
export type DiffKind =
  | { kind: "missing" }
  | { kind: "value"; expected: string; found: string }
  | { kind: "klass"; expected: string; found: string }
  | { kind: "expectedNull" }
  | { kind: "expectedObject" }
  /** Should be the very object `other` refers to, and is a different one. */
  | { kind: "sameAs"; other: string; otherFrame?: string }
  /** Should be an object of its own, and is the one `other` refers to. */
  | { kind: "distinctFrom"; other: string; otherFrame?: string }
  | { kind: "extra" };

export type CheckDiff = DiffKind & {
  root: string;
  path: string;
  frame?: string;
  at?: DiffLocation;
};

/** The frames of each diagram, bottom of the stack first, when they differ. */
export type StackDiff = { expected: string[]; found: string[] };

export type ExerciseResult = {
  correct: boolean;
  /** Roots the solution has that the attempt got right. */
  matched: string[];
  /** Roots whose shape differs, or that the attempt never created. */
  wrong: string[];
  /**
   * Roots the attempt has that the solution does not, such as a temporary
   * variable used along the way. Unless the exercise forbids them they are
   * reported but do not make an attempt wrong: there is more than one way to
   * build a diagram, and a helper variable does not change what the roots the
   * exercise asks about point to.
   */
  extra: string[];
  /** Every difference found, in the order a reader would come across them. */
  diffs: CheckDiff[];
  /** Set when the call stack itself is not the one the solution has. */
  stack?: StackDiff;
};

const isArrayIndex = (name: string) => /^\d+$/.test(name);

const extend = (path: string, attribute: string) =>
  isArrayIndex(attribute) ? `${path}[${attribute}]` : `${path}.${attribute}`;

/**
 * Compares a student's diagram with the one the exercise asks for.
 *
 * Both diagrams are walked side by side from each root, following the same
 * names in both. Because the roots are named, the walk never has to guess which
 * of the student's objects stands for which of the teacher's: the object at
 * `head.next` in one is paired with the object at `head.next` in the other.
 * Keeping that pairing for the whole walk is what makes sharing part of the
 * answer — two variables that should hold the same object have to hold the same
 * object, not two that look alike.
 */
export const checkAgainst = (
  solution: StoreStep,
  attempt: StoreStep,
  options: CheckOptions = solution.check ?? {},
): ExerciseResult => {
  const ignored = new Set(options.ignoreRoots ?? []);
  const expectedRoots = rootsOf(solution);
  const actualRoots = new Map(rootsOf(attempt).map((r) => [r.key, r]));
  const expectedKeys = new Set(expectedRoots.map((r) => r.key));

  const solutionNodes = new Map(solution.nodes.map((n) => [n.id, n]));
  const attemptNodes = new Map(attempt.nodes.map((n) => [n.id, n]));

  // Which object of the attempt stands for which of the solution, and the
  // first path each was reached by, for saying which two should be one.
  const paired = new Map<string, string>();
  const pairedBack = new Map<string, string>();
  const firstPath = new Map<string, { path: string; frame?: string }>();

  const diffs: CheckDiff[] = [];
  const wrong = new Set<string>();
  const matched: string[] = [];

  const isShared = (id: string, nodes: Map<string, CustomNodeType>) => {
    const node = nodes.get(id);
    if (!node || node.type !== "object") return false;
    return options.stringIdentity || node.data.klass !== STRING_KLASS;
  };

  const object = (nodes: Map<string, CustomNodeType>, id?: string) => {
    const node = id ? nodes.get(id) : undefined;
    return node?.type === "object" ? node : undefined;
  };

  const walk = (root: Root, expectedId?: string, actualId?: string) => {
    type Item = {
      path: string;
      expected?: string;
      actual?: string;
      at: DiffLocation;
    };
    const queue: Item[] = [
      {
        path: root.name,
        expected: expectedId,
        actual: actualId,
        at: { owner: actualRoots.get(root.key)!.owner, handle: actualRoots.get(root.key)!.handle },
      },
    ];
    const report = (item: Item, diff: DiffKind) => {
      diffs.push({
        ...diff,
        root: root.key,
        path: item.path,
        frame: root.frame,
        at: item.at,
      } as CheckDiff);
      wrong.add(root.key);
    };

    while (queue.length > 0) {
      const item = queue.shift()!;
      const s = object(solutionNodes, item.expected);
      const a = object(attemptNodes, item.actual);

      if (!s && !a) continue;
      // The solution has nothing here and the attempt has an object: it
      // should be null. The other way round, it should not be.
      if (!s) {
        report(item, { kind: "expectedNull" });
        continue;
      }
      if (!a) {
        report(item, { kind: "expectedObject" });
        continue;
      }

      const shared = isShared(s.id, solutionNodes);
      if (shared) {
        const partner = paired.get(s.id);
        const partnerBack = pairedBack.get(a.id);
        if (partner !== undefined && partner !== a.id) {
          const other = firstPath.get(s.id)!;
          report(item, { kind: "sameAs", other: other.path, otherFrame: other.frame });
          continue;
        }
        if (partnerBack !== undefined && partnerBack !== s.id) {
          const other = firstPath.get(partnerBack)!;
          report(item, {
            kind: "distinctFrom",
            other: other.path,
            otherFrame: other.frame,
          });
          continue;
        }
        // Reached again by another path: already compared, and a cycle is
        // where this stops rather than going round for ever.
        if (partner !== undefined) continue;
        paired.set(s.id, a.id);
        pairedBack.set(a.id, s.id);
        firstPath.set(s.id, { path: item.path, frame: root.frame });
      }

      const expected = s.data;
      const actual = a.data;
      if (expected.klass !== actual.klass) {
        report(item, { kind: "klass", expected: expected.klass, found: actual.klass });
        continue;
      }
      if (expected.klass === STRING_KLASS) {
        if ((expected.literal ?? "") !== (actual.literal ?? "")) {
          report(item, {
            kind: "value",
            expected: `"${expected.literal ?? ""}"`,
            found: `"${actual.literal ?? ""}"`,
          });
        }
        continue;
      }

      const names = Object.keys(expected.attributes ?? {}).sort((x, y) =>
        isArrayIndex(x) && isArrayIndex(y) ? Number(x) - Number(y) : x.localeCompare(y),
      );
      names.forEach((name) => {
        const attribute = expected.attributes[name];
        const path = extend(item.path, name);
        const at = { owner: a.id, handle: name };
        if (primitveDataTypes.includes(attribute.dataType)) {
          const want = valueOf(attribute.dataType, attribute.value);
          const have = valueOf(
            attribute.dataType,
            actual.attributes?.[name]?.value,
          );
          if (want !== have) {
            report({ path, at }, { kind: "value", expected: want, found: have });
          }
          return;
        }
        queue.push({
          path,
          expected: targetOf(solution.edges, s.id, name),
          actual: targetOf(attempt.edges, a.id, name),
          at,
        });
      });
    }
  };

  // The stack first: a frame left behind or never pushed is a mistake about
  // the program, whatever its locals hold.
  const expectedFrames = frameNodesOf(solution).map((n) => n.data.name);
  const actualFrames = frameNodesOf(attempt).map((n) => n.data.name);
  const stackDiffers =
    expectedFrames.length !== actualFrames.length ||
    expectedFrames.some((name, i) => actualFrames[i] !== name);

  expectedRoots.forEach((root) => {
    if (ignored.has(root.key)) return;
    const actual = actualRoots.get(root.key);
    if (!actual) {
      diffs.push({ kind: "missing", root: root.key, path: root.name, frame: root.frame });
      wrong.add(root.key);
      return;
    }
    if (root.primitive || actual.primitive) {
      if (root.primitive !== actual.primitive || root.value !== actual.value) {
        diffs.push({
          kind: "value",
          expected: root.value ?? "",
          found: actual.value ?? "",
          root: root.key,
          path: root.name,
          frame: root.frame,
          at: { owner: actual.owner, handle: actual.handle },
        });
        wrong.add(root.key);
      }
    } else {
      const solutionRoot = solution.nodes.find((n) => n.id === root.owner)!;
      walk(
        root,
        rootTarget(solution.edges, solutionRoot.id, root.handle),
        rootTarget(attempt.edges, actual.owner, actual.handle),
      );
    }
    if (!wrong.has(root.key)) matched.push(root.key);
  });

  const extra = [...actualRoots.keys()].filter((key) => !expectedKeys.has(key));
  if (options.extraRoots === "forbid") {
    extra.forEach((key) => {
      const root = actualRoots.get(key)!;
      diffs.push({
        kind: "extra",
        root: key,
        path: root.name,
        frame: root.frame,
        at: { owner: root.owner, handle: root.handle },
      });
    });
  }

  return {
    correct: diffs.length === 0 && !stackDiffers,
    matched,
    wrong: [...wrong],
    extra,
    diffs,
    ...(stackDiffers
      ? { stack: { expected: expectedFrames, found: actualFrames } }
      : {}),
  };
};

/** Where a root's reference points; a variable's edge leaves from no handle. */
const rootTarget = (edges: CustomEdgeType[], owner: string, handle: string) =>
  handle === ""
    ? edges.find((e) => e.source === owner)?.target
    : targetOf(edges, owner, handle);

/**
 * A string that changes whenever the part of a step a check looks at changes.
 *
 * A result is only about the diagram it was computed from: moving a node does
 * not make a wrong answer right, but changing an attribute or a reference means
 * the last check no longer says anything about what is on screen. Comparing
 * fingerprints is what lets a stale result be dropped rather than left standing
 * under a diagram it no longer describes.
 */
export const fingerprintOf = (step: StoreStep): string => {
  // Everything but where things are drawn. A canonical form alone would miss a
  // change to which object two variables share, which is exactly what the
  // check looks at; addresses are fine here, the step is compared with itself.
  const nodes = step.nodes
    .map((n) => {
      const { position: _ignored, ...data } = (n.data ?? {}) as Record<string, unknown>;
      return `${n.id}|${n.type}|${JSON.stringify(data)}`;
    })
    .sort();
  const edges = step.edges
    .map((e) => `${e.source}|${e.sourceHandle ?? ""}|${e.target}`)
    .sort();
  return JSON.stringify([nodes, edges]);
};
