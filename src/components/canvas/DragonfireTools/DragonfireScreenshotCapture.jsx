import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";

/**
 * Captures the current WebGL frame to a PNG dataURL and returns it via
 * a window event.
 *
 * Request:
 *  window.dispatchEvent(new CustomEvent("dragonfire-tools-capture-frame", { detail: { requestId } }))
 *
 * Response:
 *  window.dispatchEvent(new CustomEvent("dragonfire-tools-capture-frame-response", { detail: { requestId, dataUrl } }))
 */
export default function DragonfireScreenshotCapture() {
  const { gl } = useThree();
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const onCapture = (e) => {
      const requestId = e?.detail?.requestId;
      if (!requestId) return;

      // Let the renderer settle for the current frame.
      window.requestAnimationFrame(() => {
        if (!mountedRef.current) return;
        try {
          const dataUrl = gl.domElement.toDataURL("image/png");
          window.dispatchEvent(
            new CustomEvent("dragonfire-tools-capture-frame-response", {
              detail: { requestId, dataUrl },
            }),
          );
        } catch (err) {
          window.dispatchEvent(
            new CustomEvent("dragonfire-tools-capture-frame-response", {
              detail: { requestId, dataUrl: null, error: err?.message ?? "" },
            }),
          );
        }
      });
    };

    window.addEventListener("dragonfire-tools-capture-frame", onCapture);
    return () => {
      window.removeEventListener("dragonfire-tools-capture-frame", onCapture);
    };
  }, [gl]);

  return null;
}

