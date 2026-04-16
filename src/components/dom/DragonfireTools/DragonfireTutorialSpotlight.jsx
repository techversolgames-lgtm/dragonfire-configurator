import { useEffect, useMemo, useState } from "react";
import { useDragonfireTutorial } from "./DragonfireTutorialContext";
import styles from "@/styles/dom/DragonfireTools/DragonfireTutorial.module.scss";

function resolveHighlightIds(currentStep) {
  if (!currentStep) return [];
  if (
    Array.isArray(currentStep.highlightTargets) &&
    currentStep.highlightTargets.length > 0
  ) {
    return currentStep.highlightTargets;
  }
  if (currentStep.highlightTarget) {
    return [currentStep.highlightTarget];
  }
  return [];
}

/**
 * Pulsing ring(s) around `[data-dragonfire-tutorial="<id>"]`.
 * Supports multiple targets (e.g. toolbar + rotation slider).
 */
export default function DragonfireTutorialSpotlight() {
  const { visible, currentStep } = useDragonfireTutorial();
  const targetIds = useMemo(
    () => resolveHighlightIds(currentStep),
    [currentStep],
  );
  const [boxes, setBoxes] = useState([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!visible || targetIds.length === 0) {
      setBoxes([]);
      return;
    }

    const update = () => {
      const next = [];
      for (const id of targetIds) {
        const nodes = document.querySelectorAll(
          `[data-dragonfire-tutorial="${id}"]`,
        );
        nodes.forEach((el, index) => {
          const r = el.getBoundingClientRect();
          next.push({
            key: `${id}-${index}`,
            top: r.top,
            left: r.left,
            width: r.width,
            height: r.height,
          });
        });
      }
      setBoxes(next);
    };

    update();
    const observers = [];
    for (const id of targetIds) {
      document
        .querySelectorAll(`[data-dragonfire-tutorial="${id}"]`)
        .forEach((el) => {
          const ro = new ResizeObserver(update);
          ro.observe(el);
          observers.push(ro);
        });
    }

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    const intervalId = window.setInterval(update, 400);

    return () => {
      observers.forEach((ro) => ro.disconnect());
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.clearInterval(intervalId);
    };
  }, [visible, targetIds, currentStep?.id]);

  if (boxes.length === 0) return null;

  const pad = 6;

  return (
    <>
      {boxes.map((box) => (
        <div
          key={box.key}
          className={styles.spotlightRing}
          style={{
            top: box.top - pad,
            left: box.left - pad,
            width: box.width + pad * 2,
            height: box.height + pad * 2,
          }}
          aria-hidden
        />
      ))}
    </>
  );
}
