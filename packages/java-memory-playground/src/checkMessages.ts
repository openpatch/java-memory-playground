import { CheckDiff, ExerciseResult } from "./canonical";
import { Translations } from "./translations";

/** A path as the reader would write it, with its frame when it is a local. */
const where = (t: Translations, path: string, frame?: string) =>
  frame ? t.checkInFrame(path, frame) : path;

/** One difference, said in the reader's language. */
export const diffMessage = (t: Translations, diff: CheckDiff): string => {
  const path = where(t, diff.path, diff.frame);
  switch (diff.kind) {
    case "missing":
      return t.checkMissing(path);
    case "expectedNull":
      return t.checkExpectedNull(path);
    case "expectedObject":
      return t.checkExpectedObject(path);
    case "value":
      return t.checkValue(path, diff.expected, diff.found);
    case "klass":
      return t.checkKlass(path, diff.expected, diff.found);
    case "sameAs":
      return t.checkSameAs(path, where(t, diff.other, diff.otherFrame));
    case "distinctFrom":
      return t.checkDistinctFrom(path, where(t, diff.other, diff.otherFrame));
    case "extra":
      return t.checkExtraRoot(path);
  }
};

/**
 * Everything a check found, most important first: a wrong call stack is a
 * mistake about the program, so it comes before what any local holds.
 */
export const resultMessages = (
  t: Translations,
  result: ExerciseResult,
): string[] => [
  ...(result.stack ? [t.checkStack(result.stack.expected, result.stack.found)] : []),
  ...result.diffs.map((diff) => diffMessage(t, diff)),
];

/**
 * The slots of the attempt a check found wrong, as `owner handle`, so the
 * diagram can mark the node and the reference leaving it.
 */
export const wrongSlots = (result: ExerciseResult | null): Set<string> =>
  new Set(
    (result?.correct ? [] : (result?.diffs ?? []))
      .filter((d) => d.at)
      .map((d) => `${d.at!.owner} ${d.at!.handle}`),
  );
