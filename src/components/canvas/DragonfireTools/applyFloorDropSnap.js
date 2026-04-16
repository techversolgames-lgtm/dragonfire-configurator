/**
 * Central floor snapping pipeline – single source of truth for ghost, drag, and placed modes.
 * Use computeFloorSnapResult everywhere so snapping is identical in preview and after placement.
 */

import {
  clampFloorPositionToRoom,
  getClosestWallToCabinetFootprint,
  getInwardNormalForWall,
  isCornerCabinet,
  isLowerCornerCabinet,
} from "./wallSnapUtils";
import {
  wouldPositionOverlap,
  getPlacementFloorRotationY,
} from "@/data/DragonfireTools/snapSolver";
import { getRoomDescriptor } from "@/data/DragonfireTools/roomDefinition";
import { getCornerSnapPoints } from "@/data/DragonfireTools/cornerSnapPoints";
import { WALL_COLLISION_ROTATE_THRESHOLD } from "@/data/DragonfireTools/snapConstants";
import { solveSnap } from "@/data/DragonfireTools/snapSolver";
import {
  findFloorItemEdgeSnap,
  getOffsetFloorCenter,
  getGroupOriginFromFootprintCenter,
} from "./floorItemSnapUtils";
import { computeCornerSnapResult } from "./cornerSnapUtils";

/**
 * Single snapping pipeline: edge snap → (reset wall rotation when snapping to wall) → solveSnap → clamp → wall flush → clamp.
 * When snapping to a wall, we never stack or preserve previous wall rotation: we detect the target wall,
 * set rotation cleanly from that wall, then recompute position/extents and flush so there is no gap.
 *
 * @param {{
 *   desiredPosition: { x: number, y?: number, z: number };
 *   rotationY: number;
 *   dimensions: { width: number, depth: number };
 *   label?: string;
 *   placedPositions: Array;
 *   excludeIndex: number | null;
 *   wallWidthMap: { front?: number, right?: number, back?: number, left?: number };
 *   reverseIdMap: Record<string, { boundingBox?: { width, depth }, label?: string }>;
 *   draggedItemEdges?: { leftEdge, rightEdge, frontEdge, backEdge } | null;
 * }} args
 * @returns {{ position: { x, y, z }, dragPointNormal: { x, z } | null, snappedWallId?: string }}
 */
export function computeFloorSnapResult({
  desiredPosition,
  rotationY,
  dimensions,
  label,
  meta,
  placedPositions,
  excludeIndex,
  wallWidthMap,
  reverseIdMap,
  draggedItemEdges = null,
}) {
  const cornerTarget = meta ?? label ?? "";
  const isCorner = isCornerCabinet(cornerTarget);
  const isLowerCorner = isLowerCornerCabinet(cornerTarget);
  if (isCorner) {
    const cornerSnapPoints = getCornerSnapPoints(
      wallWidthMap,
      isLowerCorner ? "lower" : "upper",
    );
    const result = computeCornerSnapResult({
      desiredPosition,
      rotationY,
      dimensions,
      cornerSnapPoints,
      wallWidthMap,
      forceSnapToNearestCorner: isLowerCorner,
      centerOffsetPosition: meta?.centerOffsetPosition ?? null,
    });
    return {
      position: result.position,
      dragPointNormal: result.dragPointNormal,
      snappedWallId: undefined,
    };
  }

  let newPosition = {
    x: desiredPosition.x,
    y: desiredPosition.y ?? 0,
    z: desiredPosition.z,
  };
  const currentRot = rotationY;

  const edgeSnap = findFloorItemEdgeSnap(
    { x: newPosition.x, z: newPosition.z },
    currentRot,
    dimensions,
    placedPositions,
    reverseIdMap,
    excludeIndex,
    draggedItemEdges,
    meta,
  );
  if (edgeSnap.snapped) {
    newPosition = {
      ...newPosition,
      x: edgeSnap.position.x,
      z: edgeSnap.position.z,
    };
  }
  let rotY = edgeSnap.snapped
    ? (edgeSnap.rotationY ?? currentRot)
    : currentRot;

  const metaForOffset = meta ?? {};
  const footprintCenter = getOffsetFloorCenter(
    { x: newPosition.x, z: newPosition.z },
    rotY,
    metaForOffset,
  );

  const { name: footprintClosestWall, distance: footprintToWallDistance } =
    getClosestWallToCabinetFootprint(
      footprintCenter,
      dimensions.width,
      dimensions.depth,
      rotY,
      wallWidthMap,
    );
  const touchedWallByAnyPart =
    footprintToWallDistance < WALL_COLLISION_ROTATE_THRESHOLD;
  const willWallSnap =
    touchedWallByAnyPart &&
    !edgeSnap.snapped &&
    dimensions.depth &&
    !isCorner;
  const wallForRotation = footprintClosestWall;

  if (willWallSnap && wallForRotation) {
    const wallNormal = getInwardNormalForWall(wallForRotation, wallWidthMap);
    rotY = Math.atan2(wallNormal.x, wallNormal.z);
  }

  const snapResult = solveSnap({
    desiredPos: {
      ...newPosition,
      x: footprintCenter.x,
      z: footprintCenter.z,
    },
    width: dimensions.width,
    depth: dimensions.depth,
    rotationY: rotY,
    wallWidthMap,
    placedPositions,
    reverseIdMap,
    excludeIndex,
  });
  let fpPosition = clampFloorPositionToRoom(
    snapResult.position,
    dimensions.width,
    dimensions.depth,
    rotY,
    wallWidthMap,
  );

  const nextSnappedWallId =
    touchedWallByAnyPart && !edgeSnap.snapped && !isCorner
      ? wallForRotation
      : undefined;

  if (willWallSnap && wallForRotation) {
    const descriptor = getRoomDescriptor(wallWidthMap);
    const wall = descriptor.walls.find((w) => w.wallId === wallForRotation);
    if (wall) {
      const { nx, nz, d } = wall.plane;
      const signedDist = nx * fpPosition.x + nz * fpPosition.z + d;
      const flushOffset = dimensions.depth / 2 - signedDist;
      fpPosition = {
        ...fpPosition,
        x: fpPosition.x + nx * flushOffset,
        z: fpPosition.z + nz * flushOffset,
      };
      fpPosition = clampFloorPositionToRoom(
        fpPosition,
        dimensions.width,
        dimensions.depth,
        rotY,
        wallWidthMap,
      );
    }
  }

  const groupXZ = getGroupOriginFromFootprintCenter(
    { x: fpPosition.x, z: fpPosition.z },
    rotY,
    metaForOffset,
  );
  newPosition = { ...fpPosition, x: groupXZ.x, z: groupXZ.z };

  const dragPointNormal =
    edgeSnap.snapped
      ? { x: Math.sin(rotY), y: 0, z: Math.cos(rotY) }
      : willWallSnap && wallForRotation
        ? getInwardNormalForWall(wallForRotation, wallWidthMap)
        : { x: Math.sin(rotY), y: 0, z: Math.cos(rotY) };

  return {
    position: newPosition,
    dragPointNormal,
    snappedWallId: nextSnappedWallId,
  };
}

