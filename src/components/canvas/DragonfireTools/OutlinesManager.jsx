import * as THREE from "three";
import { EffectComposer, Outline } from "@react-three/postprocessing";
import { useRef, useMemo, useEffect, useLayoutEffect, useState } from "react";
import useAnimationStore from "@/stores/useAnimationStore";
import useDragNDropStore from "@/stores/useDragNDropStore";
import { draggedCabinetGroupRef, cabinetGroupRefsRef } from "./outlineRefs";
import { getOverlappingPlacedIndices } from "@/data/DragonfireTools/snapSolver";
import { reverseIdMap } from "@/data/DragonfireTools/cabinetItems";

const subtleConfig = {
  blur: false,
  edgeStrength: 4,
  kernelSize: 0,
  visibleEdgeColor: "#b0b0b0",
  hiddenEdgeColor: "#b0b0b0",
};

const dragConfig = {
  blur: false,
  edgeStrength: 7,
  kernelSize: 0,
  visibleEdgeColor: "#9090a0",
  hiddenEdgeColor: "#9090a0",
};

const overlapConfig = {
  blur: false,
  edgeStrength: 10,
  kernelSize: 0,
  visibleEdgeColor: "#ff2222",
  hiddenEdgeColor: "#ff2222",
};

function collectMeshesFromObject(object) {
  const meshes = [];
  object.traverse((child) => {
    if (child.isMesh) meshes.push(child);
  });
  return meshes;
}

const OutlinesManager = () => {
  const selectedWall = useAnimationStore((state) => state.selectedWall);
  const wallWidthValues = useAnimationStore((state) => state.wallWidthValues);
  const wallHeightValues = useAnimationStore((state) => state.wallHeightValues);
  const activeSceneItem = useDragNDropStore((state) => state.activeSceneItem);
  const draggedCabinetIndex = useDragNDropStore(
    (state) => state.draggedCabinetIndex,
  );
  const placedPositions = useDragNDropStore((state) => state.placedPositions);

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

  const ref3 = useRef();
  const [dragSelectionMeshes, setDragSelectionMeshes] = useState([]);
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
  const [overlapOutlineMeshes, setOverlapOutlineMeshes] = useState([]);
  useLayoutEffect(() => {
    const meshes = [];
    for (const i of overlappingIndices) {
      const group = cabinetGroupRefsRef.current[i];
      if (group) meshes.push(...collectMeshesFromObject(group));
    }
    setOverlapOutlineMeshes(meshes);
  }, [overlappingIndices, placedPositions]);

  useEffect(() => {
    if (draggedCabinetIndex === null) {
      draggedCabinetGroupRef.current = null;
      setDragSelectionMeshes([]);
    }
  }, [draggedCabinetIndex]);

  useLayoutEffect(() => {
    if (draggedCabinetIndex === null) return;
    const group = draggedCabinetGroupRef.current;
    if (group?.userData?.isCabinet || group?.userData?.isRoomItem) {
      setDragSelectionMeshes(collectMeshesFromObject(group));
    } else {
      setDragSelectionMeshes([]);
    }
  }, [draggedCabinetIndex, placedPositions]);

  // Outline stays constant whenever an item is selected (click, drag, or after release until user clicks elsewhere)
  const selectionArray = useMemo(() => {
    const arr = [ref3];
    if (selectedWall) arr.push(selectedWall);
    if (
      activeSceneItem?.userData?.isCabinet ||
      activeSceneItem?.userData?.isRoomItem
    ) {
      arr.push(...collectMeshesFromObject(activeSceneItem));
    }
    return arr;
  }, [selectedWall, activeSceneItem]);

  const dragSelectionArray = useMemo(() => {
    const arr = [ref3];
    if (dragSelectionMeshes.length > 0) arr.push(...dragSelectionMeshes);
    return arr;
  }, [dragSelectionMeshes]);

  const overlapOutlineArray = useMemo(() => {
    const arr = [ref3];
    if (overlapOutlineMeshes.length > 0) arr.push(...overlapOutlineMeshes);
    return arr;
  }, [overlapOutlineMeshes]);

  return (
    <>
      <mesh
        ref={ref3}
        //off screen to pevent selection being null
        position={[0, 1000000, 0]}
      >
        <boxGeometry args={[1, 1]} />
        <meshStandardMaterial color="hotpink" side={THREE.BackSide} />
      </mesh>
      <EffectComposer autoClear={false}>
        <Outline
          selection={selectionArray}
          blur={subtleConfig.blur}
          visibleEdgeColor={subtleConfig.visibleEdgeColor}
          hiddenEdgeColor={subtleConfig.hiddenEdgeColor}
          edgeStrength={subtleConfig.edgeStrength}
          kernelSize={subtleConfig.kernelSize}
        />
        <Outline
          selection={dragSelectionArray}
          blur={dragConfig.blur}
          visibleEdgeColor={dragConfig.visibleEdgeColor}
          hiddenEdgeColor={dragConfig.hiddenEdgeColor}
          edgeStrength={dragConfig.edgeStrength}
          kernelSize={dragConfig.kernelSize}
        />
        <Outline
          selection={overlapOutlineArray}
          blur={overlapConfig.blur}
          visibleEdgeColor={overlapConfig.visibleEdgeColor}
          hiddenEdgeColor={overlapConfig.hiddenEdgeColor}
          edgeStrength={overlapConfig.edgeStrength}
          kernelSize={overlapConfig.kernelSize}
        />
      </EffectComposer>
    </>
  );
};

export default OutlinesManager;
