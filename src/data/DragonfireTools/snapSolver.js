/**
 * Snapping solver – wall snap and object-to-object alignment.
 * Based on the same algorithm: wall planes + gap, then AABB-based edge snap.
 */

import { getRoomDescriptor } from "./roomDefinition";

/** Room floor Y (must match CabinetFeet.FLOOR_Y). Wall items on the floor are not considered penetrating. */
const FLOOR_Y = -0.1;
import {
  WALL_SNAP_GAP,
  SNAP_THRESHOLD_ITEM_EDGE,
  MIN_FLOOR_ITEM_GAP,
  TOUCH_EPSILON,
} from "./snapConstants";

const DEBUG_UPPER_CORNER_OVERLAP = false;

/**
 * Signed distance from point to wall plane (nx*x + nz*z + d = 0).
 * @param {{ x: number, z: number }} point
 * @param {{ nx: number, nz: number, d: number }} plane
 */
function planeDistanceToPoint(point, plane) {
  return plane.nx * point.x + plane.nz * point.z + plane.d;
}

/**
 * Mark snapped direction from wall normal (XZ).
 */
function markDirFromNormal(nx, nz, snappedDirs) {
  if (nx > 0.5) snappedDirs.add("posX");
  else if (nx < -0.5) snappedDirs.add("negX");
  else if (nz > 0.5) snappedDirs.add("posZ");
  else if (nz < -0.5) snappedDirs.add("negZ");
}

function getOffsetFloorCenter(position, rotationY, meta) {
  const offset = meta?.centerOffsetPosition;
  if (!offset) return position;
  const ox = offset.x ?? 0;
  const oz = offset.z ?? 0;
  if (ox === 0 && oz === 0) return position;
  const cosR = Math.cos(rotationY);
  const sinR = Math.sin(rotationY);
  return {
    ...position,
    x: position.x + ox * cosR + oz * sinR,
    z: position.z - ox * sinR + oz * cosR,
  };
}

/** Floor footprint rotation: dragPointNormal is (sin Y, 0, cos Y), or use stored rotationY. */
export function getPlacementFloorRotationY(placement) {
  if (!placement) return 0;
  if (placement.dragPointNormal != null) {
    return Math.atan2(placement.dragPointNormal.x, placement.dragPointNormal.z);
  }
  if (placement.rotationY != null) return placement.rotationY;
  return 0;
}

/**
 * Effective wall-anchor Y for wall items.
 * TV/Window/Door sliders write to roomItemY while legacy placements may only have position.y.
 */
function getWallPlacementY(placement) {
  return placement?.roomItemY ?? placement?.position?.y ?? 0;
}

/**
 * Get AABB in XZ for a floor item (min/max x and z).
 */
export function getFloorItemAABB(cx, cz, width, depth, rotationY) {
  const hw = width / 2;
  const hd = depth / 2;
  const cosR = Math.cos(rotationY);
  const sinR = Math.sin(rotationY);
  const corners = [
    { x: cx - hw * cosR - hd * sinR, z: cz + hw * sinR - hd * cosR },
    { x: cx + hw * cosR - hd * sinR, z: cz - hw * sinR - hd * cosR },
    { x: cx + hw * cosR + hd * sinR, z: cz - hw * sinR + hd * cosR },
    { x: cx - hw * cosR + hd * sinR, z: cz + hw * sinR + hd * cosR },
  ];
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  corners.forEach((c) => {
    if (c.x < minX) minX = c.x;
    if (c.x > maxX) maxX = c.x;
    if (c.z < minZ) minZ = c.z;
    if (c.z > maxZ) maxZ = c.z;
  });
  return { minX, maxX, minZ, maxZ };
}

/**
 * True if two floor items (rotated boxes in XZ) overlap or are too close (within MIN_FLOOR_ITEM_GAP).
 * Uses TOUCH_EPSILON so edge-to-edge contact (e.g. cabinets flush side-by-side) is not treated as overlap,
 * allowing users to push placed cabinets together.
 */
