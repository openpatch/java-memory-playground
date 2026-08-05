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
    t,
  } = useStore(useShallow(selector));

  const only = steps.length === 1;
  if (only && !editable) return null;

  const step = steps[currentStep];

  return (
    <div className="step-bar">
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

      {editable ? (
        <>
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
      ) : (
        step?.label && <span className="step-bar__label-text">{step.label}</span>
      )}
    </div>
  );
}

export default StepBar;