/**
 * Run full snap pipeline on a placed floor cabinet (uses computeFloorSnapResult).
 * Use when ending a floor drag so the dropped cabinet gets wall + object snap and correct rotation.
 *
 * @param {Array} placedPositions - current placedPositions from store
 * @param {number} index - index of the cabinet to snap
 * @param {{ front?: number, right?: number, back?: number, left?: number }} wallWidthMap
 * @param {Record<string, { boundingBox?: { width, depth }, label?: string }>} reverseIdMap
 * @returns {{ position: {x,y,z}, dragPointNormal: {x,z}|null, snappedWallId?: string } | null} updated fields for the cabinet, or null if index invalid
 */
export function applyFloorDropSnap(
  placedPositions,
  index,
  wallWidthMap,
  reverseIdMap,
) {
  const cabinet = placedPositions[index];
  if (!cabinet) return null;

  const meta = reverseIdMap[cabinet.cabinetId];
  const dimensions = meta?.boundingBox
    ? { width: meta.boundingBox.width, depth: meta.boundingBox.depth }
    : { width: 1, depth: 1 };
  const currentRot = getPlacementFloorRotationY(cabinet);

  const snapped = computeFloorSnapResult({
    desiredPosition: cabinet.position,
    rotationY: currentRot,
    dimensions,
    label: meta?.label,
    meta,
    placedPositions,
    excludeIndex: index,
    wallWidthMap,
    reverseIdMap,
  });

  const overlapRot = snapped.dragPointNormal
    ? Math.atan2(snapped.dragPointNormal.x, snapped.dragPointNormal.z)
    : currentRot;
  const overlapCenter = getOffsetFloorCenter(
    { x: snapped.position.x, z: snapped.position.z },
    overlapRot,
    meta ?? {},
  );
  if (
    wouldPositionOverlap(
      placedPositions,
      reverseIdMap,
      index,
      { ...snapped.position, x: overlapCenter.x, z: overlapCenter.z },
      dimensions.width,
      dimensions.depth,
      overlapRot,
    )
  ) {
    return {
      position: cabinet.position,
      dragPointNormal: cabinet.dragPointNormal ?? null,
      snappedWallId: cabinet.snappedWallId,
      backsplash: cabinet.backsplash,
      baseOption: cabinet.baseOption,
    };
  }

  const rotationY = snapped.dragPointNormal
    ? Math.atan2(snapped.dragPointNormal.x, snapped.dragPointNormal.z)
    : currentRot;
  return {
    position: snapped.position,
    dragPointNormal: snapped.dragPointNormal ?? null,
    rotationY,
    snappedWallId: snapped.snappedWallId,
    backsplash: cabinet.backsplash,
    baseOption: cabinet.baseOption,
  };
}
