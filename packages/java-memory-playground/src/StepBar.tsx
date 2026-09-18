import { useState } from "react";
import { useShallow } from "zustand/shallow";

import { parseStatementList } from "./statements";
import { StatementEntry, RFState, StepStatus } from "./store";
import useStore from "./storeContext";
import { Translations } from "./translations";

const selector = (state: RFState) => ({
  steps: state.steps,
  currentStep: state.currentStep,
  goToStep: state.goToStep,
  addStep: state.addStep,
  deleteStep: state.deleteStep,
  setStepLabel: state.setStepLabel,
  setStepNote: state.setStepNote,
  setStepExercise: state.setStepExercise,
  hasSolution: state.solutions[state.currentStep] !== undefined,
  exerciseResult: state.getExerciseResult(),
  getStepStatus: state.getStepStatus,
  checkExercise: state.checkExercise,
  revealSolution: state.revealSolution,
  setStepStatements: state.setStepStatements,
  runStatement: state.runStatement,
  resetStatements: state.resetStatements,
  // The raw slots, not the getters: those default to a fresh `[]` on every
  // call, and a new array every time is a change to useShallow — which is a
  // render loop rather than an empty list.
  statements: state.steps[state.currentStep]?.statements,
  statementLog: state.statementLog[state.currentStep],
  t: state.getTranslations(),
});

/** Why a line could not run, in the reader's language. */
const statementMessage = (t: Translations, entry: StatementEntry) => {
  const error = entry.error;
  if (!error) return null;
  switch (error.code) {
    case "unknownName":
      return t.statementUnknownName(error.name);
    case "nullDereference":
      return t.statementNullDereference(error.path);
    case "unknownAttribute":
      return t.statementUnknownAttribute(error.name, error.klass);
    case "notAReference":
      return t.statementNotAReference(error.path);
    default:
      return t.statementMalformed;
  }
};

/**
 * A dot says what a step is; the mark inside it says the same thing again for
 * anyone who cannot tell the red one from the green one, and for the printer.
 */
const statusMark: Record<StepStatus, string> = {
  none: "",
  untried: "",
  correct: "✓",
  wrong: "✕",
};

const statusLabel = (t: Translations, status: StepStatus, step: number) => {
  if (status === "correct") return t.stepStatusCorrect(step);
  if (status === "wrong") return t.stepStatusWrong(step);
  if (status === "untried") return t.stepStatusUntried(step);
  return t.stepStatusNone(step);
};

/**
 * Walks through the steps of a diagram.
 *
 * A single-step diagram is just a picture, so the bar only appears once there
 * is something to walk through — or as soon as the author adds a step.
 */
