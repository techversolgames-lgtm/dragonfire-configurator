//package imports
import { useEffect, useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Merged } from "@react-three/drei";

//local imports
import useDragNDropStore from "@/stores/useDragNDropStore";
import {
  items,
  worktableOptions,
  reverseIdMap,
} from "@/data/DragonfireTools/cabinetItems";
import xzNormalToRotationAngle from "@/utils/xzNormalToRotationAngle";
import useAnimationStore from "@/stores/useAnimationStore";
import {
  getRoomDescriptor,
  getWallPlanesFromDescriptor,
} from "@/data/DragonfireTools/roomDefinition";

//import new dummy models
import cabinetModelsMap from "./CabinetModelComponents";
import {
  FLOOR_Y,
  getFloorCabinetBaseY,
  getBaseOptionForFloorCabinet,
  getFloorOffsetY,
} from "./CabinetModelComponents/CabinetFeet";
import {
  SNAP_DISTANCE_THRESHOLD_WALL,
  getOtherWallCabinetsExtents,
  computeWallToWallSnapOffset,
  wallSnapTo3DOffset,
} from "./wallSnapUtils";
import { isRotationGizmoDraggingRef } from "./rotationGizmoState";
import {
  DRAG_THRESHOLD_PX,
  NEAREST_WALL_MAX_DISTANCE,
} from "@/data/DragonfireTools/snapConstants";
import {
  cabinetGroupRefsRef,
  draggedCabinetGroupRef,
  pointerDownOnPlacedItemRef,
  draggedFloorSnapResultRef,
} from "./outlineRefs";
import ItemToWallDimensionLines from "./ItemToWallDimensionLines";
import { applyFloorDropSnap } from "./applyFloorDropSnap";
import { DOOR_BOUNDING_BOX_OFFSET } from "./RoomItemModels/DoorModel";
import {
  SCALE_REFERENCE_ID,
  DEFAULT_SCALE_REFERENCE_PLACEMENT,
} from "./scaleCharacterPlacementSync";

const minWallCabinetY = 1.3+0.07 ;

/** Lerp toward target angle (radians) taking shortest path. t in [0,1] or use delta * speed. */
function lerpAngle(current, target, t) {
  let d = target - current;
  const PI2 = Math.PI * 2;
  if (d > Math.PI) d -= PI2;
  if (d < -Math.PI) d += PI2;
  return current + d * Math.min(1, t);
}

function lerpScalar(current, target, t) {
  return current + (target - current) * Math.min(1, t);
}

/** Default baseOption when placing from library — must match RayReceiverFloorPlane handlePointerUp. */
function getDefaultBaseOptionForLibraryFloorItem(cabinetId) {
  if (cabinetId === 3) return "none";
  if (cabinetId === 9) return "none";
  if (cabinetId === 8 || cabinetId === 10) return "legs";
  if (cabinetId === 1 || cabinetId === 16) return "smallLegs";
  return undefined;
}

