import { useEffect, useId, useState } from "react";
import { useShallow } from "zustand/shallow";

import { CheckSettings } from "./CheckSettings";
import { resultMessages } from "./checkMessages";
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
  setStepCheck: state.setStepCheck,
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
 * One card in three parts, each with one job: where the reader is (and, for
 * the author, adding and removing steps), what this step asks of them, and —
 * in the teacher's playground — the form that describes the step. A single-step
 * diagram is just a picture, so the card only appears once there is something
 * to walk through or something to do.
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
    setStepCheck,
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
  // The authoring form folds away so the author can look at the diagram the
  // way the reader will; it stays folded from step to step. On a phone it
  // starts folded: open, it is most of the screen.
  const compact = useStore((state) => state.compact);
  const [detailsOpen, setDetailsOpen] = useState(!compact);
  // The layout is measured after the first render, so follow it when it
  // changes rather than only reading it once.
  useEffect(() => setDetailsOpen(!compact), [compact]);
  // On a short screen the reader's card can fold down to its dots, so the
  // whole diagram can be seen; it opens again from the same button.
  const [taskOpen, setTaskOpen] = useState(true);
  const id = useId();

  const step = steps[currentStep];
  const only = steps.length === 1;
  const isExercise = Boolean(step?.exercise) && currentStep > 0;

  // The author edits the label and the note in fields of their own, so the
  // prose versions are the reader's.
  const label = editable ? undefined : step?.label;
  const note = editable ? undefined : step?.note;
  const hintOpen = hintFor === currentStep;

  // The reader runs the lines; the author only writes them down, because
  // running one in the teacher's playground would edit the solution itself.
  const runnable = !editable && statements.length > 0;

  const messages =
    exerciseResult && !exerciseResult.correct
      ? resultMessages(t, exerciseResult)
      : [];
  // The first difference is the headline; a few more are listed under it — a
  // long list of everything wrong is a list nobody reads, and fixing the first
  // often fixes the next.
  const SHOWN = 4;

  const hasTask =
    Boolean(label) || hasSolution || Boolean(note) || runnable || Boolean(exerciseResult);

  // A single-step diagram is just a picture, unless it is an exercise, the
  // author left a hint on it, or there are lines to run.
  if (only && !editable && !hasTask) return null;

  return (
    <div className={`step-bar jmp-panel${editable ? " step-bar--editing" : ""}`}>
      {/* Where the reader is. The dots carry the count and the status of each
          step; the author's step actions sit at the far end of the same row,
          because adding and removing steps is about the sequence, not about
          what is in the step. */}
      {(!only || editable) && (
        <div className="step-bar__nav">
          <div className="step-bar__walk">
            <button
              className="button-icon button-ghost"
              onClick={() => goToStep(currentStep - 1)}
              disabled={currentStep === 0}
              title={t.previousStep}
              aria-label={t.previousStep}
            >
              ‹
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
              className="button-icon button-ghost"
              onClick={() => goToStep(currentStep + 1)}
              disabled={currentStep === steps.length - 1}
              title={t.nextStep}
              aria-label={t.nextStep}
            >
              ›
            </button>
            <span className="step-bar__count">
              {t.stepCounter(currentStep + 1, steps.length)}
            </span>
            {!editable && compact && hasTask && (
              <button
                className="button-icon button-ghost"
                onClick={() => setTaskOpen(!taskOpen)}
                aria-expanded={taskOpen}
                aria-controls={`${id}-task`}
                title={taskOpen ? t.stepDetailsHide : t.stepDetailsShow}
                aria-label={taskOpen ? t.stepDetailsHide : t.stepDetailsShow}
              >
                <span
                  className={`step-bar__chevron${taskOpen ? " open" : ""}`}
                  aria-hidden="true"
                >
                  ‹
                </span>
              </button>
            )}
          </div>

          {editable && (
            <div className="step-bar__step-actions">
              <button
                className="button-ghost"
                onClick={addStep}
                title={t.addStepHint}
              >
                <span aria-hidden="true">+</span> {t.addStep}
              </button>
              <button
                className="button-ghost button-ghost-danger"
                onClick={() => deleteStep(currentStep)}
                disabled={only}
                title={t.deleteStep}
              >
                {t.deleteStep}
              </button>
              <button
                className="button-icon button-ghost"
                onClick={() => setDetailsOpen(!detailsOpen)}
                aria-expanded={detailsOpen}
                aria-controls={`${id}-details`}
                title={detailsOpen ? t.stepDetailsHide : t.stepDetailsShow}
                aria-label={detailsOpen ? t.stepDetailsHide : t.stepDetailsShow}
              >
                <span
                  className={`step-bar__chevron${detailsOpen ? " open" : ""}`}
                  aria-hidden="true"
                >
                  ‹
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* What this step asks of the reader: the task, the actions on it, and
          what the last check or the hint said, as callouts under it. */}
      {!editable && hasTask && (taskOpen || !compact || only) && (
        <div className="step-bar__task" id={`${id}-task`}>
          {(hasSolution || label || note) && (
            <div className="step-bar__head">
              {(hasSolution || label) && (
                <p className="step-bar__prompt">
                  {hasSolution && (
                    <span className="step-bar__badge" title={t.yourTurn}>
                      {t.exerciseBadge}
                    </span>
                  )}
                  {label && <span className="step-bar__label-text">{label}</span>}
                </p>
              )}

              {(note || hasSolution) && (
                <div className="step-bar__actions">
                  {note && (
                    <button
                      className="button-ghost button-toggle"
                      onClick={() => setHintFor(hintOpen ? null : currentStep)}
                      aria-pressed={hintOpen}
                      aria-expanded={hintOpen}
                      title={hintOpen ? t.hideHint : t.showHint}
                    >
                      {t.showHint}
                    </button>
                  )}
                  {hasSolution && (
                    <>
                      <button className="button-ghost" onClick={revealSolution}>
                        {t.showSolution}
                      </button>
                      <button className="button-primary" onClick={checkExercise}>
                        {t.checkAnswer}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {hintOpen && note && (
            <div className="step-bar__callout step-bar__callout--hint">
              <span className="step-bar__callout-icon" aria-hidden="true">
                ?
              </span>
              <p className="step-bar__callout-body">{note}</p>
            </div>
          )}

          {exerciseResult && (
            <div
              className={`step-bar__callout ${
                exerciseResult.correct
                  ? "step-bar__callout--correct"
                  : "step-bar__callout--wrong"
              }`}
              role="status"
            >
              <span className="step-bar__callout-icon" aria-hidden="true">
                {exerciseResult.correct ? "✓" : "✕"}
              </span>
              <div className="step-bar__callout-body">
                {exerciseResult.correct ? (
                  <strong>{t.exerciseCorrect}</strong>
                ) : (
                  <>
                    <strong>{t.checkVerdictWrong}</strong>
                    <ul className="step-bar__diffs">
                      {(messages.length > 0
                        ? messages
                        : [
                            exerciseResult.wrong.length > 0
                              ? t.exerciseWrong(exerciseResult.wrong)
                              : t.exerciseExtra(exerciseResult.extra),
                          ]
                      )
                        .slice(0, SHOWN)
                        .map((message, i) => (
                          <li key={i}>{message}</li>
                        ))}
                      {messages.length > SHOWN && (
                        <li className="step-bar__diffs-more">
                          {t.checkMore(messages.length - SHOWN)}
                        </li>
                      )}
                    </ul>
                  </>
                )}
              </div>
            </div>
          )}

          {/* The lines to run, and what running them did. Dragging an edge says
              where a reference should end up; a line says what it means at the
              moment it runs, which is where the order of two lines starts to
              matter. */}
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
                    className="button-ghost"
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

      {/* The author's description of the step, as a labelled form. Whether the
          step is read or built comes first, because it changes what the other
          fields mean: the title of a step is the task of an exercise. */}
      {editable && detailsOpen && (
        <div className="step-bar__author" id={`${id}-details`}>
          <div className="jmp-fields">
            <span className="jmp-field-label" id={`${id}-kind`}>
              {t.stepKind}
            </span>
            <div
              className="jmp-segmented"
              role="radiogroup"
              aria-labelledby={`${id}-kind`}
            >
              <button
                role="radio"
                aria-checked={!isExercise}
                onClick={() => setStepExercise(currentStep, false)}
                title={t.stepKindTraceHint}
              >
                {t.stepKindTrace}
              </button>
              <button
                role="radio"
                aria-checked={isExercise}
                onClick={() => setStepExercise(currentStep, true)}
                disabled={currentStep === 0}
                title={currentStep === 0 ? t.exerciseNotFirst : t.exerciseStepHint}
              >
                {t.stepKindExercise}
              </button>
            </div>

            <label className="jmp-field-label" htmlFor={`${id}-label`}>
              {isExercise ? t.stepTask : t.stepTitle}
            </label>
            <input
              id={`${id}-label`}
              className="jmp-input"
              value={step?.label ?? ""}
              placeholder={isExercise ? t.stepTaskPlaceholder : t.stepTitlePlaceholder}
              onChange={(e) => setStepLabel(currentStep, e.target.value)}
            />

            <label className="jmp-field-label" htmlFor={`${id}-note`}>
              {t.showHint}
            </label>
            <input
              id={`${id}-note`}
              className="jmp-input"
              value={step?.note ?? ""}
              placeholder={t.stepNotePlaceholder}
              onChange={(e) => setStepNote(currentStep, e.target.value)}
            />

            <label className="jmp-field-label" htmlFor={`${id}-statements`}>
              {t.statements}
            </label>
            <input
              id={`${id}-statements`}
              className="jmp-input jmp-input--code"
              value={step?.statements?.join("; ") ?? ""}
              placeholder={t.statementsPlaceholder}
              title={t.statementsHint}
              onChange={(e) =>
                setStepStatements(currentStep, parseStatementList(e.target.value))
              }
            />
          </div>

          {isExercise && step && (
            <details className="step-bar__check">
              <summary title={t.checkSettingsHint}>{t.checkSettings}</summary>
              <CheckSettings
                step={step}
                onChange={(check) => setStepCheck(currentStep, check)}
                t={t}
              />
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export default StepBar;
