/**
 * Shared wall-cabinet snapping helpers for ghost (GenerateAllCabinetsInScene) and place/drag (RoomModel).
 */

import computeQuadPoints from "@/utils/computeQuadPoints";
import {
  SNAP_DISTANCE_THRESHOLD_WALL,
  SNAP_DISTANCE_THRESHOLD_FLOOR_NEAR_WALL,
  WALL_SNAP_GAP,
} from "@/data/DragonfireTools/snapConstants";
import { getCornerSnapPoints } from "@/data/DragonfireTools/cornerSnapPoints";

export { SNAP_DISTANCE_THRESHOLD_WALL, SNAP_DISTANCE_THRESHOLD_FLOOR_NEAR_WALL };
export { WALL_SNAP_GAP };

const WALL_DEFS = [
  { name: "front", from: 0, to: 1 },
  { name: "right", from: 1, to: 2 },
  { name: "back", from: 2, to: 3 },
  { name: "left", from: 3, to: 0 },
];

/**
 * Inward-pointing unit normal for a wall (toward room/ground). Use for snap and rotation so items face the wall.
 * @param {string} wallLabel - "front" | "back" | "left" | "right"
 * @param {{ front?: number, right?: number, back?: number, left?: number }} wallWidthMap - wall widths
 * @returns {{ x: number, y: number, z: number }}
 */
export function getInwardNormalForWall(wallLabel, wallWidthMap) {
  const frontW = wallWidthMap?.front ?? 9.144;
  const rightW = wallWidthMap?.right ?? 7.3152;
  const backW = wallWidthMap?.back ?? 9.144;
  const leftW = wallWidthMap?.left ?? 7.3152;
  const floorPoints = computeQuadPoints(frontW, rightW, backW, leftW);
  const c = floorPoints.map((p, i) => ({
    x: p.x,
    z: -p.y,
  }));
  const def = WALL_DEFS.find((d) => d.name === wallLabel);
  if (!def) return { x: 0, y: 0, z: 1 };
  const dx = c[def.to].x - c[def.from].x;
  const dz = c[def.to].z - c[def.from].z;
  let nx = -dz;
  let nz = dx;
  const len = Math.sqrt(nx * nx + nz * nz);
  if (len < 1e-10) return { x: 0, y: 0, z: 1 };
  nx /= len;
  nz /= len;
  let d = -(nx * c[def.from].x + nz * c[def.from].z);
  if (d < 0) {
    nx = -nx;
    nz = -nz;
  }
  return { x: nx, y: 0, z: nz };
}

/**
 * Wall whose plane is closest to the point and its distance (for floor items: rotate only when near wall).
 * @param {{ x: number, z: number }} point - XZ position
 * @param {{ front?: number, right?: number, back?: number, left?: number }} wallWidthMap
 * @returns {{ name: string, distance: number }} - name "front"|"back"|"left"|"right", distance to that wall
 */
export function getClosestWallToPoint(point, wallWidthMap) {
  const frontW = wallWidthMap?.front ?? 9.144;
  const rightW = wallWidthMap?.right ?? 7.3152;
  const backW = wallWidthMap?.back ?? 9.144;
  const leftW = wallWidthMap?.left ?? 7.3152;
  const floorPoints = computeQuadPoints(frontW, rightW, backW, leftW);
  const c = floorPoints.map((p, i) => ({ x: p.x, z: -p.y }));
  let bestName = "front";
  let bestDist = Infinity;
  for (const def of WALL_DEFS) {
    const dx = c[def.to].x - c[def.from].x;
    const dz = c[def.to].z - c[def.from].z;
    let nx = -dz;
    let nz = dx;
    const len = Math.sqrt(nx * nx + nz * nz);
    if (len < 1e-10) continue;
    nx /= len;
    nz /= len;
    let d = -(nx * c[def.from].x + nz * c[def.from].z);
    if (d < 0) {
      nx = -nx;
      nz = -nz;
      d = -d;
    }
    const dist = Math.abs(nx * point.x + nz * point.z + d);
    if (dist < bestDist) {
      bestDist = dist;
      bestName = def.name;
    }
  }
  return { name: bestName, distance: bestDist };
}

/**
 * Closest wall and distance from cabinet back face to that wall (not center).
 * Use this for "near wall" and snap so logic is cabinet-to-wall, not center-to-wall.
 * @param {{ x: number, z: number }} center - cabinet center XZ
 * @param {number} depth - cabinet depth
 * @param {number} rotationY - radians (forward = sin(rot), cos(rot))
 * @param {{ front?: number, right?: number, back?: number, left?: number }} wallWidthMap
 * @returns {{ name: string, distance: number }}
 */