export function doFloorItemsOverlap(pos1, w1, d1, rot1, pos2, w2, d2, rot2) {
  const a = getFloorItemAABB(pos1.x, pos1.z, w1, d1, rot1);
  const b = getFloorItemAABB(pos2.x, pos2.z, w2, d2, rot2);
  const h = MIN_FLOOR_ITEM_GAP / 2;
  const xIntersect = a.minX - h < b.maxX + h && a.maxX + h > b.minX - h;
  const zIntersect = a.minZ - h < b.maxZ + h && a.maxZ + h > b.minZ - h;
  if (!xIntersect || !zIntersect) return false;
  const overlapMinX = Math.max(a.minX - h, b.minX - h);
  const overlapMaxX = Math.min(a.maxX + h, b.maxX + h);
  const overlapMinZ = Math.max(a.minZ - h, b.minZ - h);
  const overlapMaxZ = Math.min(a.maxZ + h, b.maxZ + h);
  const xOverlapLen = overlapMaxX - overlapMinX;
  const zOverlapLen = overlapMaxZ - overlapMinZ;
  return xOverlapLen > TOUCH_EPSILON && zOverlapLen > TOUCH_EPSILON;
}

/** Same wall if normals match (for wall-item overlap). */
function sameWallNormal(n1, n2) {
  if (!n1 || !n2) return false;
  return (
    Math.abs(n1.x - n2.x) + Math.abs(n1.y - n2.y) + Math.abs(n1.z - n2.z) <
    0.01
  );
}

/** Vertical extent (bottom, top) for a wall item. Door: position.y is center; TV/Window: position.y is bottom. */
function wallItemYExtent(posY, height, isDoor) {
  if (isDoor) return { bottom: posY - height / 2, top: posY + height / 2 };
  return { bottom: posY, top: posY + height };
}

function overlapAmount1D(minA, maxA, minB, maxB) {
  return Math.min(maxA, maxB) - Math.max(minA, minB);
}

/**
 * True if two wall items on the same wall overlap in wall-aligned 2D (along-wall and Y).
 * Door (101): position.y is center; TV/Window: position.y is bottom.
 */
function doWallItemsOverlap(pos1, n1, w1, h1, isDoor1, pos2, n2, w2, h2, isDoor2) {
  if (!sameWallNormal(n1, n2)) return false;
  const tx = -(n1.z ?? 0);
  const tz = n1.x ?? 0;
  const along1 = pos1.x * tx + pos1.z * tz;
  const along2 = pos2.x * tx + pos2.z * tz;
  const overlapAlong =
    along1 - w1 / 2 < along2 + w2 / 2 && along1 + w1 / 2 > along2 - w2 / 2;
  const ext1 = wallItemYExtent(pos1.y, h1, isDoor1);
  const ext2 = wallItemYExtent(pos2.y, h2, isDoor2);
  const overlapY = ext1.bottom < ext2.top && ext1.top > ext2.bottom;
  return overlapAlong && overlapY;
}

/**
 * World AABB of a wall item (box on wall: width along tangent, height in Y, depth along normal into room).
 * @returns {{ minX, maxX, minY, maxY, minZ, maxZ }}
 */
export function getWallItemAABB(position, normal, width, height, depth) {
  const nx = normal?.x ?? 0;
  const nz = normal?.z ?? 0;
  const tx = -nz;
  const tz = nx;
  const hw = width / 2;
  const hh = height / 2;
  const hd = depth / 2;
  const cx = position.x;
  const cy = position.y;
  const cz = position.z;
  const corners = [
    [cx + hw * tx + hd * nx, cy + hh, cz + hw * tz + hd * nz],
    [cx + hw * tx + hd * nx, cy - hh, cz + hw * tz + hd * nz],
    [cx + hw * tx - hd * nx, cy + hh, cz + hw * tz - hd * nz],
    [cx + hw * tx - hd * nx, cy - hh, cz + hw * tz - hd * nz],
    [cx - hw * tx + hd * nx, cy + hh, cz - hw * tz + hd * nz],
    [cx - hw * tx + hd * nx, cy - hh, cz - hw * tz + hd * nz],
    [cx - hw * tx - hd * nx, cy + hh, cz - hw * tz - hd * nz],
    [cx - hw * tx - hd * nx, cy - hh, cz - hw * tz - hd * nz],
  ];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
  corners.forEach(([x, y, z]) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  });
  return { minX, maxX, minY, maxY, minZ, maxZ };
}

/**
 * 3D AABB of a floor item (XZ from footprint, Y from base to base+height).
 */
export function getFloorItem3DAABB(position, width, depth, rotationY, height) {
  const xz = getFloorItemAABB(position.x, position.z, width, depth, rotationY);
  const baseY = position.y ?? 0;
  return {
    minX: xz.minX,
    maxX: xz.maxX,
    minY: baseY,
    maxY: baseY + (height ?? 1),
    minZ: xz.minZ,
    maxZ: xz.maxZ,
  };
}

