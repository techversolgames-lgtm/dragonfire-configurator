/**
 * Floor item-to-item edge snapping (reference: boundingBoxSnap).
 * Aligns left/right edges when rotations match and depth overlaps.
 */

import {
  PRECISION_ROUND,
  SNAP_THRESHOLD_ITEM_EDGE,
  MIN_FLOOR_ITEM_GAP,
} from "@/data/DragonfireTools/snapConstants";
import { getPlacementFloorRotationY } from "@/data/DragonfireTools/snapSolver";

/**
 * Get bounding box edges from a world-space AABB (e.g. from Box3.setFromObject) projected onto width/depth axes.
 * Use this for item-to-item snapping so the snap aligns with the visible (green) bounding box.
 * @param {number} minX - AABB min X
 * @param {number} minZ - AABB min Z
 * @param {number} maxX - AABB max X
 * @param {number} maxZ - AABB max Z
 * @param {number} rotationY - item rotation (radians), defines width/depth axes
 * @returns {{ leftEdge: number, rightEdge: number, frontEdge: number, backEdge: number }}
 */
export function getBoundingBoxEdgesFromWorldAABB(
  minX,
  minZ,
  maxX,
  maxZ,
  rotationY,
) {
  const cosR = Math.cos(rotationY);
  const sinR = Math.sin(rotationY);
  const corners = [
    { x: minX, z: minZ },
    { x: maxX, z: minZ },
    { x: maxX, z: maxZ },
    { x: minX, z: maxZ },
  ];
  const widthAxisX = cosR;
  const widthAxisZ = -sinR;
  const depthAxisX = -sinR;
  const depthAxisZ = -cosR;
  let leftEdge = Infinity;
  let rightEdge = -Infinity;
  let frontEdge = Infinity;
  let backEdge = -Infinity;
  corners.forEach((c) => {
    const w = c.x * widthAxisX + c.z * widthAxisZ;
    const d = c.x * depthAxisX + c.z * depthAxisZ;
    if (w < leftEdge) leftEdge = w;
    if (w > rightEdge) rightEdge = w;
    if (d < frontEdge) frontEdge = d;
    if (d > backEdge) backEdge = d;
  });
  return { leftEdge, rightEdge, frontEdge, backEdge };
}

/**
 * Get bounding box edges in world XZ (projections onto width/depth axes from rotation).
 * @param {{ x: number, z: number }} position - center XZ
 * @param {{ width: number, depth: number }} dimensions
 * @param {number} rotationY - radians
 * @returns {{ leftEdge: number, rightEdge: number, frontEdge: number, backEdge: number }}
 */
export function getBoundingBoxEdges(position, dimensions, rotationY) {
  const { width, depth } = dimensions;
  const hw = width / 2;
  const hd = depth / 2;
  const cosR = Math.cos(rotationY);
  const sinR = Math.sin(rotationY);
  const cx = position.x;
  const cz = position.z;
  const corners = [
    { x: cx - hw * cosR - hd * sinR, z: cz + hw * sinR - hd * cosR },
    { x: cx + hw * cosR - hd * sinR, z: cz - hw * sinR - hd * cosR },
    { x: cx + hw * cosR + hd * sinR, z: cz - hw * sinR + hd * cosR },
    { x: cx - hw * cosR + hd * sinR, z: cz + hw * sinR + hd * cosR },
  ];
  const widthAxisX = cosR;
  const widthAxisZ = -sinR;
  const depthAxisX = -sinR;
  const depthAxisZ = -cosR;
  let leftEdge = Infinity;
  let rightEdge = -Infinity;
  let frontEdge = Infinity;
  let backEdge = -Infinity;
  corners.forEach((c) => {
    const w = c.x * widthAxisX + c.z * widthAxisZ;
    const d = c.x * depthAxisX + c.z * depthAxisZ;
    if (w < leftEdge) leftEdge = w;
    if (w > rightEdge) rightEdge = w;
    if (d < frontEdge) frontEdge = d;
    if (d > backEdge) backEdge = d;
  });
  return { leftEdge, rightEdge, frontEdge, backEdge };
}

export function getOffsetFloorCenter(position, rotationY, meta) {
  const offset = meta?.centerOffsetPosition;
  if (!offset) return { x: position.x, z: position.z };
  const ox = offset.x ?? 0;
  const oz = offset.z ?? 0;
  if (ox === 0 && oz === 0) return { x: position.x, z: position.z };
  const cosR = Math.cos(rotationY);
  const sinR = Math.sin(rotationY);
  return {
    x: position.x + ox * cosR + oz * sinR,
    z: position.z - ox * sinR + oz * cosR,
  };
}

/** Inverse of getOffsetFloorCenter: footprint / logical center → stored group origin (placement.position). */
export function getGroupOriginFromFootprintCenter(footprintXZ, rotationY, meta) {
  const offset = meta?.centerOffsetPosition;
  if (!offset) return { x: footprintXZ.x, z: footprintXZ.z };
  const ox = offset.x ?? 0;
  const oz = offset.z ?? 0;
  if (ox === 0 && oz === 0) return { x: footprintXZ.x, z: footprintXZ.z };
  const cosR = Math.cos(rotationY);
  const sinR = Math.sin(rotationY);
  return {
    x: footprintXZ.x - (ox * cosR + oz * sinR),
    z: footprintXZ.z - (-ox * sinR + oz * cosR),
  };
}