export function getClosestWallToCabinetBack(center, depth, rotationY, wallWidthMap) {
  const forwardX = Math.sin(rotationY);
  const forwardZ = Math.cos(rotationY);
  const halfDepth = depth / 2;
  const backFace = {
    x: center.x - halfDepth * forwardX,
    z: center.z - halfDepth * forwardZ,
  };
  return getClosestWallToPoint(backFace, wallWidthMap);
}

/**
 * Closest wall and the minimum distance from any cabinet corner to that wall.
 * When this distance is below threshold, the cabinet is "touched" the wall by any part (corner or edge).
 * Use for: rotate when cabinet touches wall by any means.
 * @param {{ x: number, z: number }} center - cabinet center XZ
 * @param {number} width - cabinet width
 * @param {number} depth - cabinet depth
 * @param {number} rotationY - radians
 * @param {{ front?: number, right?: number, back?: number, left?: number }} wallWidthMap
 * @returns {{ name: string, distance: number }}
 */
export function getClosestWallToCabinetFootprint(center, width, depth, rotationY, wallWidthMap) {
  const corners = getFloorItemCornersXZ(center.x, center.z, width, depth, rotationY);
  let bestName = "front";
  let bestDist = Infinity;
  for (const def of WALL_DEFS) {
    let minDist = Infinity;
    for (const corner of corners) {
      const d = getDistanceToWall(corner, def.name, wallWidthMap);
      if (d < minDist) minDist = d;
    }
    if (minDist < bestDist) {
      bestDist = minDist;
      bestName = def.name;
    }
  }
  return { name: bestName, distance: bestDist };
}

/**
 * Distance from point to a specific wall's plane (for sticky-wall logic: stay on first wall until left).
 * @param {{ x: number, z: number }} point
 * @param {string} wallId - "front"|"back"|"left"|"right"
 * @param {{ front?: number, right?: number, back?: number, left?: number }} wallWidthMap
 * @returns {number}
 */
export function getDistanceToWall(point, wallId, wallWidthMap) {
  const frontW = wallWidthMap?.front ?? 9.144;
  const rightW = wallWidthMap?.right ?? 7.3152;
  const backW = wallWidthMap?.back ?? 9.144;
  const leftW = wallWidthMap?.left ?? 7.3152;
  const floorPoints = computeQuadPoints(frontW, rightW, backW, leftW);
  const c = floorPoints.map((p) => ({ x: p.x, z: -p.y }));
  const def = WALL_DEFS.find((d) => d.name === wallId);
  if (!def) return Infinity;
  const dx = c[def.to].x - c[def.from].x;
  const dz = c[def.to].z - c[def.from].z;
  let nx = -dz;
  let nz = dx;
  const len = Math.sqrt(nx * nx + nz * nz);
  if (len < 1e-10) return Infinity;
  nx /= len;
  nz /= len;
  let d = -(nx * c[def.from].x + nz * c[def.from].z);
  if (d < 0) {
    nx = -nx;
    nz = -nz;
    d = -d;
  }
  return Math.abs(nx * point.x + nz * point.z + d);
}

/**
 * Get the four wall planes (inward normal, positive d). Interior = nx*x + nz*z + d > 0.
 * @param {{ front?: number, right?: number, back?: number, left?: number }} wallWidthMap
 * @returns {Array<{ nx: number, nz: number, d: number }>}
 */
function getRoomPlanes(wallWidthMap) {
  const frontW = wallWidthMap?.front ?? 9.144;
  const rightW = wallWidthMap?.right ?? 7.3152;
  const backW = wallWidthMap?.back ?? 9.144;
  const leftW = wallWidthMap?.left ?? 7.3152;
  const floorPoints = computeQuadPoints(frontW, rightW, backW, leftW);
  const c = floorPoints.map((p) => ({ x: p.x, z: -p.y }));
  return WALL_DEFS.map((def) => {
    const dx = c[def.to].x - c[def.from].x;
    const dz = c[def.to].z - c[def.from].z;
    let nx = -dz;
    let nz = dx;
    const len = Math.sqrt(nx * nx + nz * nz);
    if (len < 1e-10) return { nx: 0, nz: 0, d: 0 };
    nx /= len;
    nz /= len;
    let d = -(nx * c[def.from].x + nz * c[def.from].z);
    if (d < 0) {
      nx = -nx;
      nz = -nz;
      d = -d;
    }
    return { nx, nz, d };
  });
}

