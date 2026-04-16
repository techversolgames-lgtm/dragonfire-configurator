import { useEffect } from "react";

/**
 * Allows DOM-side code to temporarily set the CameraControls target.
 *
 * Event:
 *  window.dispatchEvent(new CustomEvent("dragonfire-tools-set-controls-target", { detail: { target: [x,y,z] } }))
 */
export default function DragonfireToolsCameraTargetOverride({
  controlsRef,
}) {
  useEffect(() => {
    const handler = (e) => {
      const target = e?.detail?.target;
      if (!target || !Array.isArray(target) || target.length !== 3) return;
      const controls = controlsRef?.current;
      if (!controls) return;

      // Keep target aligned with the rest of the system (CameraAnimations uses _target).
      controls.setTarget(target[0], target[1], target[2]);
    };

    window.addEventListener("dragonfire-tools-set-controls-target", handler);
    return () => {
      window.removeEventListener(
        "dragonfire-tools-set-controls-target",
        handler,
      );
    };
  }, [controlsRef]);

  return null;
}

