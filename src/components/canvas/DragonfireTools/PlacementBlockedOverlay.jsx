import { useEffect, useRef, useState } from "react";
import PlacementBlockedPopup from "./PlacementBlockedPopup";

/**
 * DOM overlay rendered outside the R3F <Canvas>.
 * Listens for placement-blocked events dispatched by RayReceiverFloorPlane.
 */
export default function PlacementBlockedOverlay() {
  const [message, setMessage] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      const nextMessage = e?.detail?.message;
      if (!nextMessage) return;

      setMessage(nextMessage);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setMessage(null), 2200);
    };

    const clearHandler = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      setMessage(null);
    };

    window.addEventListener("df_placement_blocked", handler);
    window.addEventListener("df_placement_blocked_clear", clearHandler);
    return () => {
      window.removeEventListener("df_placement_blocked", handler);
      window.removeEventListener("df_placement_blocked_clear", clearHandler);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <PlacementBlockedPopup show={message != null} message={message ?? ""} />
  );
}