function getAABB3DOverlapDepths(a, b) {
  const overlapX = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
  const overlapY = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY);
  const overlapZ = Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ);
  return { overlapX, overlapY, overlapZ };
}

function doAABB3DOverlap(a, b, epsilon = TOUCH_EPSILON) {
  const { overlapX, overlapY, overlapZ } = getAABB3DOverlapDepths(a, b);
  return overlapX > epsilon && overlapY > epsilon && overlapZ > epsilon;
}

function projectPointsOntoAxis(points, axis) {
  let min = Infinity;
  let max = -Infinity;
  for (const p of points) {
    const v = p.x * axis.x + p.z * axis.z;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { min, max };
}

function getIntervalOverlap(a, b) {
  return Math.min(a.max, b.max) - Math.max(a.min, b.min);
}

function getFloorOBBCornersXZ(position, width, depth, rotationY) {
  const hw = width / 2;
  const hd = depth / 2;
  const cosR = Math.cos(rotationY);
  const sinR = Math.sin(rotationY);
  return [
    { x: position.x - hw * cosR - hd * sinR, z: position.z + hw * sinR - hd * cosR },
    { x: position.x + hw * cosR - hd * sinR, z: position.z - hw * sinR - hd * cosR },
    { x: position.x + hw * cosR + hd * sinR, z: position.z - hw * sinR + hd * cosR },
    { x: position.x - hw * cosR + hd * sinR, z: position.z + hw * sinR + hd * cosR },
  ];
}

function getWallOBBCornersXZ(center, normal, width, depth) {
  const nx = normal?.x ?? 0;
  const nz = normal?.z ?? 0;
  const nLen = Math.hypot(nx, nz) || 1;
  const ux = nx / nLen;
  const uz = nz / nLen;
  const tx = -uz;
  const tz = ux;
  const hw = width / 2;
  const hd = depth / 2;
  return [
    { x: center.x + hw * tx + hd * ux, z: center.z + hw * tz + hd * uz },
    { x: center.x + hw * tx - hd * ux, z: center.z + hw * tz - hd * uz },
    { x: center.x - hw * tx - hd * ux, z: center.z - hw * tz - hd * uz },
    { x: center.x - hw * tx + hd * ux, z: center.z - hw * tz + hd * uz },
  ];
}

function getWallFloorOverlapDetails({
  wallPos,
  wallNormal,
  wallW,
  wallH,
  wallD,
  isDoor,
  floorPos,
  floorW,
  floorD,
  floorRot,
  floorHeight,
  epsilon = TOUCH_EPSILON,
}) {
  const nx = wallNormal?.x ?? 0;
  const nz = wallNormal?.z ?? 0;
  const wallCenter = {
    x: wallPos.x + (wallD / 2) * nx,
    y: isDoor ? wallPos.y : wallPos.y + wallH / 2,
    z: wallPos.z + (wallD / 2) * nz,
  };

  const wallBottom = wallCenter.y - wallH / 2;
  const wallTop = wallCenter.y + wallH / 2;
  const floorBottom = floorPos.y ?? 0;
  const floorTop = floorBottom + (floorHeight ?? 1);
  const overlapY = Math.min(wallTop, floorTop) - Math.max(wallBottom, floorBottom);
  if (overlapY <= epsilon) {
    return { overlaps: false, overlapY, overlapXZ: -Infinity, wallCenter };
  }

  const wallCorners = getWallOBBCornersXZ(wallCenter, wallNormal, wallW, wallD);
  const floorCorners = getFloorOBBCornersXZ(floorPos, floorW, floorD, floorRot);

  const nLen = Math.hypot(nx, nz) || 1;
  const wallNormalAxis = { x: nx / nLen, z: nz / nLen };
  const wallTangentAxis = { x: -wallNormalAxis.z, z: wallNormalAxis.x };
  const floorWidthAxis = { x: Math.cos(floorRot), z: -Math.sin(floorRot) };
  const floorDepthAxis = { x: -Math.sin(floorRot), z: -Math.cos(floorRot) };
  const axes = [wallNormalAxis, wallTangentAxis, floorWidthAxis, floorDepthAxis];

  let minAxisOverlap = Infinity;
  for (const axis of axes) {
    const wInt = projectPointsOntoAxis(wallCorners, axis);
    const fInt = projectPointsOntoAxis(floorCorners, axis);
    const overlap = getIntervalOverlap(wInt, fInt);
    if (overlap <= epsilon) {
      return { overlaps: false, overlapY, overlapXZ: overlap, wallCenter };
    }
    if (overlap < minAxisOverlap) minAxisOverlap = overlap;
  }

  return { overlaps: true, overlapY, overlapXZ: minAxisOverlap, wallCenter };
}

/**
 * True if a wall item (room item or wall cabinet) and a floor cabinet overlap in 3D.
 * wallPos: back face (XZ); for Door (isDoor) position.y is center, else bottom.
 */
function doWallItemAndFloorItemOverlap(
  wallPos,
  wallNormal,
  wallW,
  wallH,
  wallD,
  isDoor,
  floorPos,
  floorW,
  floorD,
  floorRot,
  floorHeight,
) {
  const nx = wallNormal?.x ?? 0;
  const nz = wallNormal?.z ?? 0;
  const wallCenter = {
    x: wallPos.x + (wallD / 2) * nx,
    y: isDoor ? wallPos.y : wallPos.y + wallH / 2,
    z: wallPos.z + (wallD / 2) * nz,
  };
  const wallBox = getWallItemAABB(
    wallCenter,
    wallNormal,
    wallW,
    wallH,
    wallD,
  );
  const floorBox = getFloorItem3DAABB(
    floorPos,
    floorW,
    floorD,
    floorRot,
    floorHeight,
  );
  return doAABB3DOverlap(wallBox, floorBox);
}

/**
 * World AABB for any placed item (floor or wall). Use for drawing overlap bounding boxes.
 * For wall items, use the same convention as the green selected OBB:
 * placement.position is treated as the wall item's local origin (XZ center, Y at bottom),
 * then converted to AABB by applying wall-normal rotation and size.
 * @param {{ position: {x,y,z}, dragPointNormal?: {x,z}, roomItemWidth?: number, roomItemHeight?: number }} placement
 * @param {{ boundingBox?: { width, height, depth }, itemType?: string }} meta
 * @returns {{ minX, maxX, minY, maxY, minZ, maxZ } | null }
 */
export function getPlacedItemWorldAABB(placement, meta) {
  if (!placement?.position || !meta?.boundingBox) return null;
  const pos = placement.position;
  const w = placement.roomItemWidth ?? meta.boundingBox.width ?? 1;
  const h = placement.roomItemHeight ?? meta.boundingBox.height ?? 1;
  const d = meta.boundingBox.depth ?? 1;
  if (meta.itemType === "wall") {
    const n = placement.dragPointNormal ?? null;
    if (!n) return null;
    // Door (101): position.y is vertical center; TV/Window (100,102): position.y is bottom (mesh offset 0,h/2,d/2)
    const isDoor = placement.cabinetId === 101;
    const anchorY = getWallPlacementY(placement);
    let centerY = isDoor ? anchorY : anchorY + h / 2;
    if (isDoor && meta.meshCenterOffsetY != null) {
      centerY += meta.meshCenterOffsetY;
    }
    const center = {
      x: pos.x,
      y: centerY,
      z: pos.z,
    };
    return getWallItemAABB(center, n, w, h, d);
  }
  const rot = getPlacementFloorRotationY(placement);
  return getFloorItem3DAABB(pos, w, d, rot, h);
}

/**
 * True if a wall item's extent goes outside the wall bounds (penetrates wall or room).
 * @param {{ x, y, z }} position
 * @param {{ x, z }} normal - inward wall normal
 * @param {number} width - item width (along wall)
 * @param {number} height - item height
 * @param {{ walls: Array<{ wallId, plane, normal, width, height }>, floor: { corners: Array<{x,z}> } }} descriptor
 */
function wallItemPenetratesWall(
  position,
  normal,
  width,
  height,
  descriptor,
  isDoor = false,
  epsilon = TOUCH_EPSILON,
) {
  const corners = descriptor?.floor?.corners;
  const walls = descriptor?.walls;
  if (!corners?.length || !walls?.length) return false;
  const n = normal;
  let wallIndex = -1;
  for (let w = 0; w < walls.length; w++) {
    const wn = walls[w].normal;
    if (sameWallNormal(n, wn)) {
      wallIndex = w;
      break;
    }
  }
  if (wallIndex < 0) return { penetrates: false, reason: null, wallId: null };
  const wall = walls[wallIndex];
  const from = wallIndex;
  const to = (wallIndex + 1) % 4;
  const start = corners[from];
  const end = corners[to];
  const tw = wall.width;
  const tx = tw < 1e-10 ? 0 : (end.x - start.x) / tw;
  const tz = tw < 1e-10 ? 0 : (end.z - start.z) / tw;
  const along =
    (position.x - start.x) * tx + (position.z - start.z) * tz;
  const halfW = width / 2;
  const penetrationStart = -(along - halfW);
  if (penetrationStart > epsilon) {
    return {
      penetrates: true,
      reason: "along-start",
      penetrationAmount: penetrationStart,
      wallId: wall.wallId,
      along,
      halfW,
      wallWidth: tw,
      epsilon,
    };
  }
  const penetrationEnd = along + halfW - tw;
  if (penetrationEnd > epsilon) {
    return {
      penetrates: true,
      reason: "along-end",
      penetrationAmount: penetrationEnd,
      wallId: wall.wallId,
      along,
      halfW,
      wallWidth: tw,
      epsilon,
    };
  }
  const wallHeight = wall.height ?? 3.048;
  const { bottom: minY, top: maxY } = wallItemYExtent(position.y, height, isDoor);
  const floorPenetration = FLOOR_Y - minY;
  if (floorPenetration > epsilon) {
    return {
      penetrates: true,
      reason: "below-floor",
      penetrationAmount: floorPenetration,
      wallId: wall.wallId,
      minY,
      floorY: FLOOR_Y,
      epsilon,
    };
  }
  const topPenetration = maxY - wallHeight;
  if (topPenetration > epsilon) {
    return {
      penetrates: true,
      reason: "above-wall-height",
      penetrationAmount: topPenetration,
      wallId: wall.wallId,
      maxY,
      wallHeight,
      epsilon,
    };
  }
  return { penetrates: false, reason: null, wallId: wall.wallId, epsilon };
}

/**
 * Indices into placedPositions of items that overlap (floor vs floor, wall vs wall, or wall penetrating wall).
 * When wallWidthMap (and optionally wallHeightMap) are provided, also checks wall-item vs wall-item and wall-item penetrating wall.
 * @param {Array} placedPositions
 * @param {Record<string, { boundingBox?: { width, depth, height }, itemType?: string }>} reverseIdMap
 * @param {number | null} excludeIndex - if set, treat this index as not placed (e.g. dragged item candidate)
 * @param {{ front?: number, right?: number, back?: number, left?: number }} [wallWidthMap]
 * @param {{ front?: number, right?: number, back?: number, left?: number }} [wallHeightMap]
 * @returns {Set<number>}
 */
export function getOverlappingPlacedIndices(
  placedPositions,
  reverseIdMap,
  excludeIndex = null,
  wallWidthMap = null,
  wallHeightMap = null,
) {
  const overlapping = new Set();
  const maybeLogUpperCorner = (placement, payload) => {
    if (!DEBUG_UPPER_CORNER_OVERLAP) return;
    if (placement?.cabinetId !== 12) return;
    console.warn("[Upper Corner overlap debug]", payload);
  };

  // Floor items vs floor items
  for (let i = 0; i < placedPositions.length; i++) {
    if (i === excludeIndex) continue;
    const one = placedPositions[i];
    const meta = reverseIdMap[one?.cabinetId];
    if (!meta?.boundingBox || meta.itemType === "wall") continue;
    const w1 = one.roomItemWidth ?? meta.boundingBox.width ?? 1;
    const d1 = meta.boundingBox.depth ?? 1;
    const rot1 = getPlacementFloorRotationY(one);
    const p1 = getOffsetFloorCenter(one.position, rot1, meta);
    for (let j = i + 1; j < placedPositions.length; j++) {
      if (j === excludeIndex) continue;
      const two = placedPositions[j];
      const meta2 = reverseIdMap[two?.cabinetId];
      if (!meta2?.boundingBox || meta2.itemType === "wall") continue;
      const w2 = two.roomItemWidth ?? meta2.boundingBox.width ?? 1;
      const d2 = meta2.boundingBox.depth ?? 1;
      const rot2 = getPlacementFloorRotationY(two);
      const p2 = getOffsetFloorCenter(two.position, rot2, meta2);
      if (doFloorItemsOverlap(p1, w1, d1, rot1, p2, w2, d2, rot2)) {
        overlapping.add(i);
        overlapping.add(j);
      }
    }
  }

  // Wall items: overlap with each other (same wall) and penetration of wall bounds
  if (wallWidthMap != null) {
    const descriptor = getRoomDescriptor(wallWidthMap, wallHeightMap ?? {});

    for (let i = 0; i < placedPositions.length; i++) {
      if (i === excludeIndex) continue;
      const one = placedPositions[i];
      const meta = reverseIdMap[one?.cabinetId];
      if (!meta?.boundingBox || meta.itemType !== "wall") continue;
      const n1 = one.dragPointNormal ?? null;
      if (!n1) continue;
      const w1 = one.roomItemWidth ?? meta.boundingBox.width ?? 1;
      const h1 = one.roomItemHeight ?? meta.boundingBox.height ?? 1;
      const depth1 = meta.boundingBox.depth ?? 0.1;
      const p1 = {
        ...one.position,
        y: getWallPlacementY(one),
      };
      const isDoor1 = one.cabinetId === 101;
      const isUpperCornerWall = meta.label === "Upper Corner";

      if (isUpperCornerWall) {
        // Upper Corner uses corner-facing rotation normal (diagonal), not a wall-plane normal.
        // Treat it as a rotated footprint item for wall-vs-floor checks.
        const upperRot =
          one.dragPointNormal != null
            ? Math.atan2(one.dragPointNormal.x, one.dragPointNormal.z)
            : 0;
        const upperPos = { x: p1.x, y: p1.y, z: p1.z };
        const upperBottom = upperPos.y;
        const upperTop = upperPos.y + h1;
        for (let j = 0; j < placedPositions.length; j++) {
          if (j === excludeIndex || j === i) continue;
          const two = placedPositions[j];
          const meta2 = reverseIdMap[two?.cabinetId];
          if (!meta2?.boundingBox || meta2.itemType === "wall") continue;
          const floorW = two.roomItemWidth ?? meta2.boundingBox.width ?? 1;
          const floorD = meta2.boundingBox.depth ?? 1;
          const floorRot = getPlacementFloorRotationY(two);
          const floorHeight = meta2.boundingBox.height ?? 1;
          const floorPos = getOffsetFloorCenter(two.position, floorRot, meta2);
          const floorBottom = floorPos.y ?? 0;
          const floorTop = floorBottom + floorHeight;
          const overlapY = overlapAmount1D(upperBottom, upperTop, floorBottom, floorTop);
          if (overlapY <= TOUCH_EPSILON) continue;
          if (
            doFloorItemsOverlap(
              { x: upperPos.x, z: upperPos.z },
              w1,
              depth1,
              upperRot,
              { x: floorPos.x, z: floorPos.z },
              floorW,
              floorD,
              floorRot,
            )
          ) {
            overlapping.add(i);
            overlapping.add(j);
            maybeLogUpperCorner(one, {
              type: "upper-corner-vs-floor-overlap",
              otherIndex: j,
              otherCabinetId: two.cabinetId,
              epsilon: TOUCH_EPSILON,
              overlapDepth: { y: overlapY },
              upper: {
                index: i,
                position: upperPos,
                width: w1,
                depth: depth1,
                rotationY: upperRot,
                bottom: upperBottom,
                top: upperTop,
              },
              floor: {
                index: j,
                position: floorPos,
                width: floorW,
                depth: floorD,
                rotationY: floorRot,
                bottom: floorBottom,
                top: floorTop,
              },
            });
          }
        }
        // Skip wall-plane-specific checks for Upper Corner.
        continue;
      }

      const penetration = wallItemPenetratesWall(
        p1,
        n1,
        w1,
        h1,
        descriptor,
        isDoor1,
      );
      if (penetration.penetrates) {
        overlapping.add(i);
        maybeLogUpperCorner(one, {
          type: "wall-penetration",
          wallId: penetration.wallId,
          reason: penetration.reason,
          penetrationAmount: penetration.penetrationAmount,
          epsilon: penetration.epsilon,
          item: { index: i, cabinetId: one.cabinetId, position: p1, normal: n1, width: w1, height: h1 },
          footprintCornersXZ: [
            { x: p1.x + (-n1.z ?? 0) * (w1 / 2), z: p1.z + (n1.x ?? 0) * (w1 / 2) },
            { x: p1.x - (-n1.z ?? 0) * (w1 / 2), z: p1.z - (n1.x ?? 0) * (w1 / 2) },
          ],
        });
      }

      for (let j = i + 1; j < placedPositions.length; j++) {
        if (j === excludeIndex) continue;
        const two = placedPositions[j];
        const meta2 = reverseIdMap[two?.cabinetId];
        if (!meta2?.boundingBox || meta2.itemType !== "wall") continue;
        const n2 = two.dragPointNormal ?? null;
        if (!n2) continue;
        const w2 = two.roomItemWidth ?? meta2.boundingBox.width ?? 1;
        const h2 = two.roomItemHeight ?? meta2.boundingBox.height ?? 1;
        const p2 = {
          ...two.position,
          y: getWallPlacementY(two),
        };
        const isDoor2 = two.cabinetId === 101;
        if (doWallItemsOverlap(p1, n1, w1, h1, isDoor1, p2, n2, w2, h2, isDoor2)) {
          overlapping.add(i);
          overlapping.add(j);
          maybeLogUpperCorner(one, {
            type: "wall-vs-wall-overlap",
            otherIndex: j,
            otherCabinetId: two.cabinetId,
            epsilon: TOUCH_EPSILON,
            item: { index: i, cabinetId: one.cabinetId, position: p1, normal: n1, width: w1, height: h1 },
            other: { index: j, cabinetId: two.cabinetId, position: p2, normal: n2, width: w2, height: h2 },
          });
        }
      }

      // Wall item (room item / wall cabinet) vs floor cabinet
      for (let j = 0; j < placedPositions.length; j++) {
        if (j === excludeIndex || j === i) continue;
        const two = placedPositions[j];
        const meta2 = reverseIdMap[two?.cabinetId];
        if (!meta2?.boundingBox || meta2.itemType === "wall") continue;
        const floorW = two.roomItemWidth ?? meta2.boundingBox.width ?? 1;
        const floorD = meta2.boundingBox.depth ?? 1;
        const floorRot = getPlacementFloorRotationY(two);
        const floorHeight = meta2.boundingBox.height ?? 1;
        const floorPos = getOffsetFloorCenter(two.position, floorRot, meta2);
        const overlapDetails = getWallFloorOverlapDetails({
          wallPos: p1,
          wallNormal: n1,
          wallW: w1,
          wallH: h1,
          wallD: depth1,
          isDoor: isDoor1,
          floorPos,
          floorW,
          floorD,
          floorRot,
          floorHeight,
          epsilon: TOUCH_EPSILON,
        });
        if (overlapDetails.overlaps) {
          overlapping.add(i);
          overlapping.add(j);
          const wallBox = getWallItemAABB(
            overlapDetails.wallCenter,
            n1,
            w1,
            h1,
            depth1,
          );
          const floorBox = getFloorItem3DAABB(
            floorPos,
            floorW,
            floorD,
            floorRot,
            floorHeight,
          );
          maybeLogUpperCorner(one, {
            type: "wall-vs-floor-overlap",
            otherIndex: j,
            otherCabinetId: two.cabinetId,
            epsilon: TOUCH_EPSILON,
            overlapDepth: {
              y: overlapDetails.overlapY,
              xz: overlapDetails.overlapXZ,
            },
            wallBox,
            floorBox,
            item: { index: i, cabinetId: one.cabinetId, position: p1, normal: n1, width: w1, height: h1, depth: depth1 },
            other: { index: j, cabinetId: two.cabinetId, position: floorPos, width: floorW, depth: floorD, rotationY: floorRot, height: floorHeight },
          });
        }
      }
    }
  }

  return overlapping;
}

/**
 * True if a candidate floor item would overlap any placed floor item.
 * Use when validating drag/drop/place.
 * @param {Array} placedPositions
 * @param {Record<string, { boundingBox?: { width, depth }, itemType?: string }>} reverseIdMap
 * @param {number | null} excludeIndex - index being moved (skip when comparing to others)
 * @param {{ x: number, z: number }} candidatePos
 * @param {number} candidateWidth
 * @param {number} candidateDepth
 * @param {number} candidateRotationY
 * @returns {boolean}
 */
export function wouldPositionOverlap(
  placedPositions,
  reverseIdMap,
  excludeIndex,
  candidatePos,
  candidateWidth,
  candidateDepth,
  candidateRotationY,
) {
  for (let i = 0; i < placedPositions.length; i++) {
    if (i === excludeIndex) continue;
    const other = placedPositions[i];
    const meta = reverseIdMap[other?.cabinetId];
    if (!meta?.boundingBox || meta.itemType === "wall") continue;
    const ow = other.roomItemWidth ?? meta.boundingBox.width ?? 1;
    const od = meta.boundingBox.depth ?? 1;
    const otherRot = getPlacementFloorRotationY(other);
    const op = getOffsetFloorCenter(other.position, otherRot, meta);
    if (
      doFloorItemsOverlap(
        candidatePos,
        candidateWidth,
        candidateDepth,
        candidateRotationY,
        op,
        ow,
        od,
        otherRot,
      )
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Solve snapping for a cabinet position: wall snap (with gap) then object-to-object.
 *
 * @param {{
 *   desiredPos: { x: number, y: number, z: number };
 *   width: number;
 *   depth: number;
 *   rotationY: number;
 *   wallWidthMap: { front?: number, right?: number, back?: number, left?: number };
 *   placedPositions: Array<{ position: { x, y, z }, cabinetId: string, dragPointNormal?: { x, z } }>;
 *   reverseIdMap: Record<string, { boundingBox?: { width: number, depth: number }, itemType?: string }>;
 *   excludeIndex?: number | null;
 * }} args
 * @returns {{ position: { x: number, y: number, z: number }; snapped: boolean; snappedDirs: Set<string> }}
 */
export function solveSnap({
  desiredPos,
  width,
  depth,
  rotationY,
  wallWidthMap,
  placedPositions,
  reverseIdMap,
  excludeIndex = null,
}) {
  const pos = { x: desiredPos.x, y: desiredPos.y ?? 0, z: desiredPos.z };
  const snappedDirs = new Set();
  const thresh = SNAP_THRESHOLD_ITEM_EDGE;
  const gap = WALL_SNAP_GAP;

  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const forwardX = Math.sin(rotationY);
  const forwardZ = Math.cos(rotationY);

  const descriptor = getRoomDescriptor(wallWidthMap);

  // Wall snapping: face at plane + gap
  for (const wall of descriptor.walls) {
    const { plane, normal } = wall;
    const nx = plane.nx;
    const nz = plane.nz;
    const dist = planeDistanceToPoint(pos, plane);
    const faceDist = halfDepth * (forwardX * nx + forwardZ * nz);
    const targetDist = gap;
    const adjust = dist - targetDist - faceDist;

    if (Math.abs(adjust) < thresh) {
      pos.x += -adjust * nx;
      pos.z += -adjust * nz;
      markDirFromNormal(nx, nz, snappedDirs);
    }
  }

  // Object-to-object (AABB in XZ)
  const otherBoxes = [];
  for (let i = 0; i < placedPositions.length; i++) {
    if (i === excludeIndex) continue;
    const other = placedPositions[i];
    const meta = reverseIdMap[other?.cabinetId];
    if (!meta?.boundingBox || meta.itemType === "wall") continue;
    const ow = meta.boundingBox.width ?? 1;
    const od = meta.boundingBox.depth ?? 1;
    const otherRot = getPlacementFloorRotationY(other);
    const op = getOffsetFloorCenter(other.position, otherRot, meta);
    const box = getFloorItemAABB(op.x, op.z, ow, od, otherRot);
    otherBoxes.push({ id: other.cabinetId, ...box });
  }

  // Use each item's rotated world AABB (not axis-aligned width/depth on center) so
  // wall-facing lockers still snap flush in world XZ after findFloorItemEdgeSnap.
  for (const box of otherBoxes) {
    let cand = getFloorItemAABB(pos.x, pos.z, width, depth, rotationY);
    const zOverlap = cand.maxZ > box.minZ && cand.minZ < box.maxZ;
    const dxNeg = Math.abs(cand.minX - box.maxX);
    if (dxNeg < thresh && zOverlap) {
      pos.x += box.maxX - cand.minX;
      snappedDirs.add("negX");
    } else {
      cand = getFloorItemAABB(pos.x, pos.z, width, depth, rotationY);
      const dxPos = Math.abs(cand.maxX - box.minX);
      if (dxPos < thresh && zOverlap) {
        pos.x += box.minX - cand.maxX;
        snappedDirs.add("posX");
      }
    }

    cand = getFloorItemAABB(pos.x, pos.z, width, depth, rotationY);
    const xOverlap = cand.maxX > box.minX && cand.minX < box.maxX;
    const dzNeg = Math.abs(cand.minZ - box.maxZ);
    if (dzNeg < thresh && xOverlap) {
      pos.z += box.maxZ - cand.minZ;
      snappedDirs.add("negZ");
    } else {
      cand = getFloorItemAABB(pos.x, pos.z, width, depth, rotationY);
      const dzPos = Math.abs(cand.maxZ - box.minZ);
      if (dzPos < thresh && xOverlap) {
        pos.z += box.minZ - cand.maxZ;
        snappedDirs.add("posZ");
      }
    }
  }

  return {
    position: pos,
    snapped: snappedDirs.size > 0,
    snappedDirs,
  };
}
