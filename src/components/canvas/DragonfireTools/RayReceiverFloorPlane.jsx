import useAnimationStore from "@/stores/useAnimationStore";
import useDragNDropStore from "@/stores/useDragNDropStore";
import { useEffect, useRef, useMemo } from "react";
import { extend, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Custom4PointPlane from "@/utils/Custom4PointPlane.js";
import computeQuadPoints, {
  getQuadHeights,
} from "@/utils/computeQuadPoints.js";
import { FLOOR_Y } from "./CabinetModelComponents/CabinetFeet";
import { getInwardNormalForWall } from "./wallSnapUtils";
import { clampFloorPositionToRoom } from "./wallSnapUtils";
import { getRoomDescriptor } from "@/data/DragonfireTools/roomDefinition";
import { reverseIdMap } from "@/data/DragonfireTools/cabinetItems";
import {
  FLOOR_GRID_STEP,
  DRAG_WALL_FRONTFACE_DOT_MAX,
  DEBUG_DRAG_TRACE_WALL_HITS,
  DEBUG_WALL_DRAG_ROTATION,
} from "@/data/DragonfireTools/snapConstants";
import {
  wouldPositionOverlap,
  getPlacementFloorRotationY,
} from "@/data/DragonfireTools/snapSolver";
import { isCornerCabinet } from "./wallSnapUtils";
import { computeFloorSnapResult } from "./applyFloorDropSnap";
import { getOffsetFloorCenter } from "./floorItemSnapUtils";
import {
  pointerDownOnPlacedItemRef,
  draggedFloorSnapResultRef,
} from "./outlineRefs";
import { SCALE_REFERENCE_ID } from "./scaleCharacterPlacementSync";

extend({ Custom4PointPlane });

/** Invisible wall hit targets sit slightly inside the room so the ray hits them before the brick (library floor drag / ghost). */
const WALL_RAY_RECEIVER_INSET_M = 0.05;

function offsetWallReceiverQuad(args, wallLabel, wallWidthMap, dist) {
  const [p0, p1, p2, p3, reverse] = args;
  const n = getInwardNormalForWall(wallLabel, wallWidthMap);
  const ox = n.x * dist;
  const oz = n.z * dist;
  return [
    new THREE.Vector3(p0.x + ox, p0.y, p0.z + oz),
    new THREE.Vector3(p1.x + ox, p1.y, p1.z + oz),
    new THREE.Vector3(p2.x + ox, p2.y, p2.z + oz),
    new THREE.Vector3(p3.x + ox, p3.y, p3.z + oz),
    reverse,
  ];
}

function quantizeFloorPosition(x, z) {
  if (FLOOR_GRID_STEP <= 0) return { x, z };
  return {
    x: Math.round(x / FLOOR_GRID_STEP) * FLOOR_GRID_STEP,
    z: Math.round(z / FLOOR_GRID_STEP) * FLOOR_GRID_STEP,
  };
}

const floorDragDisplacemetVector = new THREE.Vector3();

const RayReceiverFloorPlane = () => {
  // const roomWidth = useAnimationStore((state) => state.roomWidth) || 10;
  // const roomLength = useAnimationStore((state) => state.roomLength) || 10;
  // const roomHeight = useAnimationStore((state) => state.roomHeight) || 2.5;

  const wallWidthValues = useAnimationStore((state) => state.wallWidthValues);
  const wallHeightValues = useAnimationStore((state) => state.wallHeightValues);
  const disabledWallValues = useAnimationStore(
    (state) => state.disabledWallValues,
  );
  const floorWidth = (wallWidthValues?.front || 9.144) * 2.5;
  const floorLength = (wallWidthValues?.right || 7.3152) * 2.5;
  const wallWidthMap = {
    front: wallWidthValues?.front ?? 9.144,
    right: wallWidthValues?.right ?? 7.3152,
    back: wallWidthValues?.back ?? 9.144,
    left: wallWidthValues?.left ?? 7.3152,
  };
  const wallHeightMap = {
    left: wallHeightValues?.left || 3.048,
    right: wallHeightValues?.right || 3.048,
    front: wallHeightValues?.front || 3.048,
    back: wallHeightValues?.back || 3.048,
    floor: 0,
  };
  const disabledWallMap = {
    left: disabledWallValues?.left || false,
    right: disabledWallValues?.right || false,
    front: disabledWallValues?.front || false,
    back: disabledWallValues?.back || false,
    floor: 0,
  };

  const { frontWallArgs, rightWallArgs, backWallArgs, leftWallArgs } =
    useMemo(() => {
      const floorPoints = computeQuadPoints(
        wallWidthMap.front,
        wallWidthMap.right,
        wallWidthMap.back,
        wallWidthMap.left,
      );
      const roofCornerHeights = getQuadHeights(
        wallHeightMap.front,
        wallHeightMap.right,
        wallHeightMap.back,
        wallHeightMap.left,
      );
      const [p1xy, p2xy, p3xy, p4xy] = floorPoints;
      const [p1z, p2z, p3z, p4z] = roofCornerHeights;

      const floorP1 = new THREE.Vector3(p1xy.x, FLOOR_Y, -p1xy.y);
      const floorP2 = new THREE.Vector3(p2xy.x, FLOOR_Y, -p2xy.y);
      const floorP3 = new THREE.Vector3(p3xy.x, FLOOR_Y, -p3xy.y);
      const floorP4 = new THREE.Vector3(p4xy.x, FLOOR_Y, -p4xy.y);

      const roofP1 = new THREE.Vector3(p1xy.x, p1z, -p1xy.y);
      const roofP2 = new THREE.Vector3(p2xy.x, p2z, -p2xy.y);
      const roofP3 = new THREE.Vector3(p3xy.x, p3z, -p3xy.y);
      const roofP4 = new THREE.Vector3(p4xy.x, p4z, -p4xy.y);

      const inset = WALL_RAY_RECEIVER_INSET_M;
      const baseFront = [floorP1, floorP2, roofP2, roofP1, false];
      const baseRight = [floorP2, floorP3, roofP3, roofP2, false];
      const baseBack = [floorP3, floorP4, roofP4, roofP3, false];
      const baseLeft = [floorP4, floorP1, roofP1, roofP4, false];

      return {
        frontWallArgs: offsetWallReceiverQuad(
          baseFront,
          "front",
          wallWidthMap,
          inset,
        ),
        rightWallArgs: offsetWallReceiverQuad(
          baseRight,
          "right",
          wallWidthMap,
          inset,
        ),
        backWallArgs: offsetWallReceiverQuad(
          baseBack,
          "back",
          wallWidthMap,
          inset,
        ),
        leftWallArgs: offsetWallReceiverQuad(
          baseLeft,
          "left",
          wallWidthMap,
          inset,
        ),
      };
    }, [wallHeightValues, wallWidthValues]);
  const selectedDeckItem = useDragNDropStore((state) => state.selectedDeckItem);
  const showScaleCharacter =
    useAnimationStore((state) => state.showScaleCharacter) ?? false;
  const selectedDragItem = useDragNDropStore((state) => state.selectedDragItem);
  const isFloorDragEnabled = useDragNDropStore(
    (state) => state.isFloorDragEnabled,
  );
  let isPointerDown = false;

  const isPointerDownRef = useRef(isPointerDown);
  const lastWarningAtRef = useRef(0);
  const placementBlockedRef = useRef(false);

  const showPlacementBlockedWarning = (message) => {
    placementBlockedRef.current = true;
    const now = Date.now();
    // Avoid spamming state updates when we get many rapid overlaps in a row.
    if (now - lastWarningAtRef.current < 150) return;
    lastWarningAtRef.current = now;

    // Dispatch to a DOM overlay component rendered outside the R3F <Canvas>.
    window.dispatchEvent(
      new CustomEvent("df_placement_blocked", { detail: { message } }),
    );
  };

  const clearPlacementBlockedWarning = () => {
    if (!placementBlockedRef.current) return;
    placementBlockedRef.current = false;
    window.dispatchEvent(new CustomEvent("df_placement_blocked_clear"));
  };
  const floorDragStartPositionRef = useRef(null);
  const flootEndPositionRef = useRef(null);
  const originalCabinetPositionRef = useRef(null);
  /** Sticky wall for ghost: first wall we collided with; only change when we leave it (prevents flip at corners). */
  const ghostSnappedWallIdRef = useRef(null);
  /** Raycast to floor so drag + rotation work when cursor is over a wall. */
  const floorPlaneRef = useRef(
    new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
  );
  const raycasterRef = useRef(new THREE.Raycaster());
  const floorIntersectRef = useRef(new THREE.Vector3());
  const wallHitRef = useRef(new THREE.Vector3());

  useEffect(() => {
    if (selectedDragItem) {
      useDragNDropStore.setState({
        floorDragPosition: selectedDragItem,
      });
    }
    isPointerDownRef.current = true;
  }, [selectedDragItem]);

  useEffect(() => {
    const itemType = selectedDeckItem?.itemType;
    if (itemType === "floor") {
      isPointerDownRef.current = true;
    } else {
      ghostSnappedWallIdRef.current = null;
    }
  }, [selectedDeckItem]);

  /** Clear drag refs when floor drag ends so next drag starts fresh. */
  useEffect(() => {
    if (!isFloorDragEnabled) {
      floorDragStartPositionRef.current = null;
      originalCabinetPositionRef.current = null;
    }
  }, [isFloorDragEnabled]);

  /** Update ghost position + rotation from a floor point. Uses same pipeline as placed/drag (computeFloorSnapResult) so ghost and placement match exactly. */
  const runGhostUpdate = (point) => {
    const itemType = selectedDeckItem?.itemType;
    if (itemType !== "floor") return;
    if (selectedDeckItem?.id === SCALE_REFERENCE_ID && !showScaleCharacter) return;
    const q = quantizeFloorPosition(point.x, point.z);
    const floorPoint = { ...point, x: q.x, z: q.z };
    const ghostDims = reverseIdMap[selectedDeckItem?.id]?.boundingBox
      ? {
          width: reverseIdMap[selectedDeckItem.id].boundingBox.width,
          depth: reverseIdMap[selectedDeckItem.id].boundingBox.depth,
        }
      : { width: 1, depth: 1 };
    const label = reverseIdMap[selectedDeckItem?.id]?.label;
    const ghostRot = 0;
    const clampedInput = clampFloorPositionToRoom(
      floorPoint,
      ghostDims.width,
      ghostDims.depth,
      ghostRot,
      wallWidthMap,
    );
    const { placedPositions } = useDragNDropStore.getState();
    const meta = reverseIdMap[selectedDeckItem?.id];
    const snapped = computeFloorSnapResult({
      desiredPosition: { ...clampedInput, y: floorPoint.y },
      rotationY: ghostRot,
      dimensions: ghostDims,
      label,
      meta,
      placedPositions,
      excludeIndex: null,
      wallWidthMap,
      reverseIdMap,
    });

    // While previewing (ghost), warn immediately if the candidate placement
    // would overlap an existing floor item.
    const candidateRotY = snapped.dragPointNormal
      ? Math.atan2(snapped.dragPointNormal.x, snapped.dragPointNormal.z)
      : 0;
    const ghostOverlapCenter = getOffsetFloorCenter(
      { x: snapped.position.x, z: snapped.position.z },
      candidateRotY,
      meta ?? {},
    );
    const wouldOverlap = wouldPositionOverlap(
      placedPositions,
      reverseIdMap,
      null,
      { ...snapped.position, x: ghostOverlapCenter.x, z: ghostOverlapCenter.z },
      ghostDims.width,
      ghostDims.depth,
      candidateRotY,
    );
    if (wouldOverlap) {
      showPlacementBlockedWarning(
        "You are placing on an item. Please move it aside."
      );
    } else {
      clearPlacementBlockedWarning();
    }

    ghostSnappedWallIdRef.current = snapped.snappedWallId ?? null;
    useDragNDropStore.setState({
      floorPoint: { ...snapped.position, y: floorPoint.y },
      dragPointNormal: snapped.dragPointNormal,
    });
  };

  /** Runs the floor-drag position + rotation update. Uses same pipeline as ghost (computeFloorSnapResult). */
  const runFloorDragUpdate = (point) => {
    const { placedPositions, draggedCabinetIndex } =
      useDragNDropStore.getState();
    if (!floorDragStartPositionRef.current) {
      floorDragStartPositionRef.current = { ...point };
      if (
        draggedCabinetIndex !== null &&
        placedPositions[draggedCabinetIndex]
      ) {
        originalCabinetPositionRef.current = {
          ...placedPositions[draggedCabinetIndex].position,
        };
      }
    }
    floorDragDisplacemetVector.subVectors(
      point,
      floorDragStartPositionRef.current,
    );
    if (
      draggedCabinetIndex === null ||
      !placedPositions[draggedCabinetIndex] ||
      !originalCabinetPositionRef.current
    ) {
      return;
    }
    const draggedCabinet = placedPositions[draggedCabinetIndex];
    const desiredPosition = {
      x: originalCabinetPositionRef.current.x + floorDragDisplacemetVector.x,
      y: originalCabinetPositionRef.current.y + floorDragDisplacemetVector.y,
      z: originalCabinetPositionRef.current.z + floorDragDisplacemetVector.z,
    };
    const meta = reverseIdMap[draggedCabinet.cabinetId];
    const dimensions = meta?.boundingBox
      ? { width: meta.boundingBox.width, depth: meta.boundingBox.depth }
      : { width: 1, depth: 1 };
    const currentRot = getPlacementFloorRotationY(draggedCabinet);
    const snapped = computeFloorSnapResult({
      desiredPosition,
      rotationY: currentRot,
      dimensions,
      label: meta?.label,
      meta,
      placedPositions,
      excludeIndex: draggedCabinetIndex,
      wallWidthMap,
      reverseIdMap,
      draggedItemEdges: null,
    });
    const rotY = snapped.dragPointNormal
      ? Math.atan2(snapped.dragPointNormal.x, snapped.dragPointNormal.z)
      : currentRot;
    const dragOverlapCenter = getOffsetFloorCenter(
      { x: snapped.position.x, z: snapped.position.z },
      rotY,
      meta ?? {},
    );
    if (
      wouldPositionOverlap(
        placedPositions,
        reverseIdMap,
        draggedCabinetIndex,
        { ...snapped.position, x: dragOverlapCenter.x, z: dragOverlapCenter.z },
        dimensions.width,
        dimensions.depth,
        rotY,
      )
    ) {
      draggedFloorSnapResultRef.current = null;
      showPlacementBlockedWarning("Not enough space. Move the item aside.");
      return;
    }
    clearPlacementBlockedWarning();
    draggedFloorSnapResultRef.current = {
      position: snapped.position,
      dragPointNormal: snapped.dragPointNormal ?? draggedCabinet.dragPointNormal ?? null,
      rotationY: rotY,
      snappedWallId: snapped.snappedWallId,
    };
    if (DEBUG_WALL_DRAG_ROTATION) {
      console.log("[wall drag rotation]", {
        activeWall: snapped.snappedWallId ?? "none",
        rotationY: rotY,
        rotationDeg: (rotY * 180) / Math.PI,
      });
    }
    const updatedPositions = [...placedPositions];
    updatedPositions[draggedCabinetIndex] = {
      ...draggedCabinet,
      position: snapped.position,
      dragPointNormal: snapped.dragPointNormal ?? draggedCabinet.dragPointNormal ?? null,
      rotationY: rotY,
      snappedWallId: snapped.snappedWallId,
      backsplash: draggedCabinet.backsplash,
      baseOption: draggedCabinet.baseOption,
    };
    useDragNDropStore.setState({ placedPositions: updatedPositions });
  };

  const handlePointerMove = (e) => {
    e.stopPropagation();
    const itemType = selectedDeckItem?.itemType;
    const { point } = e;
    // UX: if user is moving again, hide the warning immediately.
    // (It will re-show only if the overlap is still present during updates.)
    clearPlacementBlockedWarning();
    if (itemType === "floor") {
      runGhostUpdate(point);
    }
    if (isPointerDownRef.current && isFloorDragEnabled) {
      useDragNDropStore.setState({
        floorDragPosition: point,
      });
    }
    // Cabinet position/rotation during drag is updated in useFrame (so it works when cursor is over wall too).
  };

  /** Run early (priority -1) so drag snap result ref is set before GenerateAllCabinetsInScene useFrame applies it; enables continuous wall-aligned rotation during drag. */
  useFrame((state) => {
    const { draggedCabinetIndex } = useDragNDropStore.getState();
    if (draggedCabinetIndex === null) {
      draggedFloorSnapResultRef.current = null;
    }
    const { pointer, camera } = state;
    raycasterRef.current.setFromCamera(pointer, camera);
    const ray = raycasterRef.current.ray;
    const hit = ray.intersectPlane(
      floorPlaneRef.current,
      floorIntersectRef.current,
    );
    if (!hit) return;
    const floorPoint = {
      x: floorIntersectRef.current.x,
      y: floorIntersectRef.current.y,
      z: floorIntersectRef.current.z,
    };
    const distToFloor = ray.origin.distanceTo(floorIntersectRef.current);
    const descriptor = getRoomDescriptor(wallWidthMap);
    let bestWallT = Infinity;
    wallHitRef.current.set(floorPoint.x, floorPoint.y, floorPoint.z);
    for (const wall of descriptor.walls) {
      const { nx, nz, d } = wall.plane;
      const denom = nx * ray.direction.x + nz * ray.direction.z;
      if (Math.abs(denom) < 1e-6) continue;
      const t = -(nx * ray.origin.x + nz * ray.origin.z + d) / denom;
      const isFrontFace = denom <= DRAG_WALL_FRONTFACE_DOT_MAX;
      if (DEBUG_DRAG_TRACE_WALL_HITS && t > 0) {
        console.log("[drag trace]", {
          wallId: wall.wallId,
          dot: denom,
          t,
          isFrontFace,
          result: isFrontFace && t < bestWallT ? "accepted" : "rejected",
        });
      }
      if (t > 0 && isFrontFace && t < bestWallT) {
        bestWallT = t;
        wallHitRef.current.set(
          ray.origin.x + t * ray.direction.x,
          0,
          ray.origin.z + t * ray.direction.z,
        );
      }
    }
    const useWallFoot =
      bestWallT < Infinity && bestWallT < distToFloor;
    const point = useWallFoot
      ? {
          x: wallHitRef.current.x,
          y: 0,
          z: wallHitRef.current.z,
        }
      : floorPoint;
    const dragIdx = useDragNDropStore.getState().draggedCabinetIndex;
    if (isFloorDragEnabled && dragIdx !== null) {
      useDragNDropStore.setState({ floorDragPosition: point });
      runFloorDragUpdate(point);
    } else if (selectedDeckItem?.itemType === "floor") {
      runGhostUpdate(point);
    }
  }, -1);

  const handlePointerUp = (e) => {
    e.stopPropagation();
    const itemType = selectedDeckItem?.itemType;
    if (itemType === "floor") {
      if (selectedDeckItem?.id === SCALE_REFERENCE_ID && !showScaleCharacter) {
        return;
      }
      const { floorPoint: ghostPosition, dragPointNormal, placedPositions } =
        useDragNDropStore.getState();
      const meta = reverseIdMap[selectedDeckItem.id];
      const dimensions = meta?.boundingBox
        ? { width: meta.boundingBox.width, depth: meta.boundingBox.depth }
        : { width: 1, depth: 1 };
      const finalRotationY = dragPointNormal
        ? Math.atan2(dragPointNormal.x, dragPointNormal.z)
        : 0;
      const finalX = ghostPosition.x;
      const finalZ = ghostPosition.z;
      const newPlacement = {
        cabinetId: selectedDeckItem.id,
        position: {
          x: finalX,
          y: ghostPosition.y ?? 0,
          z: finalZ,
        },
      };
      if (dragPointNormal) {
        newPlacement.dragPointNormal = dragPointNormal;
        newPlacement.rotationY = finalRotationY;
      }
      if (ghostSnappedWallIdRef.current) {
        newPlacement.snappedWallId = ghostSnappedWallIdRef.current;
      }
      if (selectedDeckItem.id === 3) {
        newPlacement.backsplash = true;
        newPlacement.baseOption = "none";
      }
      if (selectedDeckItem.id === 9) {
        newPlacement.baseOption = "none";
      }
      if (selectedDeckItem.id === 8 || selectedDeckItem.id === 10) {
        newPlacement.baseOption = "legs";
      }
      if (selectedDeckItem.id === 1 || selectedDeckItem.id === 16) {
        newPlacement.baseOption = "smallLegs";
      }
      const placeOverlapCenter = getOffsetFloorCenter(
        { x: finalX, z: finalZ },
        finalRotationY,
        meta ?? {},
      );
      const wouldOverlap = wouldPositionOverlap(
        placedPositions,
        reverseIdMap,
        null,
        { x: placeOverlapCenter.x, z: placeOverlapCenter.z },
        dimensions.width,
        dimensions.depth,
        finalRotationY,
      );
      if (!wouldOverlap) {
        const nextPlaced = [...placedPositions, newPlacement];
        const newIndex = nextPlaced.length - 1;
        useDragNDropStore.setState({
          placedPositions: nextPlaced,
          selectedPlacedIndex: newIndex,
        });
        clearPlacementBlockedWarning();
      } else {
        // Final confirmation drop is blocked by overlap; show user guidance.
        showPlacementBlockedWarning(
          "You are placing on an item. Please move it aside."
        );
      }
      useDragNDropStore.setState({
        floorPoint: { x: 10000000000000, y: 10000000000000, z: 10000000000000 },
        selectedDeckItem: null,
      });

      isPointerDownRef.current = false;
    }

    floorDragStartPositionRef.current = null;
    originalCabinetPositionRef.current = null;
  };

  const handlePointerDown = (e) => {
    e.stopPropagation();
    pointerDownOnPlacedItemRef.current = false;
    isPointerDownRef.current = true;
  };

  /** Only cover walls while library floor ghost or floor drag is active — avoids stealing wall clicks the rest of the time. */
  const showWallRayReceivers =
    selectedDeckItem?.itemType === "floor" || isFloorDragEnabled;

  return (
    <>
      <mesh
        position={[0, 0.0001, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerDown={handlePointerDown}
        userData={{ rayReceiver: "floor" }}
      >
        <planeGeometry args={[floorWidth, floorLength]} />
        <meshBasicMaterial
          color="yellow"
          transparent
          opacity={0.0005}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      {showWallRayReceivers && !disabledWallMap.front && (
        <mesh
          userData={{ rayReceiver: "wall", wallLabel: "front" }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerDown={handlePointerDown}
        >
          <custom4PointPlane args={frontWallArgs} />
          <meshBasicMaterial
            color="yellow"
            transparent
            opacity={0.0005}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      )}
      {showWallRayReceivers && !disabledWallMap.right && (
        <mesh
          userData={{ rayReceiver: "wall", wallLabel: "right" }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerDown={handlePointerDown}
        >
          <custom4PointPlane args={rightWallArgs} />
          <meshBasicMaterial
            color="yellow"
            transparent
            opacity={0.0005}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      )}
      {showWallRayReceivers && !disabledWallMap.back && (
        <mesh
          userData={{ rayReceiver: "wall", wallLabel: "back" }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerDown={handlePointerDown}
        >
          <custom4PointPlane args={backWallArgs} />
          <meshBasicMaterial
            color="yellow"
            transparent
            opacity={0.0005}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      )}
      {showWallRayReceivers && !disabledWallMap.left && (
        <mesh
          userData={{ rayReceiver: "wall", wallLabel: "left" }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerDown={handlePointerDown}
        >
          <custom4PointPlane args={leftWallArgs} />
          <meshBasicMaterial
            color="yellow"
            transparent
            opacity={0.0005}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      )}
    </>
  );
};
export default RayReceiverFloorPlane;