/** Minimum distance each cabinet corner must be inside the wall (no intersect/pass-through). */
const FLOOR_INSET_EPSILON = 1e-4;

/**
 * Get the four corners of a floor item in XZ (world), same convention as floorItemSnapUtils.
 * @param {number} cx - center x
 * @param {number} cz - center z
 * @param {number} width
 * @param {number} depth
 * @param {number} rotationY - radians
 * @returns {Array<{ x: number, z: number }>}
 */
function getFloorItemCornersXZ(cx, cz, width, depth, rotationY) {
  const hw = width / 2;
  const hd = depth / 2;
  const cosR = Math.cos(rotationY);
  const sinR = Math.sin(rotationY);
  return [
    { x: cx - hw * cosR - hd * sinR, z: cz + hw * sinR - hd * cosR },
    { x: cx + hw * cosR - hd * sinR, z: cz - hw * sinR - hd * cosR },
    { x: cx + hw * cosR + hd * sinR, z: cz - hw * sinR + hd * cosR },
    { x: cx - hw * cosR + hd * sinR, z: cz + hw * sinR + hd * cosR },
  ];
}

/**
 * Clamp a floor item position so the entire cabinet footprint stays strictly inside the room.
 * No corner may extend beyond, intersect, or pass through any exterior wall. If the placement
 * would go outside, the position is repositioned inside the valid interior space.
 * @param {{ x: number, y?: number, z: number }} position - center of the item
 * @param {number} width - cabinet width (XZ)
 * @param {number} depth - cabinet depth (XZ)
 * @param {number} rotationY - rotation in radians around Y
 * @param {{ front?: number, right?: number, back?: number, left?: number }} wallWidthMap
 * @returns {{ x: number, y: number, z: number }} clamped position (y preserved)
 */