const ROTATION_MATCH_TOLERANCE = 0.1;

/**
 * Find best edge snap to other floor items (left/right alignment).
 * When draggedItemEdges is provided (e.g. from the green box / world AABB), snapping uses those edges so alignment matches the visible bounding box.
 * @param {{ x: number, z: number }} currentPosition - XZ center
 * @param {number} currentRotationY - radians
 * @param {{ width: number, depth: number }} itemDimensions
 * @param {Array} placedPositions - from store
 * @param {Object} reverseIdMap - cabinetId -> meta
 * @param {number|null} excludeIndex - placed index to exclude (e.g. dragged item)
 * @param {{ leftEdge: number, rightEdge: number, frontEdge: number, backEdge: number } | null} [draggedItemEdges] - optional edges from world AABB (green box) for the dragged item
 * @param {object | null} [currentItemMeta] - reverseIdMap meta for dragged item; when set (and no draggedItemEdges), self edges use footprint center like neighbors
 * @returns {{ snapped: boolean, position: {x,z}, rotationY?: number, snapTargetId?: number, snapSide?: 'left'|'right' }}
 */
export function findFloorItemEdgeSnap(
  currentPosition,
  currentRotationY,
  itemDimensions,
  placedPositions,
  reverseIdMap,
  excludeIndex = null,
  draggedItemEdges = null,
  currentItemMeta = null,
) {
  const meta = currentItemMeta ?? {};
  const selfFootprintCenter =
    draggedItemEdges != null
      ? null
      : getOffsetFloorCenter(
          { x: currentPosition.x, z: currentPosition.z },
          currentRotationY,
          meta,
        );
  const itemEdges =
    draggedItemEdges != null
      ? draggedItemEdges
      : getBoundingBoxEdges(
          selfFootprintCenter,
          itemDimensions,
          currentRotationY,
        );
  const itemHalfWidthFromEdges =
    draggedItemEdges != null
      ? (draggedItemEdges.rightEdge - draggedItemEdges.leftEdge) / 2
      : itemDimensions.width / 2;
  let bestDist = SNAP_THRESHOLD_ITEM_EDGE;
  let bestSnap = null;

  for (let idx = 0; idx < placedPositions.length; idx++) {
    if (idx === excludeIndex) continue;
    const other = placedPositions[idx];
    const meta = reverseIdMap[other.cabinetId];
    if (!meta?.boundingBox || meta.itemType === "wall") continue;
    const { width, depth } = meta.boundingBox;
    const otherRot = getPlacementFloorRotationY(other);
    const otherPos = getOffsetFloorCenter(other.position, otherRot, meta);
    const otherEdges = getBoundingBoxEdges(
      { x: otherPos.x, z: otherPos.z },
      { width, depth },
      otherRot,
    );
    const otherHalfDepth = depth / 2;

    const rotationDiff = Math.abs(currentRotationY - otherRot);
    const rotationMatch =
      rotationDiff < ROTATION_MATCH_TOLERANCE ||
      rotationDiff > Math.PI * 2 - ROTATION_MATCH_TOLERANCE;
    if (!rotationMatch) continue;

    const depthOverlap = !(
      itemEdges.backEdge < otherEdges.frontEdge ||
      itemEdges.frontEdge > otherEdges.backEdge
    );
    const depthGap = depthOverlap
      ? 0
      : Math.min(
          Math.abs(itemEdges.backEdge - otherEdges.frontEdge),
          Math.abs(itemEdges.frontEdge - otherEdges.backEdge),
        );
    const depthNearEnough =
      depthOverlap || depthGap <= SNAP_THRESHOLD_ITEM_EDGE;
    if (!depthNearEnough) continue;

    const distToLeft = Math.abs(itemEdges.rightEdge - otherEdges.leftEdge);
    if (distToLeft < bestDist) {
      bestDist = distToLeft;
      bestSnap = {
        targetIndex: idx,
        targetId: other.cabinetId,
        snapSide: "right",
        targetRotationY: otherRot,
        targetPosition: otherPos,
        targetHalfWidth: width / 2,
        itemHalfWidth: itemHalfWidthFromEdges,
        axis: "width",
        delta:
          otherEdges.leftEdge -
          itemEdges.rightEdge -
          MIN_FLOOR_ITEM_GAP,
      };
    }
    const distToRight = Math.abs(itemEdges.leftEdge - otherEdges.rightEdge);
    if (distToRight < bestDist) {
      bestDist = distToRight;
      bestSnap = {
        targetIndex: idx,
        targetId: other.cabinetId,
        snapSide: "left",
        targetRotationY: otherRot,
        targetPosition: otherPos,
        targetHalfWidth: width / 2,
        itemHalfWidth: itemHalfWidthFromEdges,
        axis: "width",
        delta:
          otherEdges.rightEdge -
          itemEdges.leftEdge +
          MIN_FLOOR_ITEM_GAP,
      };
    }

    // Lower Corner uses a custom two-edge profile: also allow snapping to its
    // front/back straight edges (not just left/right box edges).
    const isLowerCornerTwoEdgeProfile =
      meta.snapProfile === "lowerCornerTwoEdge";
    if (isLowerCornerTwoEdgeProfile) {
      const widthOverlap = !(
        itemEdges.rightEdge < otherEdges.leftEdge ||
        itemEdges.leftEdge > otherEdges.rightEdge
      );
      const widthGap = widthOverlap
        ? 0
        : Math.min(
            Math.abs(itemEdges.rightEdge - otherEdges.leftEdge),
            Math.abs(itemEdges.leftEdge - otherEdges.rightEdge),
          );
      const widthNearEnough =
        widthOverlap || widthGap <= SNAP_THRESHOLD_ITEM_EDGE;
      if (widthNearEnough) {
        const itemHalfDepthFromEdges =
          (itemEdges.backEdge - itemEdges.frontEdge) / 2;

        const distToFront = Math.abs(itemEdges.backEdge - otherEdges.frontEdge);
        if (distToFront < bestDist) {
          bestDist = distToFront;
          bestSnap = {
            targetIndex: idx,
            targetId: other.cabinetId,
            snapSide: "front",
            targetRotationY: otherRot,
            targetPosition: otherPos,
            targetHalfDepth: otherHalfDepth,
            itemHalfDepth: itemHalfDepthFromEdges,
            axis: "depth",
            delta:
              otherEdges.frontEdge -
              itemEdges.backEdge -
              MIN_FLOOR_ITEM_GAP,
          };
        }

        const distToBack = Math.abs(itemEdges.frontEdge - otherEdges.backEdge);
        if (distToBack < bestDist) {
          bestDist = distToBack;
          bestSnap = {
            targetIndex: idx,
            targetId: other.cabinetId,
            snapSide: "back",
            targetRotationY: otherRot,
            targetPosition: otherPos,
            targetHalfDepth: otherHalfDepth,
            itemHalfDepth: itemHalfDepthFromEdges,
            axis: "depth",
            delta:
              otherEdges.backEdge -
              itemEdges.frontEdge +
              MIN_FLOOR_ITEM_GAP,
          };
        }
      }
    }
  }

  if (!bestSnap) {
    return {
      snapped: false,
      position: { x: currentPosition.x, z: currentPosition.z },
    };
  }

  const snapFootprintToGroup = (xz) =>
    draggedItemEdges != null
      ? xz
      : getGroupOriginFromFootprintCenter(xz, currentRotationY, meta);

  if (
    (bestSnap.axis === "width" || bestSnap.axis === "depth") &&
    typeof bestSnap.delta === "number"
  ) {
    const rot = bestSnap.targetRotationY ?? currentRotationY;
    const axisVec =
      bestSnap.axis === "width"
        ? { x: Math.cos(rot), z: -Math.sin(rot) }
        : { x: -Math.sin(rot), z: -Math.cos(rot) };
    const baseX =
      draggedItemEdges != null ? currentPosition.x : selfFootprintCenter.x;
    const baseZ =
      draggedItemEdges != null ? currentPosition.z : selfFootprintCenter.z;
    const snappedX = baseX + axisVec.x * bestSnap.delta;
    const snappedZ = baseZ + axisVec.z * bestSnap.delta;
    const out = snapFootprintToGroup({ x: snappedX, z: snappedZ });
    return {
      snapped: true,
      position: {
        x: Math.round(out.x * PRECISION_ROUND) / PRECISION_ROUND,
        z: Math.round(out.z * PRECISION_ROUND) / PRECISION_ROUND,
      },
      rotationY: bestSnap.targetRotationY,
      snapTargetId: bestSnap.targetId,
      snapSide: bestSnap.snapSide,
    };
  }

  const centerToCenterDist =
    bestSnap.targetHalfWidth + bestSnap.itemHalfWidth + MIN_FLOOR_ITEM_GAP;
  const perpX =
    bestSnap.snapSide === "right"
      ? -Math.cos(bestSnap.targetRotationY)
      : Math.cos(bestSnap.targetRotationY);
  const perpZ =
    bestSnap.snapSide === "right"
      ? Math.sin(bestSnap.targetRotationY)
      : -Math.sin(bestSnap.targetRotationY);

  const snappedX =
    bestSnap.targetPosition.x + perpX * centerToCenterDist;
  const snappedZ =
    bestSnap.targetPosition.z + perpZ * centerToCenterDist;

  const out = snapFootprintToGroup({ x: snappedX, z: snappedZ });
  return {
    snapped: true,
    position: {
      x: Math.round(out.x * PRECISION_ROUND) / PRECISION_ROUND,
      z: Math.round(out.z * PRECISION_ROUND) / PRECISION_ROUND,
    },
    rotationY: bestSnap.targetRotationY,
    snapTargetId: bestSnap.targetId,
    snapSide: bestSnap.snapSide,
  };
}
