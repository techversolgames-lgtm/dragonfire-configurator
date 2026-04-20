import * as THREE from "three";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import useAnimationStore from "@/stores/useAnimationStore";
import { Outlines, useTexture } from "@react-three/drei";
import { useRef, useState, useMemo, useEffect } from "react";
import { extend, useFrame, useLoader, useThree } from "@react-three/fiber";
import Custom4PointPlane from "@/utils/Custom4PointPlane.js";
import computeQuadPoints, {
  getQuadHeights,
} from "@/utils/computeQuadPoints.js";
import useDragNDropStore from "@/stores/useDragNDropStore";
import {
  tabsDataMap,
  reverseIdMap,
} from "@/data/DragonfireTools/cabinetItems";
import {
  SNAP_DISTANCE_THRESHOLD_WALL,
  getInwardNormalForWall,
  getOtherWallCabinetsExtents,
  computeWallToWallSnapOffset,
  wallSnapTo3DOffset,
  WALL_SNAP_GAP,
  snapPointToWallPlane,
  clampWallCabinetPositionToWallBounds,
  clampFloorPositionToRoom,
} from "./wallSnapUtils";
import { FLOOR_Y } from "./CabinetModelComponents/CabinetFeet";
import {
  pointerDownOnPlacedItemRef,
  libraryFloorPointerHandlersRef,
} from "./outlineRefs";
import {
  DEFAULT_FLOOR_MATERIAL_ID,
  resolveFloorMaterial,
  getDefaultFloorMaterial,
} from "@/data/DragonfireTools/floorMaterialLibrary";
import { TOUCH_EPSILON } from "@/data/DragonfireTools/snapConstants";
import { getPlacedItemWorldAABB } from "@/data/DragonfireTools/snapSolver";
import { getCornerSnapPoints } from "@/data/DragonfireTools/cornerSnapPoints";
import { computeCornerSnapResult } from "./cornerSnapUtils";

extend({ Custom4PointPlane });

const startMousePosition = new THREE.Vector2();

const endMousePosition = new THREE.Vector2();

const wallDragDisplacementVector = new THREE.Vector3();

const minAllowedOrbitDistance = 1; //pixel
const minWallCabinetY = 1.37 ;
const dragFallbackRaycaster = new THREE.Raycaster();

function isUpperCornerCabinet(meta) {
  return meta?.label === "Upper Corner";
}

function aabbOverlaps3D(a, b, epsilon = TOUCH_EPSILON) {
  if (!a || !b) return false;
  const overlapX = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
  const overlapY = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY);
  const overlapZ = Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ);
  return overlapX > epsilon && overlapY > epsilon && overlapZ > epsilon;
}

