import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useDragonfireTutorial } from "./DragonfireTutorialContext";
import TutorialHandDragVisual from "./TutorialHandDragVisual";
import DragonfireTutorialSpotlight from "./DragonfireTutorialSpotlight";
import styles from "@/styles/dom/DragonfireTools/DragonfireTutorial.module.scss";

export default function DragonfireTutorialOverlay() {
  const {
    visible,
    currentStep,
    stepNumberOneBased,
    totalInFlow,
    isLastStep,
    interactionSatisfied,
    stepNeedsInteraction,
    advanceOrFinish,
    skipStepBypass,
    skipTutorial,
  } = useDragonfireTutorial();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !visible || !currentStep) return null;

  const nextBlocked = stepNeedsInteraction && !interactionSatisfied;
  const showHand = currentStep.visual === "handDrag";
  const deleteStepNoDim = currentStep.id === "delete";

  const body = (
    <div
      className={`${styles.backdrop} ${deleteStepNoDim ? styles.backdropSceneClear : ""}`}
      role="presentation"
    >
      <DragonfireTutorialSpotlight />
      <div
        className={styles.card}
        role="dialog"
        aria-modal="false"
        aria-labelledby="dragonfire-tutorial-title"
        aria-describedby="dragonfire-tutorial-body"
      >
        <div key={currentStep.id} className={styles.cardStep}>
          <p className={styles.progress} aria-live="polite">
            Step {stepNumberOneBased} of {totalInFlow}
          </p>
          <h2 id="dragonfire-tutorial-title" className={styles.title}>
            {currentStep.title}
          </h2>
          {showHand ? <TutorialHandDragVisual /> : null}
          <p id="dragonfire-tutorial-body" className={styles.body}>
            {currentStep.body}
          </p>
          {nextBlocked && (
            <p className={styles.hint} role="status">
              Complete the action in the scene to unlock Next.
            </p>
          )}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.linkSkipStep}
              onClick={() => skipStepBypass()}
            >
              Skip this step
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={skipTutorial}
            >
              Skip tutorial
            </button>
            <button
              type="button"
              className={`${styles.btnPrimary} ${nextBlocked ? styles.btnPrimaryDisabled : ""}`}
              onClick={() => advanceOrFinish(false)}
              disabled={nextBlocked}
              aria-disabled={nextBlocked}
            >
              {isLastStep ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(body, document.body);
}
