import { useEffect } from "react";
import useDragNDropStore from "@/stores/useDragNDropStore";

/**
 * Listens for Delete/Backspace and removes the selected placed cabinet from the scene.
 * Only acts when a placed cabinet is selected (selectedPlacedIndex !== null).
 */
const DeleteCabinetKeyboardHandler = () => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const { selectedPlacedIndex, placedPositions } =
        useDragNDropStore.getState();
      if (selectedPlacedIndex == null || !placedPositions?.length) return;
      e.preventDefault();
      const next = placedPositions.filter((_, i) => i !== selectedPlacedIndex);
      useDragNDropStore.setState({
        placedPositions: next,
        selectedPlacedIndex: null,
        activeSceneItem: null,
      });
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return null;
};

export default DeleteCabinetKeyboardHandler;