export function StepBar({ editable = true }: { editable?: boolean }) {
  const {
    steps,
    currentStep,
    goToStep,
    addStep,
    deleteStep,
    setStepLabel,
    setStepNote,
    setStepExercise,
    hasSolution,
    exerciseResult,
    getStepStatus,
    checkExercise,
    revealSolution,
    setStepStatements,
    runStatement,
    resetStatements,
    statements = [],
    statementLog = [],
    t,
  } = useStore(useShallow(selector));

  // Which step's hint is open, rather than whether one is: moving on closes it
  // without an effect to reset it, and a hint is asked for per step anyway.
  const [hintFor, setHintFor] = useState<number | null>(null);

  const step = steps[currentStep];
  // The author edits the label and the note in fields of their own, so the
  // prose versions are the reader's.
  const label = editable ? undefined : step?.label;
  const note = editable ? undefined : step?.note;
  const hintOpen = hintFor === currentStep;

  // An empty row still costs a gap, and in the teacher's playground every one
  // of these is absent: the buttons belong to a reader working on an exercise.
  const hasControls = Boolean(note) || hasSolution || Boolean(exerciseResult);

  // The reader runs the lines; the author only writes them down, because
  // running one in the teacher's playground would edit the solution itself.
  const runnable = !editable && statements.length > 0;

  const only = steps.length === 1;
  // A single-step diagram is just a picture, unless it is an exercise, the
  // author left a hint on it, or there are lines to run — either way there is
  // something to press.
  if (only && !editable && !hasSolution && !note && !runnable) return null;

  return (
    <div className="step-bar">
      {/* Row 1 — where the reader is in the trace. The dots carry the count
          and the status of each step. Leading the panel: a walk reads left to
          right, and putting navigation first leaves the task and the buttons
          in the order they are used in. */}
      {!only && (
        <div className="step-bar__nav">
          <button
            className="button-icon"
            onClick={() => goToStep(currentStep - 1)}
            disabled={currentStep === 0}
            title={t.previousStep}
            aria-label={t.previousStep}
          >
            ◀
          </button>
          <div
            className="step-bar__steps"
            role="group"
            aria-label={t.stepOverview}
          >
            {steps.map((_, i) => {
              const status = getStepStatus(i);
              const statusText = statusLabel(t, status, i + 1);
              return (
                <button
                  key={i}
                  type="button"
                  className={`step-bar__dot ${status}${
                    i === currentStep ? " current" : ""
                  }`}
                  onClick={() => goToStep(i)}
                  aria-current={i === currentStep ? "step" : undefined}
                  aria-label={statusText}
                  title={statusText}
                >
                  <span aria-hidden="true">{statusMark[status]}</span>
                </button>
              );
            })}
          </div>
          <button
            className="button-icon"
            onClick={() => goToStep(currentStep + 1)}
            disabled={currentStep === steps.length - 1}
            title={t.nextStep}
            aria-label={t.nextStep}
          >
            ▶
          </button>
        </div>
      )}

      {/* Row 2 — what the step is and what to do about it. The badge marks an
          exercise; the label describes the step; the buttons act on it. They
          share a row because the task and its actions are read together, and
          sit under the navigation rather than beside it so a long task does not
          squeeze the dots. */}
      {(hasSolution || label || hasControls) && (
        <div className="step-bar__body">
          {/* What the step is. "Your turn" used to be a banner across the whole
              bar, which made the strip a heading plus a row for every other thing
              it had to say; as a chip in front of the task it marks the step just
              as clearly and costs no line of its own. The full prompt stays on it
              as a title. */}
          {(hasSolution || label) && (
            <div className="step-bar__intro">
              {hasSolution && (
                <span className="step-bar__badge" title={t.yourTurn}>
                  {t.exerciseBadge}
                </span>
              )}
              {label && <span className="step-bar__label-text">{label}</span>}
            </div>
          )}

          {hasControls && (
            <div className="step-bar__controls">
              {note && (
                <button
                  className="button-toggle"
                  onClick={() => setHintFor(hintOpen ? null : currentStep)}
                  aria-expanded={hintOpen}
                  title={hintOpen ? t.hideHint : t.showHint}
                >
                  {t.showHint}
                </button>
              )}

              {hasSolution && (
                <>
                  <button onClick={checkExercise}>{t.checkAnswer}</button>
                  <button onClick={revealSolution}>{t.showSolution}</button>
                </>
              )}

              {exerciseResult && (
                <span
                  className={
                    exerciseResult.correct
                      ? "step-bar__result correct"
                      : "step-bar__result wrong"
                  }
                >
                  {exerciseResult.correct
                    ? t.exerciseCorrect
                    : exerciseResult.wrong.length > 0
                      ? t.exerciseWrong(exerciseResult.wrong)
                      : t.exerciseExtra(exerciseResult.extra)}
                </span>
              )}
            </div>
          )}

          {/* Inline under the controls, not floating above the bar: a hint that
              appears in place stays beside the button that opened it and does not
              cover the diagram the reader is working on. */}
          {hintOpen && note && <p className="step-bar__note">{note}</p>}

          {/* The lines to run, and what running them did. Dragging an edge says
              where a reference should end up; a line says what it means at the
              moment it runs, which is where the order of two lines starts to
              matter. Both stay available: the palette is an extra way in, not a
              replacement for the diagram. */}
          {runnable && (
            <div className="step-bar__statements">
              <div className="step-bar__statement-buttons">
                {statements.map((statement, i) => (
                  <button
                    key={`${statement}-${i}`}
                    className="step-bar__statement"
                    onClick={() => runStatement(statement)}
                    title={t.runStatement(statement)}
                  >
                    {statement};
                  </button>
                ))}
                {statementLog.length > 0 && (
                  <button
                    className="button-toggle"
                    onClick={resetStatements}
                    title={t.resetStatementsHint}
                  >
                    {t.resetStatements}
                  </button>
                )}
              </div>

              {statementLog.length > 0 && (
                <ol
                  className="step-bar__statement-log"
                  aria-label={t.statementLog}
                >
                  {statementLog.map((entry, i) => {
                    const message = statementMessage(t, entry);
                    return (
                      <li key={i} className={message ? "failed" : undefined}>
                        <code>{entry.text};</code>
                        {message && <span> {message}</span>}
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          )}
        </div>
      )}

      {/* Row 3 — authoring, on a row of its own. The reader's strip stays the
          same shape in both playgrounds, and the two fields keep a width worth
          typing in rather than being squeezed between the buttons. */}
      {editable && (
        <div className="step-bar__author">
          <label className="step-bar__exercise" title={t.exerciseStepHint}>
            <input
              type="checkbox"
              checked={step?.exercise ?? false}
              onChange={(e) => setStepExercise(currentStep, e.target.checked)}
            />
            {t.exerciseStep}
          </label>
          <input
            className="step-bar__label"
            value={step?.label ?? ""}
            placeholder={t.stepLabelPlaceholder}
            aria-label={t.stepLabel}
            onChange={(e) => setStepLabel(currentStep, e.target.value)}
          />
          <input
            className="step-bar__label"
            value={step?.note ?? ""}
            placeholder={t.stepNotePlaceholder}
            aria-label={t.stepNote}
            onChange={(e) => setStepNote(currentStep, e.target.value)}
          />
          <input
            className="step-bar__label"
            value={step?.statements?.join("; ") ?? ""}
            placeholder={t.statementsPlaceholder}
            aria-label={t.statements}
            title={t.statementsHint}
            onChange={(e) =>
              setStepStatements(currentStep, parseStatementList(e.target.value))
            }
          />
          <button onClick={addStep} title={t.addStepHint}>
            {t.addStep}
          </button>
          <button
            onClick={() => deleteStep(currentStep)}
            disabled={only}
            title={t.deleteStep}
          >
            {t.deleteStep}
          </button>
        </div>
      )}
    </div>
  );
}

export default StepBar;