const ROTATION_LERP_SPEED = 20;
const POSITION_LERP_SPEED = 20;
const GenerateAllCabinetsInScene = () => {
  const isPointerDownRef = useRef(false);
  const snapNearWallsRef = useRef({
    front: false,
    right: false,
    back: false,
    left: false,
  });
  const dragSnapOffsetRef = useRef({ x: 0, z: 0 });
  const ghostSnapOffsetRef = useRef({ x: 0, y: 0, z: 0 });

  const ghostRotationGroupRef = useRef(null);
  const currentGhostYRef = useRef(0);
  const targetGhostYRef = useRef(0);
  const draggedFloorRotationGroupRef = useRef(null);
  const currentDraggedFloorYRef = useRef(0);
  const targetDraggedFloorYRef = useRef(0);
  const currentDraggedFloorPosRef = useRef({ x: 0, y: 0, z: 0 });
  const draggedFloorPositionGroupRef = useRef(null);
  /** Pending selection: commit on pointer up if move ≤ DRAG_THRESHOLD_PX (click), or on first move > threshold (drag). */
  const pendingSelectionRef = useRef(null);
  const pointerDownPosRef = useRef({ x: 0, y: 0 });

  const height = 1;

  const handlePointerEnter = (_e, _onePosition, _modelPositionInList) => {
    document.body.style.cursor = "pointer";
  };

  const handlePointerLeave = () => {
    document.body.style.cursor = "auto";
  };

  const handlePointerDown = (e, onePosition, modelPositionInList) => {
    const button = e.button ?? e.nativeEvent?.button;
    if (button !== 0) return;
    e.stopPropagation();
    const { itemType } = reverseIdMap[onePosition.cabinetId] || {};

    // Click selection: find the cabinet/room-item group (has userData) so outline and panel show immediately on click
    let positionGroup = null;
    let node = e.eventObject;
    while (node) {
      if (
        node.userData?.isCabinet ||
        node.userData?.isRoomItem ||
        node.userData?.isScaleReference
      ) {
        positionGroup = node;
        break;
      }
      node = node.parent;
    }
    if (!positionGroup && e.eventObject.children?.length) {
      const first = e.eventObject.children[0];
      if (
        first?.userData?.isCabinet ||
        first?.userData?.isRoomItem ||
        first?.userData?.isScaleReference
      ) {
        positionGroup = first;
      }
    }

    // Spec: click = select; drag > 5px = no select on release. Defer selection until pointer up (click) or first move > 5px (drag).
    const domEvent = e.nativeEvent;
    const clientX = domEvent?.clientX ?? 0;
    const clientY = domEvent?.clientY ?? 0;
    pendingSelectionRef.current =
      positionGroup != null
        ? { positionGroup, modelPositionInList }
        : null;
    pointerDownPosRef.current = { x: clientX, y: clientY };

    useDragNDropStore.setState({
      isOrbitControlsEnabled: false,
      isFloorDragEnabled: itemType === "floor",
      isWallDragEnabled: itemType === "wall",
      draggedCabinetIndex: modelPositionInList,
    });

    pointerDownOnPlacedItemRef.current = true;
    document.body.style.cursor = "grabbing";
    isPointerDownRef.current = true;
  };

  const handlePointerUp = (e, onePosition, modelPositionInList) => {
    const button = e.button ?? e.nativeEvent?.button;
    if (button !== 0) return;
    const { placedPositions } = useDragNDropStore.getState();
    let positions = [...placedPositions];
    const pos = positions[modelPositionInList];
    if (pos) {
      const snapOffset = dragSnapOffsetRef.current;
      positions[modelPositionInList] = {
        ...pos,
        position: {
          x: pos.position.x + snapOffset.x,
          y: pos.position.y,
          z: pos.position.z + snapOffset.z,
        },
      };
      if (reverseIdMap[pos.cabinetId]?.itemType === "floor") {
        const snapped = applyFloorDropSnap(
          positions,
          modelPositionInList,
          wallWidthMap,
          reverseIdMap,
        );
        if (snapped) {
          positions[modelPositionInList] = {
            ...positions[modelPositionInList],
            ...snapped,
          };
        }
      }
      useDragNDropStore.setState({ placedPositions: positions });
    }
    dragSnapOffsetRef.current = { x: 0, z: 0 };

    document.body.style.cursor = "grab";
    useDragNDropStore.setState({
      isOrbitControlsEnabled: true,
      isFloorDragEnabled: false,
      isWallDragEnabled: false,
      draggedCabinetIndex: null,
    });

    // Click (no drag): commit deferred selection on pointer up
    if (pendingSelectionRef.current) {
      const { positionGroup, modelPositionInList } =
        pendingSelectionRef.current;
      useDragNDropStore.setState({
        activeSceneItem: positionGroup,
        selectedPlacedIndex: modelPositionInList,
      });
      pendingSelectionRef.current = null;
    }

    isPointerDownRef.current = false;
  };

  // When pointer moves > DRAG_THRESHOLD_PX after down on a cabinet, commit selection so drag can proceed (spec: drag = move only, no select on release)
  useEffect(() => {
    const onPointerMove = (e) => {
      if (!pendingSelectionRef.current || !pointerDownPosRef.current) return;
      const dx = e.clientX - pointerDownPosRef.current.x;
      const dy = e.clientY - pointerDownPosRef.current.y;
      if (
        Math.abs(dx) > DRAG_THRESHOLD_PX ||
        Math.abs(dy) > DRAG_THRESHOLD_PX
      ) {
        const { positionGroup, modelPositionInList } =
          pendingSelectionRef.current;
        useDragNDropStore.setState({
          activeSceneItem: positionGroup,
          selectedPlacedIndex: modelPositionInList,
        });
        pendingSelectionRef.current = null;
      }
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, []);

  // End floor drag when pointer is released anywhere (e.g. on wall), so cabinet drops even if release was not over the cabinet
  useEffect(() => {
    const onGlobalPointerUp = () => {
      const { isFloorDragEnabled, draggedCabinetIndex, placedPositions } =
        useDragNDropStore.getState();
      if (!isFloorDragEnabled || draggedCabinetIndex === null) return;
      const positions = [...placedPositions];
      const pos = positions[draggedCabinetIndex];
      if (pos) {
        const snapOffset = dragSnapOffsetRef.current;
        positions[draggedCabinetIndex] = {
          ...pos,
          position: {
            x: pos.position.x + snapOffset.x,
            y: pos.position.y,
            z: pos.position.z + snapOffset.z,
          },
        };
        const wallWidthValues = useAnimationStore.getState().wallWidthValues;
        const wallWidthMap = {
          front: wallWidthValues?.front ?? 9.144,
          right: wallWidthValues?.right ?? 7.3152,
          back: wallWidthValues?.back ?? 9.144,
          left: wallWidthValues?.left ?? 7.3152,
        };
        const snapped = applyFloorDropSnap(
          positions,
          draggedCabinetIndex,
          wallWidthMap,
          reverseIdMap,
        );
        if (snapped) {
          positions[draggedCabinetIndex] = {
            ...positions[draggedCabinetIndex],
            ...snapped,
          };
        }
        useDragNDropStore.setState({ placedPositions: positions });
      }
      dragSnapOffsetRef.current = { x: 0, z: 0 };
      document.body.style.cursor = "grab";
      useDragNDropStore.setState({
        isOrbitControlsEnabled: true,
        isFloorDragEnabled: false,
        isWallDragEnabled: false,
        draggedCabinetIndex: null,
      });
      isPointerDownRef.current = false;
    };
    window.addEventListener("pointerup", onGlobalPointerUp);
    return () => window.removeEventListener("pointerup", onGlobalPointerUp);
  }, []);

  //#region active states
  const airDragPoint = useDragNDropStore((state) => state.airDragPoint) || {
    x: 10000000000000,
    y: 10000000000000,
    z: 10000000000000,
  };
  const floorPoint = useDragNDropStore((state) => state.floorPoint) || {
    x: 10000000000000,
    y: 10000000000000,
    z: 10000000000000,
  };
  const placedPositions = useDragNDropStore((state) => state.placedPositions);
  const draggedCabinetIndex = useDragNDropStore(
    (state) => state.draggedCabinetIndex,
  );
  const selectedDeckItem = useDragNDropStore((state) => state.selectedDeckItem);
  const dragPointNormal = useDragNDropStore((state) => state.dragPointNormal);
  const showScaleCharacter =
    useAnimationStore((state) => state.showScaleCharacter) ?? false;

  //#region wall plane equations (from structured room descriptor)
  const wallWidthValues = useAnimationStore((state) => state.wallWidthValues);
  const wallHeightValues = useAnimationStore((state) => state.wallHeightValues);

  const { wallPlanes, wallWidthMap } = useMemo(() => {
    const wwMap = {
      front: wallWidthValues?.front ?? 9.144,
      right: wallWidthValues?.right ?? 7.3152,
      back: wallWidthValues?.back ?? 9.144,
      left: wallWidthValues?.left ?? 7.3152,
    };
    const wallHeightMap = {
      front: wallHeightValues?.front ?? 3.048,
      right: wallHeightValues?.right ?? 3.048,
      back: wallHeightValues?.back ?? 3.048,
      left: wallHeightValues?.left ?? 3.048,
    };
    const descriptor = getRoomDescriptor(wwMap, wallHeightMap);
    return {
      wallPlanes: getWallPlanesFromDescriptor(descriptor),
      wallWidthMap: wwMap,
    };
  }, [wallWidthValues, wallHeightValues]);
  //#endregion

  useEffect(() => {
    if (!showScaleCharacter) return;
    const hasScaleReference = placedPositions.some(
      (item) => item?.cabinetId === SCALE_REFERENCE_ID,
    );
    if (hasScaleReference) return;
    useDragNDropStore.setState({
      placedPositions: [
        ...placedPositions,
        { ...DEFAULT_SCALE_REFERENCE_PLACEMENT },
      ],
    });
  }, [placedPositions, showScaleCharacter]);

  useEffect(() => {
    const current = useDragNDropStore.getState().snapNearWalls;
    const next = snapNearWallsRef.current;
    if (
      !current ||
      current.front !== next.front ||
      current.right !== next.right ||
      current.back !== next.back ||
      current.left !== next.left
    ) {
      useDragNDropStore.setState({ snapNearWalls: { ...next } });
    }
    const currGhostSnap = useDragNDropStore.getState().ghostSnapOffset;
    const nextGhostSnap = ghostSnapOffsetRef.current;
    if (
      !currGhostSnap ||
      currGhostSnap.x !== nextGhostSnap.x ||
      currGhostSnap.z !== nextGhostSnap.z
    ) {
      useDragNDropStore.setState({ ghostSnapOffset: { ...nextGhostSnap } });
    }
  });

  // Ensure all cabinet meshes cast and receive shadows (GLB primitives may not by default).
  // Run after layout so refs are populated.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const refs = cabinetGroupRefsRef.current;
      Object.values(refs).forEach((group) => {
        if (group?.traverse) {
          group.traverse((obj) => {
            if (obj.isMesh) {
              obj.castShadow = true;
              obj.receiveShadow = true;
            }
          });
        }
      });
    });
    return () => cancelAnimationFrame(id);
  }, [placedPositions]);

 
  useFrame((state, delta) => {
    const tRot = delta * ROTATION_LERP_SPEED;
    currentGhostYRef.current = lerpAngle(
      currentGhostYRef.current,
      targetGhostYRef.current,
      tRot,
    );
    if (ghostRotationGroupRef.current) {
      ghostRotationGroupRef.current.rotation.y = currentGhostYRef.current;
    }
    const draggedIdx = useDragNDropStore.getState().draggedCabinetIndex;
    if (draggedIdx === null) {
      draggedFloorRotationGroupRef.current = null;
      draggedFloorPositionGroupRef.current = null;
      draggedFloorSnapResultRef.current = null;
    } else {
      const placement = useDragNDropStore.getState().placedPositions[draggedIdx];
      const meta = reverseIdMap[placement?.cabinetId];
      if (meta?.itemType === "wall") {
        draggedFloorRotationGroupRef.current = null;
        draggedFloorPositionGroupRef.current = null;
      } else if (placement && draggedFloorRotationGroupRef.current) {
        const snapRef = draggedFloorSnapResultRef.current;
        const targetPos = snapRef
          ? snapRef.position
          : placement.position;
        const targetRotY = snapRef
          ? snapRef.rotationY
          : placement.dragPointNormal
            ? xzNormalToRotationAngle(placement.dragPointNormal)
            : 0;
        if (!isRotationGizmoDraggingRef.current) {
          currentDraggedFloorYRef.current = targetRotY;
          targetDraggedFloorYRef.current = targetRotY;
          draggedFloorRotationGroupRef.current.rotation.y = targetRotY;
        }
        const tPos = delta * POSITION_LERP_SPEED;
        const targetY = getFloorCabinetBaseY(
          getBaseOptionForFloorCabinet(placement.cabinetId, placement.baseOption),
          placement,
        );
        currentDraggedFloorPosRef.current = {
          x: lerpScalar(
            currentDraggedFloorPosRef.current.x,
            targetPos.x,
            tPos,
          ),
          y: lerpScalar(
            currentDraggedFloorPosRef.current.y,
            targetY,
            tPos,
          ),
          z: lerpScalar(
            currentDraggedFloorPosRef.current.z,
            targetPos.z,
            tPos,
          ),
        };
        if (draggedFloorPositionGroupRef.current) {
          const p = currentDraggedFloorPosRef.current;
          draggedFloorPositionGroupRef.current.position.set(p.x, p.y, p.z);
        }
      }
    }
  });

  //#endregion
  //TODO: add hasLanded variable either as ref or state
  // to prevent jerky jump to the back immediately after landing
  const ghostPosition = selectedDeckItem
    ? floorPoint.x > 100000
      ? airDragPoint
      : floorPoint
    : { x: 10000000000, y: 10000000000, z: 10000000000 };

  const selectedDeckItemColor = selectedDeckItem
    ? reverseIdMap[selectedDeckItem.id].color
    : "red";
  const { boundingBox } = reverseIdMap[selectedDeckItem?.id] || {};
  const {
    width: ghostWidth,
    height: ghostHeight,
    depth: ghostDepth,
  } = boundingBox || {};

  const selectedDeckItemId = selectedDeckItem?.id;
  const isScaleCharacterGhost =
    selectedDeckItemId === SCALE_REFERENCE_ID && !showScaleCharacter;
  const GhostModelComponent = isScaleCharacterGhost
    ? null
    : cabinetModelsMap[selectedDeckItemId];

  const isOnWall = selectedDeckItem?.itemType === "wall";
  const isUpperCorner = selectedDeckItem?.label === "Upper Corner";
  const ghostId = selectedDeckItem?.id;
  const isDoorGhost = ghostId === 101;
  const tvOrWindowGhost = ghostId === 100 || ghostId === 102;
  // Use snapped/corner-aware dragPointNormal for BOTH lower/upper corners.
  // Previously upper corner on wall forced rotation to 0, which ignored custom
  // corner rotation offsets and caused incorrect ghost rotation.
  const yRotationGhost = dragPointNormal
    ? xzNormalToRotationAngle(dragPointNormal)
    : 0;
  targetGhostYRef.current = yRotationGhost;
  // Floor ghost: use same base Y as placed cabinets (FLOOR_Y / legs / smallLegs). floorPoint.y is ~0 from the ray plane, not the visual floor.
  const ghostFloorY =
    selectedDeckItemId != null && !isOnWall
      ? getFloorCabinetBaseY(
          getBaseOptionForFloorCabinet(
            selectedDeckItemId,
            getDefaultBaseOptionForLibraryFloorItem(selectedDeckItemId),
          ),
          { cabinetId: selectedDeckItemId },
        )
      : null;
  const yWallPosition = isOnWall
    ? isDoorGhost
      ? (ghostHeight ?? 2.1) / 2
      : tvOrWindowGhost
        ? ghostPosition.y
        : ghostPosition.y > minWallCabinetY
          ? ghostPosition.y
          : minWallCabinetY
    : ghostFloorY ?? ghostPosition.y;

  // Reset snap near walls and ghost snap offset each render
  snapNearWallsRef.current = {
    front: false,
    right: false,
    back: false,
    left: false,
  };
  ghostSnapOffsetRef.current = { x: 0, y: 0, z: 0 };

  // Ghost wall item: snap to other wall cabinets on same wall (skip snap for room items)
  const isRoomItemGhost = ghostId === 100 || ghostId === 101 || ghostId === 102;
  if (
    GhostModelComponent &&
    selectedDeckItem?.itemType === "wall" &&
    !isRoomItemGhost
  ) {
    const otherExtents = getOtherWallCabinetsExtents(
      placedPositions,
      null,
      dragPointNormal,
      reverseIdMap,
      wallWidthMap,
    );
    const snap = computeWallToWallSnapOffset(
      ghostPosition,
      dragPointNormal,
      ghostWidth ?? 1,
      ghostHeight ?? 1,
      otherExtents,
      SNAP_DISTANCE_THRESHOLD_WALL,
    );
    ghostSnapOffsetRef.current = wallSnapTo3DOffset(snap);
  }

  // Ghost floor: store floorPoint is already the snapped position (from RayReceiverFloorPlane runGhostUpdate + computeFloorSnapResult). Render at ghostPosition with no offset so ghost and placement match.
  // Corner cabinets (Lower Corner): no wall/edge snap — they only snap to pink corner points (locked).
  if (GhostModelComponent && selectedDeckItem?.itemType !== "wall") {
    // ghostSnapOffsetRef stays { x: 0, y: 0, z: 0 } for floor — floorPoint is already snapped
  }

  return (
    <>
      {GhostModelComponent && (
        <group
          position={[
            ghostPosition.x + ghostSnapOffsetRef.current.x,
            0,
            ghostPosition.z + ghostSnapOffsetRef.current.z,
          ]}
        >
          <group
            position={[
              0,
              isOnWall
                ? (isDoorGhost || tvOrWindowGhost)
                  ? yWallPosition + (ghostSnapOffsetRef.current.y ?? 0)
                  : Math.max(
                      minWallCabinetY,
                      yWallPosition + (ghostSnapOffsetRef.current.y ?? 0),
                    )
                : yWallPosition + (ghostSnapOffsetRef.current.y ?? 0),
              0,
            ]}
          >
            <group ref={ghostRotationGroupRef} rotation={[0, 0, 0]}>
              <GhostModelComponent isGhost />
            </group>
          </group>
        </group>
      )}
      {placedPositions.map((onePosition, _) => {
        //log onePosition
        // console.log(
        //   "onePosition",
        //   onePosition,
        //   reverseIdMap[onePosition.cabinetId],
        // );

        //log reverseIdMap[onePosition.cabinetId]

        const {
          position: { x, y, z },
          dragPointNormal,
        } = onePosition;
        const {
          boundingBox: { width, height, depth },
          itemType,
          label,
        } = reverseIdMap[onePosition.cabinetId] || {};
        // Floor items: rotate only when stored (snapped to wall). No rotation from cursor/position.
        const yRotation =
          dragPointNormal
            ? xzNormalToRotationAngle(dragPointNormal)
            : 0;
        // console.log("reverseIdMap ", label);
        const ModelComponent = cabinetModelsMap[onePosition.cabinetId];
        if (!ModelComponent) return null;

        const isOnWall = itemType === "wall";

        // Dragged floor item: store position is already snapped (runFloorDragUpdate uses computeFloorSnapResult). No visual offset.
        let dragSnapOffX = 0;
        let dragSnapOffZ = 0;
        // Dragged floor item: position is from computeFloorSnapResult (corner cabinets only snap to pink corner points, no wall snap).
        if (_ === draggedCabinetIndex && itemType !== "wall") {
          dragSnapOffsetRef.current = { x: 0, z: 0 };
        }

        const placedId = onePosition.cabinetId;
        const isDoor = placedId === 101;
        const tvOrWindow = placedId === 100 || placedId === 102;
        const isRoomItemPlaced = placedId === 100 || placedId === 101 || placedId === 102;

        const effectiveWidth = onePosition.roomItemWidth ?? width;
        const effectiveHeight = onePosition.roomItemHeight ?? height;
        // Door base is anchored to floor (FLOOR_Y); center = FLOOR_Y + height/2
        const effectiveY =
          isDoor
            ? FLOOR_Y + effectiveHeight / 2
            : onePosition.roomItemY != null
              ? onePosition.roomItemY
              : y;

        const yWallPosition = isOnWall
          ? isRoomItemPlaced
            ? effectiveY
            : y > minWallCabinetY
              ? y
              : minWallCabinetY
          : getFloorCabinetBaseY(
                getBaseOptionForFloorCabinet(
                  onePosition.cabinetId,
                  onePosition.baseOption,
                ),
                onePosition,
              );

        const roomItemScale =
          isRoomItemPlaced && (onePosition.roomItemWidth != null || onePosition.roomItemHeight != null)
            ? [effectiveWidth / width, effectiveHeight / height, 1]
            : null;

        return (
          <group
            key={_}
            onPointerEnter={(e) => handlePointerEnter(e, onePosition, _)}
            onPointerLeave={(e) => handlePointerLeave(e, onePosition, _)}
            onPointerDown={(e) => handlePointerDown(e, onePosition, _)}
            onPointerUp={(e) => handlePointerUp(e, onePosition, _)}
          >
            <group
              ref={(el) => {
                if (el) cabinetGroupRefsRef.current[_] = el;
                if (_ === draggedCabinetIndex && el)
                  draggedCabinetGroupRef.current = el;
                if (_ === draggedCabinetIndex && !isOnWall && el) {
                  const isNewCabinet = draggedFloorPositionGroupRef.current !== el;
                  draggedFloorPositionGroupRef.current = el;
                  if (isNewCabinet) {
                    currentDraggedFloorPosRef.current = {
                      x: x + dragSnapOffX,
                      y: yWallPosition,
                      z: z + dragSnapOffZ,
                    };
                  }
                }
              }}
              position={
                _ === draggedCabinetIndex && !isOnWall
                  ? [
                      currentDraggedFloorPosRef.current.x,
                      currentDraggedFloorPosRef.current.y,
                      currentDraggedFloorPosRef.current.z,
                    ]
                  : [x + dragSnapOffX, yWallPosition, z + dragSnapOffZ]
              }
              userData={{
                itemType,
                cabinetId: onePosition.cabinetId,
                boundingBoxHeight: effectiveHeight,
                boundingBoxWidth: effectiveWidth,
                boundingBoxDepth: depth,
                boundingBoxYOffset: isOnWall ? 0 : getFloorOffsetY(
                  getBaseOptionForFloorCabinet(onePosition.cabinetId, onePosition.baseOption)
                ),
                isCabinet: onePosition.cabinetId >= 1 && onePosition.cabinetId <= 22,
                isRoomItem:
                  onePosition.cabinetId === 100 ||
                  onePosition.cabinetId === 101 ||
                  onePosition.cabinetId === 102,
                isScaleReference: onePosition.cabinetId === SCALE_REFERENCE_ID,
                placedIndex: _,
                ...(isDoor ? { boundingBoxLocalOffset: DOOR_BOUNDING_BOX_OFFSET } : {}),
              }}
            >
              <group
                ref={(el) => {
                  if (_ === draggedCabinetIndex && !isOnWall && el) {
                    draggedFloorRotationGroupRef.current = el;
                    targetDraggedFloorYRef.current = yRotation;
                    currentDraggedFloorYRef.current = yRotation;
                  }
                }}
                rotation={[
                  0,
                  _ === draggedCabinetIndex && !isOnWall
                    ? currentDraggedFloorYRef.current
                    : yRotation,
                  0,
                ]}
                scale={roomItemScale || [1, 1, 1]}
              >
                {/* Full-volume hitbox so any visible cabinet area (top/center/bottom/front/back) starts drag reliably. */}
                <mesh
                  position={[0, (isOnWall ? 0 : getFloorOffsetY(getBaseOptionForFloorCabinet(onePosition.cabinetId, onePosition.baseOption))) + effectiveHeight / 2, 0]}
                  visible={false}
                >
                  <boxGeometry args={[effectiveWidth, effectiveHeight, depth]} />
                  <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>
                {/* Keep model pickable so child meshes (handles/logos/top panels) still resolve to this draggable root. */}
                <group>
                  <ModelComponent
                    modelPositionInList={_}
                    placement={onePosition}
                  />
                </group>
              </group>
            </group>
          </group>
        );
      })}
      <ItemToWallDimensionLines />
      {/**Intancing prep */}
      {/* <Merged></Merged> */}
    </>
  );
};

export default GenerateAllCabinetsInScene;
