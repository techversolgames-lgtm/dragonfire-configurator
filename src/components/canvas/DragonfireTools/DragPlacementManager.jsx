import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import useDragNDropStore from "@/stores/useDragNDropStore";

/**
 *
 * @todo
 * test if anything uses, else delete.
 */

const DragPlacementManager = () => {
  const isCanvasPointerDown = useDragNDropStore(
    (state) => state.isCanvasPointerDown,
  );
  const isCanvasPointerUp = useDragNDropStore(
    (state) => state.isCanvasPointerUp,
  );
  const isCanvasPointerMoving = useDragNDropStore(
    (state) => state.isCanvasPointerMoving,
  );
  const pointerMoveTimestamp = useDragNDropStore(
    (state) => state.pointerMoveTimestamp,
  );

  const selectedDeckItem = useDragNDropStore((state) => state.selectedDeckItem);

  // //log states
  // console.log(
  //   "isCanvasPointerDown",
  //   isCanvasPointerDown,
  //   selectedDeckItem,
  //   isCanvasPointerUp,
  //   isCanvasPointerMoving
  // );

  return null;
};

export default DragPlacementManager;
