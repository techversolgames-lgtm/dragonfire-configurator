import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ONBOARDING_STORAGE_KEY,
  TUTORIAL_STEPS,
  isGatedInteraction,
} from "@/data/DragonfireTools/dragonfireTutorialSteps";

const DragonfireTutorialContext = createContext(null);

let autoLaunchDone = false;

function readOnboardingComplete() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === "1";
}

function writeOnboardingComplete() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
}

export function DragonfireTutorialProvider({ children }) {
  const [visible, setVisible] = useState(false);
  /** @type {'full' | 'single' | null} */
  const [flow, setFlow] = useState(null);
  const [activeSteps, setActiveSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [interactionSatisfied, setInteractionSatisfied] = useState(true);

  const openFullTutorial = useCallback(() => {
    setActiveSteps([...TUTORIAL_STEPS]);
    setStepIndex(0);
    setFlow("full");
    setVisible(true);
  }, []);

  const openTopicByStepId = useCallback((stepId) => {
    const step = TUTORIAL_STEPS.find((s) => s.id === stepId);
    if (!step) return;
    setActiveSteps([step]);
    setStepIndex(0);
    setFlow("single");
    setVisible(true);
  }, []);

  const closeOverlay = useCallback(() => {
    setVisible(false);
    setFlow(null);
    setActiveSteps([]);
    setStepIndex(0);
    setInteractionSatisfied(true);
  }, []);

  const advanceOrFinish = useCallback(
    (force = false) => {
      if (activeSteps.length === 0) return;
      const step = activeSteps[stepIndex];
      if (
        !force &&
        step &&
        isGatedInteraction(step.interaction) &&
        !interactionSatisfied
      ) {
        return;
      }
      if (stepIndex < activeSteps.length - 1) {
        setStepIndex((n) => n + 1);
        return;
      }
      if (flow === "full") writeOnboardingComplete();
      closeOverlay();
    },
    [activeSteps, stepIndex, flow, closeOverlay, interactionSatisfied],
  );

  const skipStepBypass = useCallback(() => {
    advanceOrFinish(true);
  }, [advanceOrFinish]);

  const skipTutorial = useCallback(() => {
    if (flow === "full") writeOnboardingComplete();
    closeOverlay();
  }, [flow, closeOverlay]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (autoLaunchDone) return;
    if (readOnboardingComplete()) return;
    autoLaunchDone = true;
    openFullTutorial();
  }, [openFullTutorial]);

  const currentStep = activeSteps[stepIndex] ?? null;
  const totalInFlow = activeSteps.length;
  const stepNumberOneBased = totalInFlow > 0 ? stepIndex + 1 : 0;
  const isLastStep = totalInFlow > 0 && stepIndex >= totalInFlow - 1;
  const stepNeedsInteraction =
    currentStep && isGatedInteraction(currentStep.interaction);

  const value = useMemo(
    () => ({
      visible,
      flow,
      currentStep,
      stepIndex,
      totalInFlow,
      stepNumberOneBased,
      isLastStep,
      interactionSatisfied,
      stepNeedsInteraction,
      setInteractionSatisfied,
      openFullTutorial,
      openTopicByStepId,
      advanceOrFinish,
      skipStepBypass,
      skipTutorial,
      closeOverlay,
    }),
    [
      visible,
      flow,
      currentStep,
      stepIndex,
      totalInFlow,
      stepNumberOneBased,
      isLastStep,
      interactionSatisfied,
      stepNeedsInteraction,
      openFullTutorial,
      openTopicByStepId,
      advanceOrFinish,
      skipStepBypass,
      skipTutorial,
      closeOverlay,
    ],
  );

  return (
    <DragonfireTutorialContext.Provider value={value}>
      {children}
    </DragonfireTutorialContext.Provider>
  );
}

export function useDragonfireTutorial() {
  const ctx = useContext(DragonfireTutorialContext);
  if (!ctx) {
    throw new Error(
      "useDragonfireTutorial must be used within DragonfireTutorialProvider",
    );
  }
  return ctx;
}
