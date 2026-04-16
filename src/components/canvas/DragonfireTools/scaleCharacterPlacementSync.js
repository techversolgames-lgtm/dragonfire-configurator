import useDragNDropStore from "@/stores/useDragNDropStore";
import { FLOOR_Y } from "./CabinetModelComponents/CabinetFeet";

export const SCALE_REFERENCE_ID = 103;

/** Default placement when the scale character is first shown (room center, facing +Z). */
export const DEFAULT_SCALE_REFERENCE_PLACEMENT = {
  cabinetId: SCALE_REFERENCE_ID,
  position: { x: 0, y: FLOOR_Y, z: 0 },
  dragPointNormal: { x: 0, y: 0, z: 1 },
};

/**
 * Last known placement for id 103 while the character is removed from `placedPositions`.
 * Position + dragPointNormal encode world position and Y rotation; any extra fields are preserved.
 */
export const scaleCharacterPlacementCache = {
  /** @type {object | null} */
  saved: null,
};

export function clearScaleCharacterPlacementCache() {
  scaleCharacterPlacementCache.saved = null;
}

export function clonePlacement(placement) {
  if (!placement) return null;
  return structuredClone(placement);
}

/**
 * When show is false: remove scale character from `placedPositions` and cache a deep clone for restore.
 * When show is true: append cached placement (or default) if missing.
 * Adjusts indices and clears deck/drag selection when needed.
 */
export function syncScaleCharacterPlacements(showScaleCharacter) {
  const {
    placedPositions,
    selectedPlacedIndex,
    draggedCabinetIndex,
    selectedDeckItem,
  } = useDragNDropStore.getState();

  if (!showScaleCharacter) {
    const idx = placedPositions.findIndex(
      (p) => p?.cabinetId === SCALE_REFERENCE_ID,
    );
    if (idx === -1) return;

    scaleCharacterPlacementCache.saved = clonePlacement(placedPositions[idx]);
    const next = placedPositions.filter((_, i) => i !== idx);
    const updates = { placedPositions: next };

    if (selectedPlacedIndex != null) {
      if (selectedPlacedIndex === idx) {
        updates.selectedPlacedIndex = null;
        updates.activeSceneItem = null;
      } else if (selectedPlacedIndex > idx) {
        updates.selectedPlacedIndex = selectedPlacedIndex - 1;
      }
    }
    if (draggedCabinetIndex != null) {
      if (draggedCabinetIndex === idx) {
        updates.draggedCabinetIndex = null;
      } else if (draggedCabinetIndex > idx) {
        updates.draggedCabinetIndex = draggedCabinetIndex - 1;
      }
    }
    if (selectedDeckItem?.id === SCALE_REFERENCE_ID) {
      updates.selectedDeckItem = null;
    }
    useDragNDropStore.setState(updates);
    return;
  }

  const has = placedPositions.some(
    (p) => p?.cabinetId === SCALE_REFERENCE_ID,
  );
  if (has) return;

  const restored =
    scaleCharacterPlacementCache.saved != null
      ? clonePlacement(scaleCharacterPlacementCache.saved)
      : { ...DEFAULT_SCALE_REFERENCE_PLACEMENT };

  useDragNDropStore.setState({
    placedPositions: [...placedPositions, restored],
  });
}
