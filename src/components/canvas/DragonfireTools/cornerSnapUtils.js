/**
 * Corner cabinet snap logic: nearest corner snap point, position + rotation snap.
 * Used only for corner cabinets; keeps logic separate from wall/edge snapping.
 */

import { CORNER_SNAP_THRESHOLD_DISTANCE } from "@/data/DragonfireTools/snapConstants";
import { clampFloorPositionToRoom } from "./wallSnapUtils";

/**
 * Get the cabinet's "corner anchor" position in XZ (the vertex that should sit at the room corner).
 * For a corner cabinet facing direction rotationY, the back corner is center - (depth/2) * forward.
 * @param {{ x: number, z: number }} centerXZ - cabinet center
 * @param {number} depth - cabinet depth
 * @param {number} rotationY - radians
 * @returns {{ x: number, z: number }}
 */
export function getCornerAnchorFromCenter(centerXZ, depth, rotationY) {
  const forwardX = Math.sin(rotationY);
  const forwardZ = Math.cos(rotationY);
  return {
    x: centerXZ.x - (depth / 2) * forwardX,
    z: centerXZ.z - (depth / 2) * forwardZ,
  };
}

/**
 * Get cabinet center from corner anchor position and rotation (inverse of getCornerAnchorFromCenter).
 * center = anchor + (depth/2) * forward
 */
export function getCenterFromCornerAnchor(anchorXZ, depth, rotationY) {
  const forwardX = Math.sin(rotationY);
  const forwardZ = Math.cos(rotationY);
  return {
    x: anchorXZ.x + (depth / 2) * forwardX,
    z: anchorXZ.z + (depth / 2) * forwardZ,
  };
}

/**
 * Find the nearest corner snap point to a given anchor position (XZ) within threshold.
 * @param {{ x: number, z: number }} anchorXZ - cabinet corner anchor in XZ
 * @param {Array<{ id: string, position: { x, y, z }, rotationY: number }>} cornerSnapPoints
 * @param {number} [threshold] - max distance (default CORNER_SNAP_THRESHOLD_DISTANCE)
 * @returns {{ point: object, distance: number } | null}
 */
export function findNearestCornerSnapPoint(anchorXZ, cornerSnapPoints, threshold = CORNER_SNAP_THRESHOLD_DISTANCE) {
  if (!cornerSnapPoints?.length) return null;
  let best = null;
  let bestDistSq = threshold * threshold;
  for (const point of cornerSnapPoints) {
    const dx = anchorXZ.x - point.position.x;
    const dz = anchorXZ.z - point.position.z;
    const distSq = dx * dx + dz * dz;
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      best = { point, distance: Math.sqrt(distSq) };
    }
  }
  return best;
}

/**
 * Compute snap result for a corner cabinet: only corner snap, no wall/edge.
 * If within threshold of a corner, snap position and rotation to that corner; otherwise free drag.
 * When `forceSnapToNearestCorner` is true, it always snaps to the nearest corner snap point
 * (no free center placement).
 * @param {{
 *   desiredPosition: { x: number, y?: number, z: number };
 *   rotationY: number;
 *   dimensions: { width: number, depth: number };
 *   cornerSnapPoints: Array;
 *   wallWidthMap: object;
 *   forceSnapToNearestCorner?: boolean;
 * }} args
 * @returns {{ position: { x, y, z }, rotationY: number, dragPointNormal: { x, z }, snappedCornerId?: string, snapped: boolean }}
 */
export function computeCornerSnapResult({
  desiredPosition,
  rotationY,
  dimensions,
  cornerSnapPoints,
  wallWidthMap,
  forceSnapToNearestCorner = false,
  centerOffsetPosition = null,
}) {
  const offsetX = centerOffsetPosition?.x ?? 0;
  const offsetZ = centerOffsetPosition?.z ?? 0;
  const offsetCenterXZ =
    offsetX === 0 && offsetZ === 0
      ? { x: desiredPosition.x, z: desiredPosition.z }
      : {
          x:
            desiredPosition.x +
            offsetX * Math.cos(rotationY) +
            offsetZ * Math.sin(rotationY),
          z:
            desiredPosition.z -
            offsetX * Math.sin(rotationY) +
            offsetZ * Math.cos(rotationY),
        };
  const centerXZ = offsetCenterXZ;
  const anchor = getCornerAnchorFromCenter(
    centerXZ,
    dimensions.depth,
    rotationY,
  );

  // In strict/force mode, choose the nearest corner by comparing the desired
  // cabinet center to the candidate *snapped* centers for each corner snap
  // point (avoids rotation-0 ghost bias).
  let nearest = null;
  if (forceSnapToNearestCorner) {
    if (cornerSnapPoints?.length) {
      let best = null;
      let bestDistSq = Infinity;
      for (const point of cornerSnapPoints) {
        const candidateCenter = getCenterFromCornerAnchor(
          { x: point.position.x, z: point.position.z },
          dimensions.depth,
          point.rotationY,
        );
        const dx = centerXZ.x - candidateCenter.x;
        const dz = centerXZ.z - candidateCenter.z;
        const distSq = dx * dx + dz * dz;
        if (distSq < bestDistSq) {
          bestDistSq = distSq;
          best = { point };
        }
      }
      if (best) {
        nearest = { ...best, distance: Math.sqrt(bestDistSq) };
      }
    }
  } else {
    nearest = findNearestCornerSnapPoint(anchor, cornerSnapPoints);
  }

  if (!nearest) {
    const y = desiredPosition.y ?? 0;
    const clamped = clampFloorPositionToRoom(
      { ...desiredPosition, y },
      dimensions.width,
      dimensions.depth,
      rotationY,
      wallWidthMap,
    );
    return {
      position: clamped,
      rotationY,
      dragPointNormal: { x: Math.sin(rotationY), y: 0, z: Math.cos(rotationY) },
      snapped: false,
    };
  }

  const { point } = nearest;
  const preferredRotationY = point.rotationY;
  const snappedCenter = getCenterFromCornerAnchor(
    { x: point.position.x, z: point.position.z },
    dimensions.depth,
    preferredRotationY,
  );
  const snappedOffsetCenter =
    offsetX === 0 && offsetZ === 0
      ? snappedCenter
      : {
          x:
            snappedCenter.x -
            (offsetX * Math.cos(preferredRotationY) +
              offsetZ * Math.sin(preferredRotationY)),
          z:
            snappedCenter.z -
            (-offsetX * Math.sin(preferredRotationY) +
              offsetZ * Math.cos(preferredRotationY)),
        };
  let position = {
    x: snappedOffsetCenter.x,
    y: (desiredPosition.y ?? 0) + (point.position.y ?? 0),
    z: snappedOffsetCenter.z,
  };
  position = clampFloorPositionToRoom(
    position,
    dimensions.width,
    dimensions.depth,
    preferredRotationY,
    wallWidthMap,
  );
  const dragPointNormal = {
    x: Math.sin(preferredRotationY),
    y: 0,
    z: Math.cos(preferredRotationY),
  };
  return {
    position,
    rotationY: preferredRotationY,
    dragPointNormal,
    snappedCornerId: point.id,
    snapped: true,
  };
}
