import { useShallow } from "zustand/shallow";

import { RFState } from "./store";
import useStore from "./storeContext";

const selector = (state: RFState) => ({
  steps: state.steps,
  currentStep: state.currentStep,
  goToStep: state.goToStep,
  addStep: state.addStep,
  deleteStep: state.deleteStep,
  setStepLabel: state.setStepLabel,
  setStepExercise: state.setStepExercise,
  hasSolution: state.solutions[state.currentStep] !== undefined,
  exerciseResult: state.exerciseResult,
  checkExercise: state.checkExercise,
  revealSolution: state.revealSolution,
  t: state.getTranslations(),
});

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
    setStepExercise,
    hasSolution,
    exerciseResult,
    checkExercise,
    revealSolution,
    t,
  } = useStore(useShallow(selector));

  const only = steps.length === 1;
  // A single-step diagram is just a picture, unless it is an exercise.
  if (only && !editable && !hasSolution) return null;

  const step = steps[currentStep];
  // The author edits the label in a field of its own, so the prose version is
  // the reader's.
  const label = editable ? undefined : step?.label;

  return (
    <div className="step-bar">
      {/* What the step is, above what you do with it. "Your turn" used to sit
          between the description and the buttons, which is the one place in the
          row where a prompt reads as a caption rather than as a heading. */}
      {(hasSolution || label) && (
        <div className="step-bar__intro">
          {hasSolution && <div className="step-bar__header">{t.yourTurn}</div>}
          {label && <span className="step-bar__label-text">{label}</span>}
        </div>
      )}

      <div className="step-bar__controls">
        <button
          className="button-icon"
          onClick={() => goToStep(currentStep - 1)}
          disabled={currentStep === 0}
          title={t.previousStep}
          aria-label={t.previousStep}
        >
          ◀
        </button>
        <span className="step-bar__count">
          {currentStep + 1} / {steps.length}
        </span>
        <button
          className="button-icon"
          onClick={() => goToStep(currentStep + 1)}
          disabled={currentStep === steps.length - 1}
          title={t.nextStep}
          aria-label={t.nextStep}
        >
          ▶
        </button>

        {editable && (
          <>
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
          </>
        )}

        {hasSolution && (
          <>
            <button onClick={checkExercise}>{t.checkAnswer}</button>
            <button onClick={revealSolution}>{t.showSolution}</button>
          </>
        )}
      </div>

      {/* Left beside the controls rather than moved under the description: it
          is the answer to the button that was just pressed. */}
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
  );
}

export default StepBar;