export function clampFloorPositionToRoom(
  position,
  width,
  depth,
  rotationY,
  wallWidthMap,
) {
  const planes = getRoomPlanes(wallWidthMap);
  let x = position.x;
  let z = position.z;
  const y = position.y ?? 0;
  const minInside = FLOOR_INSET_EPSILON;
  const maxIter = 16;
  for (let iter = 0; iter < maxIter; iter++) {
    const corners = getFloorItemCornersXZ(x, z, width, depth, rotationY);
    let changed = false;
    for (const { nx, nz, d } of planes) {
      let minSignedDist = Infinity;
      for (const c of corners) {
        const sd = nx * c.x + nz * c.z + d;
        if (sd < minSignedDist) minSignedDist = sd;
      }
      if (minSignedDist < minInside) {
        const push = minInside - minSignedDist;
        x += nx * push;
        z += nz * push;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return { x, y, z };
}

/**
 * Get wall plane equation (XZ): nx*x + nz*z + d = 0, interior side has nx*x + nz*z + d > 0.
 * @param {string} wallLabel - "front" | "back" | "left" | "right"
 * @param {{ front?: number, right?: number, back?: number, left?: number }} wallWidthMap
 * @returns {{ nx: number, nz: number, d: number }}
 */
export function getWallPlaneXZ(wallLabel, wallWidthMap) {
  const frontW = wallWidthMap?.front ?? 9.144;
  const rightW = wallWidthMap?.right ?? 7.3152;
  const backW = wallWidthMap?.back ?? 9.144;
  const leftW = wallWidthMap?.left ?? 7.3152;
  const floorPoints = computeQuadPoints(frontW, rightW, backW, leftW);
  const c = floorPoints.map((p) => ({ x: p.x, z: -p.y }));
  const def = WALL_DEFS.find((d) => d.name === wallLabel);
  if (!def) return { nx: 0, nz: 1, d: 0 };
  const dx = c[def.to].x - c[def.from].x;
  const dz = c[def.to].z - c[def.from].z;
  let nx = -dz;
  let nz = dx;
  const len = Math.sqrt(nx * nx + nz * nz);
  if (len < 1e-10) return { nx: 0, nz: 1, d: 0 };
  nx /= len;
  nz /= len;
  let d = -(nx * c[def.from].x + nz * c[def.from].z);
  if (d < 0) {
    nx = -nx;
    nz = -nz;
    d = -d;
  }
  return { nx, nz, d };
}

/**
 * Snap a point to the wall plane (XZ) plus WALL_SNAP_GAP along the inward normal.
 * Use for room items (TV/Door/Window) so they stay flush on the wall at all times.
 * @param {{ x: number, y: number, z: number }} point - world position
 * @param {string} wallLabel - "front" | "back" | "left" | "right"
 * @param {{ front?: number, right?: number, back?: number, left?: number }} wallWidthMap
 * @returns {{ x: number, y: number, z: number }}
 */
export function snapPointToWallPlane(point, wallLabel, wallWidthMap) {
  const { nx, nz, d } = getWallPlaneXZ(wallLabel, wallWidthMap);
  const signedDist = nx * point.x + nz * point.z + d;
  const projX = point.x - signedDist * nx;
  const projZ = point.z - signedDist * nz;
  return {
    x: projX + nx * WALL_SNAP_GAP,
    y: point.y,
    z: projZ + nz * WALL_SNAP_GAP,
  };
}

/**
 * Clamp a wall-mounted cabinet center along one wall segment so the cabinet
 * stays within that wall's horizontal bounds (no overhang past wall ends).
 * Assumes the item is already on/near that wall plane.
 * @param {{ x: number, y: number, z: number }} point
 * @param {string} wallLabel - "front" | "back" | "left" | "right"
 * @param {{ front?: number, right?: number, back?: number, left?: number }} wallWidthMap
 * @param {number} cabinetWidth - item width along wall tangent
 * @returns {{ x: number, y: number, z: number }}
 */
export function clampWallCabinetPositionToWallBounds(
  point,
  wallLabel,
  wallWidthMap,
  cabinetWidth,
) {
  const frontW = wallWidthMap?.front ?? 9.144;
  const rightW = wallWidthMap?.right ?? 7.3152;
  const backW = wallWidthMap?.back ?? 9.144;
  const leftW = wallWidthMap?.left ?? 7.3152;
  const floorPoints = computeQuadPoints(frontW, rightW, backW, leftW);
  const c = floorPoints.map((p) => ({ x: p.x, z: -p.y }));
  const def = WALL_DEFS.find((d) => d.name === wallLabel);
  if (!def) return point;

  const start = c[def.from];
  const end = c[def.to];
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len < 1e-10) return point;
  const tx = dx / len;
  const tz = dz / len;

  const along = (point.x - start.x) * tx + (point.z - start.z) * tz;
  const half = Math.max(0, (cabinetWidth ?? 0) / 2);
  const minAlong = half;
  const maxAlong = len - half;
  const clampedAlong =
    minAlong <= maxAlong
      ? Math.min(maxAlong, Math.max(minAlong, along))
      : len / 2;

  return {
    x: start.x + tx * clampedAlong,
    y: point.y,
    z: start.z + tz * clampedAlong,
  };
}

/**
 * True if cabinet is a corner type (snaps only to room corners, not wall/edge).
 * Uses bIsCornerCabinet when available, otherwise falls back to label.
 */
export function isCornerCabinet(labelOrMeta) {
  if (labelOrMeta == null) return false;
  if (typeof labelOrMeta === "object" && labelOrMeta.bIsCornerCabinet === true)
    return true;
  const label = typeof labelOrMeta === "string" ? labelOrMeta : labelOrMeta?.label;
  return label === "Upper Corner" || label === "Lower Corner";
}

/** True only for the "Lower Corner" cabinet (floor snap is strict). */
export function isLowerCornerCabinet(labelOrMeta) {
  if (labelOrMeta == null) return false;
  const label = typeof labelOrMeta === "string" ? labelOrMeta : labelOrMeta?.label;
  return label === "Lower Corner";
}

/** Unit tangent in XZ perpendicular to wall normal (along the wall). Degenerate normal -> world X. */
export function getWallTangentXZ(normal) {
  const nx = normal?.x ?? 0;
  const nz = normal?.z ?? 0;
  const lenSq = nx * nx + nz * nz;
  if (lenSq < 1e-10) return { x: 1, z: 0 };
  const len = Math.sqrt(lenSq);
  return { x: -nz / len, z: nx / len };
}

export function sameWallNormal(n1, n2) {
  if (!n1 || !n2) return false;
  const d =
    Math.abs(n1.x - n2.x) + Math.abs(n1.y - n2.y) + Math.abs(n1.z - n2.z);
  return d < 0.01;
}

export function getWallCabinetExtent(position, normal, width, height) {
  const tangent = getWallTangentXZ(normal);
  const alongCenter = position.x * tangent.x + position.z * tangent.z;
  const half = width / 2;
  return {
    alongMin: alongCenter - half,
    alongMax: alongCenter + half,
    yMin: position.y,
    yMax: position.y + height,
    tangent,
  };
}

export function computeWallToWallSnapOffset(
  movingPos,
  movingNormal,
  movingWidth,
  movingHeight,
  otherExtents,
  threshold,
) {
  const moving = getWallCabinetExtent(
    movingPos,
    movingNormal,
    movingWidth,
    movingHeight,
  );
  const rangesOverlap = (minA, maxA, minB, maxB, epsilon = 1e-6) =>
    maxA > minB - epsilon && maxB > minA - epsilon;
  let bestDAlong = 0;
  let bestDY = 0;
  let bestDistSq = threshold * threshold;

  otherExtents.forEach(({ alongMin, alongMax, yMin, yMax }) => {
    const alongOverlap = rangesOverlap(
      moving.alongMin,
      moving.alongMax,
      alongMin,
      alongMax,
    );
    const yOverlap = rangesOverlap(moving.yMin, moving.yMax, yMin, yMax);
    const pairs = [];
    // Snap left/right edges only when vertical spans overlap.
    if (yOverlap) {
      pairs.push([moving.alongMin, alongMax, "along"]);
      pairs.push([moving.alongMax, alongMin, "along"]);
    }
    // Snap top/bottom edges only when along-wall spans overlap.
    if (alongOverlap) {
      pairs.push([moving.yMin, yMax, "y"]);
      pairs.push([moving.yMax, yMin, "y"]);
    }
    pairs.forEach(([moveEdge, otherEdge, axis]) => {
      const d = otherEdge - moveEdge;
      const distSq = d * d;
      if (distSq < bestDistSq && distSq > 1e-10) {
        bestDistSq = distSq;
        if (axis === "along") {
          bestDAlong = d;
          bestDY = 0;
        } else {
          bestDAlong = 0;
          bestDY = d;
        }
      }
    });
  });

  return { dAlong: bestDAlong, dY: bestDY, tangent: moving.tangent };
}

export function getOtherWallCabinetsExtents(
  placedPositions,
  excludeIndex,
  currentNormal,
  reverseIdMap,
  wallWidthMap = null,
) {
  const getUpperCornerAdjacentNormals = (position) => {
    if (!wallWidthMap || !position) return [];
    const cornerPoints = getCornerSnapPoints(wallWidthMap, "upper");
    if (!cornerPoints.length) return [];
    let nearestPoint = null;
    let bestDistSq = Infinity;
    cornerPoints.forEach((point) => {
      const dx = (position.x ?? 0) - point.position.x;
      const dz = (position.z ?? 0) - point.position.z;
      const distSq = dx * dx + dz * dz;
      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        nearestPoint = point;
      }
    });
    if (!nearestPoint?.wallIds?.length) return [];
    return nearestPoint.wallIds
      .map((wallId) => getInwardNormalForWall(wallId, wallWidthMap))
      .filter(Boolean);
  };

  const extents = [];
  placedPositions.forEach((one, idx) => {
    if (idx === excludeIndex) return;
    const meta = reverseIdMap[one.cabinetId];
    if (!meta?.boundingBox || meta.itemType !== "wall") return;
    const { width, height } = meta.boundingBox;

    if (meta.label === "Upper Corner" && wallWidthMap) {
      const adjacentNormals = getUpperCornerAdjacentNormals(one.position);
      adjacentNormals.forEach((normal) => {
        if (!sameWallNormal(normal, currentNormal)) return;
        extents.push(getWallCabinetExtent(one.position, normal, width, height));
      });
      return;
    }

    if (!sameWallNormal(one.dragPointNormal, currentNormal)) return;
    extents.push(getWallCabinetExtent(one.position, one.dragPointNormal, width, height));
  });
  return extents;
}

/** Convert wall snap result to 3D offset { x, y, z } */
export function wallSnapTo3DOffset(snap) {
  if (snap.tangent) {
    return {
      x: snap.tangent.x * snap.dAlong,
      y: snap.dY,
      z: snap.tangent.z * snap.dAlong,
    };
  }
  const dx = snap.alongAxis === "x" ? snap.dAlong : 0;
  const dz = snap.alongAxis === "z" ? snap.dAlong : 0;
  return { x: dx, y: snap.dY, z: dz };
}
