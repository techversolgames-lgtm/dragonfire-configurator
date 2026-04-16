import { useMemo } from "react";
import useAnimationStore from "@/stores/useAnimationStore";
import useDragNDropStore from "@/stores/useDragNDropStore";
import { getOverlappingPlacedIndices } from "@/data/DragonfireTools/snapSolver";
import { reverseIdMap } from "@/data/DragonfireTools/cabinetItems";
import OverlapWarningPopup from "./OverlapWarningPopup";

/**
 * Renders the overlap warning popup in the DOM (sibling of Canvas).
 * Must be used outside the R3F Canvas to avoid container.getState errors with createPortal.
 * Includes floor-item overlap, wall-item vs wall-item overlap, and room items/cabinets penetrating walls.
 */
export default function OverlapWarningOverlay() {
  const placedPositions = useDragNDropStore((state) => state.placedPositions);
  const wallWidthValues = useAnimationStore((state) => state.wallWidthValues);
  const wallHeightValues = useAnimationStore((state) => state.wallHeightValues);
  const wallWidthMap = useMemo(
    () => ({
      front: wallWidthValues?.front ?? 9.144,
      right: wallWidthValues?.right ?? 7.3152,
      back: wallWidthValues?.back ?? 9.144,
      left: wallWidthValues?.left ?? 7.3152,
    }),
    [wallWidthValues],
  );
  const wallHeightMap = useMemo(
    () => ({
      front: wallHeightValues?.front ?? 3.048,
      right: wallHeightValues?.right ?? 3.048,
      back: wallHeightValues?.back ?? 3.048,
      left: wallHeightValues?.left ?? 3.048,
    }),
    [wallHeightValues],
  );
  const overlappingIndices = useMemo(
    () =>
      getOverlappingPlacedIndices(
        placedPositions,
        reverseIdMap,
        null,
        wallWidthMap,
        wallHeightMap,
      ),
    [placedPositions, wallWidthMap, wallHeightMap],
  );
  const count = overlappingIndices.size;
  return <OverlapWarningPopup show={count > 0} count={count} />;
}