const RoomModel = () => {
  // const roomWidth = useAnimationStore((state) => state.roomWidth) || 10;
  // const roomLength = useAnimationStore((state) => state.roomLength) || 10;
  // const roomHeight = useAnimationStore((state) => state.roomHeight) || 2.5;
  const selectedWall = useAnimationStore((state) => state.selectedWall);
  const selectedWallName = useAnimationStore((state) => state.selectedWallName);
  const selectedDeckItem = useDragNDropStore((state) => state.selectedDeckItem);
  const isWallDragEnabled = useDragNDropStore(
    (state) => state.isWallDragEnabled,
  );
  const snapNearWalls = useDragNDropStore((state) => state.snapNearWalls);

  const wallHeightValues = useAnimationStore((state) => state.wallHeightValues);
  const wallWidthValues = useAnimationStore((state) => state.wallWidthValues);
  const disabledWallValues = useAnimationStore(
    (state) => state.disabledWallValues,
  );
  const floorMaterialId =
    useAnimationStore((state) => state.floorMaterialId) ?? DEFAULT_FLOOR_MATERIAL_ID;
  const floorTextureTileX =
    useAnimationStore((state) => state.floorTextureTileX) ?? 8;
  const floorTextureTileY =
    useAnimationStore((state) => state.floorTextureTileY) ?? 8;
  const floorDisplacementScale =
    useAnimationStore((state) => state.floorDisplacementScale) ?? 0.1;

  const floorMaterialDef = resolveFloorMaterial(floorMaterialId);
  const defaultFloorMaterial = getDefaultFloorMaterial();
  const useExrFallback = floorMaterialDef.useExrFallback === true;
  const { camera } = useThree();

  let isPointerDown = false;

  const wallDragStartPositionRef = useRef(null);
  const originalCabinetPositionRef = useRef(null);
  const wallDragStartWallLabelRef = useRef(null);

  const wallHeightMap = {
    left: wallHeightValues?.left || 3.048,
    right: wallHeightValues?.right || 3.048,
    front: wallHeightValues?.front || 3.048,
    back: wallHeightValues?.back || 3.048,
    floor: 0,
  };

  const wallWidthMap = {
    left: wallWidthValues?.left || 7.3152,
    right: wallWidthValues?.right || 7.3152,
    front: wallWidthValues?.front || 9.144,
    back: wallWidthValues?.back || 9.144,
    floor: 0,
  };
  const disabledWallMap = {
    left: disabledWallValues?.left || false,
    right: disabledWallValues?.right || false,
    front: disabledWallValues?.front || false,
    back: disabledWallValues?.back || false,
    floor: 0,
  };
  //#region compute wall points
  //optimize updates
  const {
    floorPlaneArgs,
    frontWallArgs,
    rightWallArgs,
    backWallArgs,
    leftWallArgs,
  } = useMemo(() => {
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

    /******* cube points **********/
    const floorP1 = new THREE.Vector3(p1xy.x, FLOOR_Y, -p1xy.y); //z axis is inverted
    const floorP2 = new THREE.Vector3(p2xy.x, FLOOR_Y, -p2xy.y); //z axis is inverted
    const floorP3 = new THREE.Vector3(p3xy.x, FLOOR_Y, -p3xy.y); //z axis is inverted
    const floorP4 = new THREE.Vector3(p4xy.x, FLOOR_Y, -p4xy.y); //z axis is inverted

    const roofP1 = new THREE.Vector3(p1xy.x, p1z, -p1xy.y); //z axis is inverted
    const roofP2 = new THREE.Vector3(p2xy.x, p2z, -p2xy.y); //z axis is inverted
    const roofP3 = new THREE.Vector3(p3xy.x, p3z, -p3xy.y); //z axis is inverted
    const roofP4 = new THREE.Vector3(p4xy.x, p4z, -p4xy.y); //z axis is inverted
    /******************************/
    //package points as params

    const floorPlaneArgs = [floorP1, floorP2, floorP3, floorP4, false];

    const frontWallArgs = [floorP1, floorP2, roofP2, roofP1, false];
    const rightWallArgs = [floorP2, floorP3, roofP3, roofP2, false];
    const backWallArgs = [floorP3, floorP4, roofP4, roofP3, false];
    const leftWallArgs = [floorP4, floorP1, roofP1, roofP4, false];
    return {
      floorPlaneArgs,
      frontWallArgs,
      rightWallArgs,
      backWallArgs,
      leftWallArgs,
    };
  }, [wallHeightValues, wallWidthValues]);
  //#endregion

  /******************************/

  const maxWallLength = Math.max(
    wallWidthMap.left,
    wallWidthMap.right,
    wallWidthMap.front,
    wallWidthMap.back,
  );

  const frontWallRef = useRef();
  const backWallRef = useRef();
  const leftWallRef = useRef();
  const rightWallRef = useRef();
  const floorRef = useRef();
  const testWallRef = useRef();

  const wallRefs = {
    front: frontWallRef,
    back: backWallRef,
    left: leftWallRef,
    right: rightWallRef,
    floor: floorRef,
  };

  const runWallDragUpdate = (point, wallLabel) => {
    const isActualWall =
      wallLabel === "front" ||
      wallLabel === "back" ||
      wallLabel === "left" ||
      wallLabel === "right";
    if (!isWallDragEnabled) return;

    const { placedPositions, draggedCabinetIndex } =
      useDragNDropStore.getState();

    if (!wallDragStartPositionRef.current) {
      wallDragStartPositionRef.current = point;
      // Remember which wall the drag started on so room items (TV/Door/Window)
      // cannot detach if pointer moves onto the floor mesh during drag.
      if (isActualWall) wallDragStartWallLabelRef.current = wallLabel;
      // Store the original cabinet position when drag starts
      if (
        draggedCabinetIndex !== null &&
        placedPositions[draggedCabinetIndex]
      ) {
        originalCabinetPositionRef.current = {
          ...placedPositions[draggedCabinetIndex].position,
        };
      }
    }

    wallDragDisplacementVector.subVectors(
      point,
      wallDragStartPositionRef.current,
    );

    if (
      draggedCabinetIndex !== null &&
      placedPositions[draggedCabinetIndex] &&
      originalCabinetPositionRef.current
    ) {
      const draggedCabinet = placedPositions[draggedCabinetIndex];
      const id = draggedCabinet.cabinetId;
      const isRoomItem = id === 100 || id === 101 || id === 102;

      const activeWallLabel = isActualWall
        ? wallLabel
        : wallDragStartWallLabelRef.current;
      const activeWallIsActual =
        activeWallLabel === "front" ||
        activeWallLabel === "back" ||
        activeWallLabel === "left" ||
        activeWallLabel === "right";

      // When over a wall: use that wall's inward normal so cabinet/room item auto-rotates and snaps to the new wall
      // When over floor/ceiling: keep current normal so item doesn't flip
      const inwardNormal = activeWallIsActual
        ? getInwardNormalForWall(activeWallLabel, wallWidthMap)
        : null;
      if (inwardNormal) {
        const { dragPointNormal } = useDragNDropStore.getState();
        if (
          inwardNormal.x !== dragPointNormal?.x ||
          inwardNormal.y !== dragPointNormal?.y ||
          inwardNormal.z !== dragPointNormal?.z
        ) {
          useDragNDropStore.setState({
            dragPointNormal: inwardNormal,
          });
        }
      }

      const wallNormal =
        inwardNormal ?? draggedCabinet.dragPointNormal;

      let rawPosition = {
        x:
          originalCabinetPositionRef.current.x +
          wallDragDisplacementVector.x,
        y:
          originalCabinetPositionRef.current.y +
          wallDragDisplacementVector.y,
        z:
          originalCabinetPositionRef.current.z +
          wallDragDisplacementVector.z,
      };

      // Room items: snap to actual wall plane so they stay flush on the wall at all times
      if (isRoomItem) {
        if (activeWallIsActual) {
          rawPosition = snapPointToWallPlane(
            rawPosition,
            activeWallLabel,
            wallWidthMap,
          );
        }
      }

      const meta = reverseIdMap[draggedCabinet.cabinetId];
      const { width, height } = meta?.boundingBox || { width: 1, height: 1 };
      const isUpperCorner = isUpperCornerCabinet(meta);

      let snappedCornerNormal = null;
      if (isUpperCorner) {
        const cornerSnap = computeCornerSnapResult({
          desiredPosition: rawPosition,
          rotationY: wallNormal
            ? Math.atan2(wallNormal.x, wallNormal.z)
            : 0,
          dimensions: { width, depth: meta?.boundingBox?.depth ?? 1 },
          cornerSnapPoints: getCornerSnapPoints(wallWidthMap, "upper"),
          wallWidthMap,
          forceSnapToNearestCorner: true,
        });
        rawPosition = {
          ...rawPosition,
          x: cornerSnap.position.x,
          z: cornerSnap.position.z,
        };
        // Dedicated upper-corner wall clamp: keep footprint fully inside room
        // even when per-corner offsets are tuned aggressively.
        rawPosition = clampFloorPositionToRoom(
          rawPosition,
          width,
          meta?.boundingBox?.depth ?? 1,
          Math.atan2(
            cornerSnap.dragPointNormal?.x ?? wallNormal?.x ?? 0,
            cornerSnap.dragPointNormal?.z ?? wallNormal?.z ?? 1,
          ),
          wallWidthMap,
        );
        snappedCornerNormal = cornerSnap.dragPointNormal;
      }

      const snapNormal = snappedCornerNormal ?? wallNormal;
      let offset = { x: 0, y: 0, z: 0 };
      if (!isRoomItem && snapNormal) {
        const otherExtents = getOtherWallCabinetsExtents(
          placedPositions,
          draggedCabinetIndex,
          snapNormal,
          reverseIdMap,
          wallWidthMap,
        );
        const snap = computeWallToWallSnapOffset(
          rawPosition,
          snapNormal,
          width,
          height,
          otherExtents,
          SNAP_DISTANCE_THRESHOLD_WALL,
        );
        offset = wallSnapTo3DOffset(snap);
      }
      const isDoor = id === 101;
      const tvOrWindow = id === 100 || id === 102;
      const gapX = isRoomItem || isUpperCorner ? 0 : wallNormal.x * WALL_SNAP_GAP;
      const gapZ = isRoomItem || isUpperCorner ? 0 : wallNormal.z * WALL_SNAP_GAP;
      const position = {
        x: rawPosition.x + offset.x + gapX,
        y: isDoor
          ? FLOOR_Y + height / 2
          : tvOrWindow
            ? rawPosition.y + offset.y
            : Math.max(minWallCabinetY, rawPosition.y + offset.y),
        z: rawPosition.z + offset.z + gapZ,
      };
      const boundedPosition =
        !isRoomItem && !isUpperCorner && activeWallIsActual
          ? clampWallCabinetPositionToWallBounds(
              position,
              activeWallLabel,
              wallWidthMap,
              width,
            )
          : position;

      const candidatePlacement = {
        ...draggedCabinet,
        position: boundedPosition,
        dragPointNormal: snappedCornerNormal ?? wallNormal,
      };
      const candidateAABB = getPlacedItemWorldAABB(candidatePlacement, meta);
      const overlapsUpperCorner = placedPositions.some((placed, idx) => {
        if (idx === draggedCabinetIndex) return false;
        const placedMeta = reverseIdMap[placed?.cabinetId];
        if (!isUpperCornerCabinet(placedMeta)) return false;
        const placedAABB = getPlacedItemWorldAABB(placed, placedMeta);
        return aabbOverlaps3D(candidateAABB, placedAABB);
      });
      if (overlapsUpperCorner) {
        // Block wall drag updates that would penetrate/overlap Upper Corner.
        return;
      }

      const updatedPositions = [...placedPositions];
      const updatedPlacement = {
        ...candidatePlacement,
      };
      // Keep slider-based wall height in sync with live drag movement.
      // Without this, TV/Window can appear locked vertically after using "Height on wall".
      if (isRoomItem) {
        updatedPlacement.roomItemY = boundedPosition.y;
      }
      updatedPositions[draggedCabinetIndex] = updatedPlacement;

      useDragNDropStore.setState({
        placedPositions: updatedPositions,
      });
    }
  };

  /** Wall texture: tiles per metre so bricks keep correct aspect on each wall (no UV stretch). */
  const WALL_TILES_PER_METRE = 1;

  const floorExrPaths = useMemo(
    () =>
      useExrFallback
        ? [defaultFloorMaterial.normalMap, defaultFloorMaterial.roughnessMap]
        : [floorMaterialDef.normalMap, floorMaterialDef.roughnessMap],
    [
      useExrFallback,
      floorMaterialDef.normalMap,
      floorMaterialDef.roughnessMap,
      defaultFloorMaterial.normalMap,
      defaultFloorMaterial.roughnessMap,
    ]
  );
  const [floorDiffMap] = useTexture([
    floorMaterialDef.albedoMap ?? defaultFloorMaterial.albedoMap,
  ]);
  const [wallDiffMap, wallNormMap, wallHeightTex, wallRoughMap] = useTexture([
    "/textures/WallTiles/White_Bricks_Ceramic_Wall_basecolor.jpg",
    "/textures/WallTiles/White_Bricks_Ceramic_Wall_normal.jpg",
    "/textures/WallTiles/White_Bricks_Ceramic_Wall_height.jpg",
    "/textures/WallTiles/White_Bricks_Ceramic_Wall_roughness.jpg",
  ]);
  const [floorNormMap, floorRoughMap] = useLoader(EXRLoader, floorExrPaths);

  useEffect(() => {
    const tileX = floorTextureTileX;
    const tileY = floorTextureTileY;
    if (floorDiffMap) {
      floorDiffMap.colorSpace = THREE.SRGBColorSpace;
      floorDiffMap.wrapS = floorDiffMap.wrapT = THREE.RepeatWrapping;
      floorDiffMap.repeat.set(tileX, tileY);
    }
    if (floorNormMap) {
      floorNormMap.wrapS = floorNormMap.wrapT = THREE.RepeatWrapping;
      floorNormMap.repeat.set(tileX, tileY);
    }
    if (floorRoughMap) {
      floorRoughMap.wrapS = floorRoughMap.wrapT = THREE.RepeatWrapping;
      floorRoughMap.repeat.set(tileX, tileY);
    }
  }, [
    floorDiffMap,
    floorNormMap,
    floorRoughMap,
    floorTextureTileX,
    floorTextureTileY,
  ]);

  useEffect(() => {
    wallDiffMap.colorSpace = THREE.SRGBColorSpace;
    [wallDiffMap, wallNormMap, wallHeightTex, wallRoughMap].forEach((tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    });
  }, [wallDiffMap, wallNormMap, wallHeightTex, wallRoughMap]);

  const wallTextureSetsRef = useRef(null);
  const wallTextureSets = useMemo(() => {
    const prev = wallTextureSetsRef.current;
    if (prev) {
      ["front", "right", "back", "left"].forEach((name) => {
        const s = prev[name];
        if (s) {
          s.map?.dispose();
          s.normalMap?.dispose();
          s.displacementMap?.dispose();
          s.roughnessMap?.dispose();
        }
      });
    }
    const sets = {};
    ["front", "right", "back", "left"].forEach((name) => {
      const w = wallWidthMap[name];
      const h = wallHeightMap[name];
      const repeatX = w * WALL_TILES_PER_METRE;
      const repeatY = h * WALL_TILES_PER_METRE;
      const map = wallDiffMap.clone();
      const normalMap = wallNormMap.clone();
      const displacementMap = wallHeightTex.clone();
      const roughnessMap = wallRoughMap.clone();
      [map, normalMap, displacementMap, roughnessMap].forEach((tex) => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(repeatX, repeatY);
      });
      map.colorSpace = THREE.SRGBColorSpace;
      sets[name] = { map, normalMap, displacementMap, roughnessMap };
    });
    wallTextureSetsRef.current = sets;
    return sets;
  }, [
    wallDiffMap,
    wallNormMap,
    wallHeightTex,
    wallRoughMap,
    wallWidthMap.front,
    wallWidthMap.right,
    wallWidthMap.back,
    wallWidthMap.left,
    wallHeightMap.front,
    wallHeightMap.right,
    wallHeightMap.back,
    wallHeightMap.left,
  ]);

  const handleClick = (e, wallLabel) => {
    //measure distance to prevent orbit clicks
    const distance = startMousePosition.distanceTo(endMousePosition);
    if (distance < minAllowedOrbitDistance) {
      // Don't clear cabinet selection if the user clicked a cabinet and released over floor/wall (keep outline)
      const wasPlacedItemClick = pointerDownOnPlacedItemRef.current;
      pointerDownOnPlacedItemRef.current = false;

      if (wallLabel === "floor") {
        useAnimationStore.setState({ selectedWall: null });
        if (!wasPlacedItemClick) {
          useDragNDropStore.setState({
            activeSceneItem: null,
            selectedPlacedIndex: null,
          });
        }
      } else if (selectedWall === wallRefs[wallLabel]) {
        useAnimationStore.setState({ selectedWall: null });
        if (!wasPlacedItemClick) {
          useDragNDropStore.setState({
            activeSceneItem: null,
            selectedPlacedIndex: null,
          });
        }
      } else {
        useAnimationStore.setState({
          selectedWall: wallRefs[wallLabel],
          selectedWallName: wallLabel,
        });
        if (!wasPlacedItemClick) {
          useDragNDropStore.setState({
            activeSceneItem: null,
            selectedPlacedIndex: null,
          });
        }
      }
    } else {
      // console.log("too big");
    }
  };

  const onPointerMove = (e, wallLabel) => {
    const selectedDeckItem = useDragNDropStore.getState().selectedDeckItem;

    const {
      object: { userData },
    } = e;

    const itemType = selectedDeckItem?.itemType;
    const { point } = e;

    const isActualWall =
      wallLabel === "front" ||
      wallLabel === "back" ||
      wallLabel === "left" ||
      wallLabel === "right";

    if (itemType === "wall" && isActualWall) {
      // Only update ghost position when over a wall so TV/Door/Window stay wall-only
      const selectedMeta = selectedDeckItem ? reverseIdMap[selectedDeckItem.id] : null;
      const upperCornerGhost = isUpperCornerCabinet(selectedMeta);

      // Use inward-pointing normal (toward room/ground) so cabinet rotates and snaps to the wall side correctly.
      // Upper Corner is corner-locked: snap ghost to nearest room corner point.
      let inwardNormal = getInwardNormalForWall(wallLabel, wallWidthMap);
      let ghostPoint = point;
      if (upperCornerGhost) {
        const dims = selectedMeta?.boundingBox
          ? { width: selectedMeta.boundingBox.width, depth: selectedMeta.boundingBox.depth }
          : { width: 1, depth: 1 };
        const cornerSnap = computeCornerSnapResult({
          desiredPosition: point,
          rotationY: Math.atan2(inwardNormal.x, inwardNormal.z),
          dimensions: dims,
          cornerSnapPoints: getCornerSnapPoints(wallWidthMap, "upper"),
          wallWidthMap,
          forceSnapToNearestCorner: true,
        });
        ghostPoint = {
          x: cornerSnap.position.x,
          y: point.y,
          z: cornerSnap.position.z,
        };
        inwardNormal = cornerSnap.dragPointNormal;
      }

      useDragNDropStore.setState({
        floorPoint: ghostPoint,
      });

      const { dragPointNormal } = useDragNDropStore.getState();
      if (
        inwardNormal.x !== dragPointNormal?.x ||
        inwardNormal.y !== dragPointNormal?.y ||
        inwardNormal.z !== dragPointNormal?.z
      ) {
        useDragNDropStore.setState({
          dragPointNormal: inwardNormal,
        });
      }

      // console.log("wall label Moving", e);
    }

    // Handle wall cabinet dragging
    runWallDragUpdate(point, wallLabel);
  };

  useFrame((state) => {
    if (!isWallDragEnabled) return;
    const dragIdx = useDragNDropStore.getState().draggedCabinetIndex;
    if (dragIdx == null) return;

    dragFallbackRaycaster.setFromCamera(state.pointer, camera);
    const wallTargets = [
      { label: "front", mesh: frontWallRef.current },
      { label: "back", mesh: backWallRef.current },
      { label: "left", mesh: leftWallRef.current },
      { label: "right", mesh: rightWallRef.current },
      { label: "floor", mesh: floorRef.current },
    ].filter((entry) => entry.mesh);
    if (!wallTargets.length) return;

    const intersections = dragFallbackRaycaster.intersectObjects(
      wallTargets.map((entry) => entry.mesh),
      false,
    );
    if (!intersections.length) return;

    const hitObject = intersections[0].object;
    const hitPoint = intersections[0].point;
    const wallHit = wallTargets.find((entry) => entry.mesh === hitObject);
    if (!wallHit) return;

    runWallDragUpdate(hitPoint, wallHit.label);
  });

  const onPointerUp = (e, wallLabel) => {
    endMousePosition.set(e.clientX, e.clientY);

    // Library floor item: commit placement when releasing over a wall (RayReceiver mesh is not hit).
    const deckItemType = selectedDeckItem?.itemType;
    const isRoomWall =
      wallLabel === "front" ||
      wallLabel === "back" ||
      wallLabel === "left" ||
      wallLabel === "right";
    if (deckItemType === "floor" && isRoomWall) {
      libraryFloorPointerHandlersRef.current?.onPointerUp?.(e);
    }

    const { placedPositions } = useDragNDropStore.getState();

    /*************** */
    const itemType = selectedDeckItem?.itemType;
    const isActualWall =
      wallLabel === "front" ||
      wallLabel === "back" ||
      wallLabel === "left" ||
      wallLabel === "right";
    const activeWallLabel =
      isActualWall && itemType === "wall"
        ? wallLabel
        : wallDragStartWallLabelRef.current;
    const activeWallIsActual =
      activeWallLabel === "front" ||
      activeWallLabel === "back" ||
      activeWallLabel === "left" ||
      activeWallLabel === "right";

    if (itemType === "wall" && activeWallIsActual) {
      const inwardNormal = getInwardNormalForWall(activeWallLabel, wallWidthMap);
      const meta = reverseIdMap[selectedDeckItem.id];
      const { width, height } = meta?.boundingBox || { width: 1, height: 1 };
      const isUpperCorner = isUpperCornerCabinet(meta);
      const id = selectedDeckItem.id;
      const isRoomItem = id === 100 || id === 101 || id === 102;
      const pointOnWall = isRoomItem
        ? snapPointToWallPlane(
            { x: e.point.x, y: e.point.y, z: e.point.z },
            activeWallLabel,
            wallWidthMap,
          )
        : null;
      let cornerSnapped = null;
      if (isUpperCorner) {
        cornerSnapped = computeCornerSnapResult({
          desiredPosition: { x: e.point.x, y: e.point.y, z: e.point.z },
          rotationY: Math.atan2(inwardNormal.x, inwardNormal.z),
          dimensions: { width, depth: meta?.boundingBox?.depth ?? 1 },
          cornerSnapPoints: getCornerSnapPoints(wallWidthMap, "upper"),
          wallWidthMap,
          forceSnapToNearestCorner: true,
        });
        const clampedUpper = clampFloorPositionToRoom(
          cornerSnapped.position,
          width,
          meta?.boundingBox?.depth ?? 1,
          Math.atan2(
            cornerSnapped.dragPointNormal?.x ?? inwardNormal.x,
            cornerSnapped.dragPointNormal?.z ?? inwardNormal.z,
          ),
          wallWidthMap,
        );
        cornerSnapped = {
          ...cornerSnapped,
          position: clampedUpper,
        };
      }
      const snapNormal = cornerSnapped?.dragPointNormal ?? inwardNormal;
      let offset = { x: 0, y: 0, z: 0 };
      if (!isRoomItem && snapNormal) {
        const otherExtents = getOtherWallCabinetsExtents(
          placedPositions,
          null,
          snapNormal,
          reverseIdMap,
          wallWidthMap,
        );
        const snap = computeWallToWallSnapOffset(
          cornerSnapped ? cornerSnapped.position : e.point,
          snapNormal,
          width,
          height,
          otherExtents,
          SNAP_DISTANCE_THRESHOLD_WALL,
        );
        offset = wallSnapTo3DOffset(snap);
      }
      const isDoor = id === 101;
      const tvOrWindow = id === 100 || id === 102;
      const gapX = isRoomItem || isUpperCorner ? 0 : inwardNormal.x * WALL_SNAP_GAP;
      const gapZ = isRoomItem || isUpperCorner ? 0 : inwardNormal.z * WALL_SNAP_GAP;
      const position = isRoomItem
        ? {
            x: pointOnWall.x,
            y: isDoor
              ? FLOOR_Y + height / 2
              : tvOrWindow
                ? pointOnWall.y
                : Math.max(minWallCabinetY, pointOnWall.y),
            z: pointOnWall.z,
          }
        : {
            x: (cornerSnapped ? cornerSnapped.position.x : e.point.x) + offset.x + gapX,
            y: isDoor
              ? FLOOR_Y + height / 2
              : tvOrWindow
                ? e.point.y + offset.y
                : Math.max(minWallCabinetY, e.point.y + offset.y),
            z: (cornerSnapped ? cornerSnapped.position.z : e.point.z) + offset.z + gapZ,
          };
      const boundedPosition =
        !isRoomItem && !isUpperCorner
          ? clampWallCabinetPositionToWallBounds(
              position,
              activeWallLabel,
              wallWidthMap,
              width,
            )
          : position;
      const candidatePlacement = {
        cabinetId: selectedDeckItem.id,
        position: boundedPosition,
        dragPointNormal: cornerSnapped?.dragPointNormal ?? inwardNormal,
        ...(isRoomItem ? { roomItemY: boundedPosition.y } : {}),
      };
      const candidateAABB = getPlacedItemWorldAABB(candidatePlacement, meta);
      const overlapsUpperCorner = placedPositions.some((placed) => {
        const placedMeta = reverseIdMap[placed?.cabinetId];
        if (!isUpperCornerCabinet(placedMeta)) return false;
        const placedAABB = getPlacedItemWorldAABB(placed, placedMeta);
        return aabbOverlaps3D(candidateAABB, placedAABB);
      });
      if (overlapsUpperCorner) {
        // Block placement that would penetrate/overlap Upper Corner.
        return;
      }
      const nextPlaced = [
        ...placedPositions,
        candidatePlacement,
      ];
      const newIndex = nextPlaced.length - 1;
      useDragNDropStore.setState({
        placedPositions: nextPlaced,
        selectedPlacedIndex: newIndex,
      });
      useDragNDropStore.setState({
        floorPoint: { x: 10000000000000, y: 10000000000000, z: 10000000000000 },
        selectedDeckItem: null,
      });

      isPointerDown = false;
    }
    /*************** */

    // Reset drag start position and original cabinet position for next drag
    wallDragStartPositionRef.current = null;
    originalCabinetPositionRef.current = null;
    wallDragStartWallLabelRef.current = null;
  };

  const onPointerDown = (e, wallLabel) => {
    pointerDownOnPlacedItemRef.current = false;
    startMousePosition.set(e.clientX, e.clientY);
    isPointerDown = true;
  };

  const onPointerOver = (e, wallLabel) => {
    const {
      object: { userData },
    } = e;
    //log wall label

    if (wallLabel !== "floor") {
      document.body.style.cursor = "pointer";
    }
  };

  const onPointerOut = () => {
    document.body.style.cursor = "default";
  };

  const visibleWallMaterial = (wallName) => {
    const tex = wallTextureSets[wallName];
    if (!tex) return null;
    return (
      <meshPhysicalMaterial
        map={tex.map}
        normalMap={tex.normalMap}
        displacementMap={tex.displacementMap}
        displacementScale={0}
        displacementBias={0}
        roughness={1}
        metalness={0}
        envMapIntensity={0}
        clearcoat={0}
        sheen={0}
        specularIntensity={0}
      />
    );
  };
  const hiddenWallMaterial = (
    <meshStandardMaterial
      color="white"
      transparent={true}
      opacity={0.00005}
      depthWrite={false}
      depthTest={false}
    />
  );

  useEffect(() => {
    // console.log("selectedDeckItem", selectedDeckItem?.itemType, isPointerDown);

    const itemType = selectedDeckItem?.itemType;
    if (itemType === "wall") {
      //log floor position

      //write floor position
      // console.log("selectedDeckItem", selectedDeckItem);
      isPointerDown = true;
    }
  }, [selectedDeckItem]);

  return (
    <>
      {/* Front Wall (closest to camera) — wrapper so clicks on overlay meshes also place */}
      <group
        onClick={(e) => handleClick(e, "front")}
        onPointerDown={(e) => onPointerDown(e, "front")}
        onPointerUp={(e) => onPointerUp(e, "front")}
        onPointerOver={(e) => onPointerOver(e, "front")}
        onPointerOut={onPointerOut}
        onPointerMove={(e) => onPointerMove(e, "front")}
      >
        <mesh ref={frontWallRef} userData={{ type: "wall" }}>
          <custom4PointPlane args={frontWallArgs} />
          {disabledWallMap.front ? hiddenWallMaterial : visibleWallMaterial("front")}
        </mesh>
        <mesh
          userData={{ type: "wall" }}
          position={[0, minWallCabinetY, 0]}
          scale={[1, 0.005, 1]}
          onPointerDown={(e) => onPointerDown(e, "front")}
          onPointerUp={(e) => onPointerUp(e, "front")}
          onPointerMove={(e) => onPointerMove(e, "front")}
        >
          <custom4PointPlane args={frontWallArgs} />
          {disabledWallMap.front ||
          (!selectedDeckItem && !isWallDragEnabled) ||
          (selectedDeckItem?.itemType !== "wall" && !isWallDragEnabled) ? (
            hiddenWallMaterial
          ) : (
            <meshBasicMaterial
              color={"yellow"}
              transparent={true}
              depthTest={false}
              depthWrite={false}
            />
          )}
        </mesh>
        <mesh
          userData={{ type: "wall" }}
          position={[0, 0.05, 0]}
          scale={[1, 0.025, 1]}
          onPointerDown={(e) => onPointerDown(e, "front")}
          onPointerUp={(e) => onPointerUp(e, "front")}
          onPointerMove={(e) => onPointerMove(e, "front")}
        >
          <custom4PointPlane args={frontWallArgs} />
          {snapNearWalls?.front ? (
            <meshBasicMaterial
              color={"#007bff"}
              transparent={true}
              depthTest={false}
              depthWrite={false}
              opacity={0.5}
            />
          ) : (
            hiddenWallMaterial
          )}
        </mesh>
      </group>
      {/* Back Wall (farthest from camera) — wrapper so clicks on overlay meshes also place */}
      <group
        onClick={(e) => handleClick(e, "back")}
        onPointerDown={(e) => onPointerDown(e, "back")}
        onPointerUp={(e) => onPointerUp(e, "back")}
        onPointerOver={(e) => onPointerOver(e, "back")}
        onPointerOut={onPointerOut}
        onPointerMove={(e) => onPointerMove(e, "back")}
      >
        <mesh ref={backWallRef} userData={{ type: "wall" }}>
          <custom4PointPlane args={backWallArgs} />
          {disabledWallMap.back ? hiddenWallMaterial : visibleWallMaterial("back")}
        </mesh>
        <mesh
          userData={{ type: "wall" }}
          position={[0, minWallCabinetY, 0]}
          scale={[1, 0.005, 1]}
          onPointerDown={(e) => onPointerDown(e, "back")}
          onPointerUp={(e) => onPointerUp(e, "back")}
          onPointerMove={(e) => onPointerMove(e, "back")}
        >
          <custom4PointPlane args={backWallArgs} />
          {disabledWallMap.back ||
          (!selectedDeckItem && !isWallDragEnabled) ||
          (selectedDeckItem?.itemType !== "wall" && !isWallDragEnabled) ? (
            hiddenWallMaterial
          ) : (
            <meshBasicMaterial
              color={"yellow"}
              transparent={true}
              depthTest={false}
              depthWrite={false}
            />
          )}
        </mesh>
        <mesh
          userData={{ type: "wall" }}
          position={[0, 0.05, 0]}
          scale={[1, 0.025, 1]}
          onPointerDown={(e) => onPointerDown(e, "back")}
          onPointerUp={(e) => onPointerUp(e, "back")}
          onPointerMove={(e) => onPointerMove(e, "back")}
        >
          <custom4PointPlane args={backWallArgs} />
          {snapNearWalls?.back ? (
            <meshBasicMaterial
              color={"#007bff"}
              transparent={true}
              depthTest={false}
              depthWrite={false}
              opacity={0.5}
            />
          ) : (
            hiddenWallMaterial
          )}
        </mesh>
      </group>
      {/* Left Wall — wrapper so clicks on overlay meshes also place */}
      <group
        onClick={(e) => handleClick(e, "left")}
        onPointerDown={(e) => onPointerDown(e, "left")}
        onPointerUp={(e) => onPointerUp(e, "left")}
        onPointerOver={(e) => onPointerOver(e, "left")}
        onPointerOut={onPointerOut}
        onPointerMove={(e) => onPointerMove(e, "left")}
      >
        <mesh ref={leftWallRef} userData={{ type: "wall" }}>
          <custom4PointPlane args={leftWallArgs} />
          {disabledWallMap.left ? hiddenWallMaterial : visibleWallMaterial("left")}
        </mesh>
        <mesh
          userData={{ type: "wall" }}
          position={[0, minWallCabinetY, 0]}
          scale={[1, 0.005, 1]}
          onPointerDown={(e) => onPointerDown(e, "left")}
          onPointerUp={(e) => onPointerUp(e, "left")}
          onPointerMove={(e) => onPointerMove(e, "left")}
        >
          <custom4PointPlane args={leftWallArgs} />
          {disabledWallMap.left ||
          (!selectedDeckItem && !isWallDragEnabled) ||
          (selectedDeckItem?.itemType !== "wall" && !isWallDragEnabled) ? (
            hiddenWallMaterial
          ) : (
            <meshBasicMaterial
              color={"yellow"}
              transparent={true}
              depthTest={false}
              depthWrite={false}
            />
          )}
        </mesh>
        <mesh
          userData={{ type: "wall" }}
          position={[0, 0.05, 0]}
          scale={[1, 0.025, 1]}
          onPointerDown={(e) => onPointerDown(e, "left")}
          onPointerUp={(e) => onPointerUp(e, "left")}
          onPointerMove={(e) => onPointerMove(e, "left")}
        >
          <custom4PointPlane args={leftWallArgs} />
          {snapNearWalls?.left ? (
            <meshBasicMaterial
              color={"#007bff"}
              transparent={true}
              depthTest={false}
              depthWrite={false}
              opacity={0.5}
            />
          ) : (
            hiddenWallMaterial
          )}
        </mesh>
      </group>
      {/* Right Wall — wrapper so clicks on overlay meshes also place */}
      <group
        onClick={(e) => handleClick(e, "right")}
        onPointerDown={(e) => onPointerDown(e, "right")}
        onPointerUp={(e) => onPointerUp(e, "right")}
        onPointerOver={(e) => onPointerOver(e, "right")}
        onPointerOut={onPointerOut}
        onPointerMove={(e) => onPointerMove(e, "right")}
      >
        <mesh ref={rightWallRef} userData={{ type: "wall" }}>
          <custom4PointPlane args={rightWallArgs} />
          {disabledWallMap.right ? hiddenWallMaterial : visibleWallMaterial("right")}
        </mesh>
        <mesh
          userData={{ type: "wall" }}
          position={[0, minWallCabinetY, 0]}
          scale={[1, 0.005, 1]}
          onPointerDown={(e) => onPointerDown(e, "right")}
          onPointerUp={(e) => onPointerUp(e, "right")}
          onPointerMove={(e) => onPointerMove(e, "right")}
        >
          <custom4PointPlane args={rightWallArgs} />
          {disabledWallMap.right ||
          (!selectedDeckItem && !isWallDragEnabled) ||
          (selectedDeckItem?.itemType !== "wall" && !isWallDragEnabled) ? (
            hiddenWallMaterial
          ) : (
            <meshBasicMaterial
              color={"yellow"}
              transparent={true}
              depthTest={false}
              depthWrite={false}
            />
          )}
        </mesh>
        <mesh
          userData={{ type: "wall" }}
          position={[0, 0.05, 0]}
          scale={[1, 0.025, 1]}
          onPointerDown={(e) => onPointerDown(e, "right")}
          onPointerUp={(e) => onPointerUp(e, "right")}
          onPointerMove={(e) => onPointerMove(e, "right")}
        >
          <custom4PointPlane args={rightWallArgs} />
          {snapNearWalls?.right ? (
            <meshBasicMaterial
              color={"#007bff"}
              transparent={true}
              depthTest={false}
              depthWrite={false}
              opacity={0.5}
            />
          ) : (
            hiddenWallMaterial
          )}
        </mesh>
      </group>
      {/* Floor */}
      <group
        // position={[0, 0, 0]}
        onClick={(e) => {
          handleClick(e, "floor");
        }}
        onPointerDown={(e) => {
          onPointerDown(e, "floor");
        }}
        onPointerUp={(e) => {
          onPointerUp(e, "floor");
        }}
        onPointerOver={(e) => {
          onPointerOver(e, "floor");
        }}
        onPointerOut={onPointerOut}
        onPointerMove={(e) => {
          onPointerMove(e, "floor");
        }}
      >
        <mesh ref={floorRef} userData={{ type: "floor" }} receiveShadow>
          <custom4PointPlane args={floorPlaneArgs} />
          <meshPhysicalMaterial
            color={floorMaterialDef.defaultColor}
            map={floorDiffMap}
            normalMap={floorNormMap}
            roughnessMap={floorRoughMap}
            roughness={ 1}
            metalness={floorMaterialDef.metalness ?? 0}
            envMapIntensity={0}
            reflectivity={0}
            clearcoat={0}
            clearcoatRoughness={0}
            stencilWrite={true}
            stencilRef={1}
            stencilFunc={THREE.AlwaysStencilFunc}
            stencilZPass={THREE.ReplaceStencilOp}
          />
        </mesh>
      </group>
    </>
  );
};

export default RoomModel;
