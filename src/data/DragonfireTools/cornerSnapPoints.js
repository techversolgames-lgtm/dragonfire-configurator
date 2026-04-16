/**
 * Corner snap points for DragonfireTools.
 * One snap point per room corner; used only when dragging a corner cabinet.
 */

import { getRoomDescriptor } from "./roomDefinition";
import {
  CORNER_ROTATION_DEGREES,
  CORNER_SNAP_POSITION_OFFSETS,
  CORNER_SNAP_POSITION_OFFSETS_LOWER,
  CORNER_SNAP_POSITION_OFFSETS_UPPER,
  CORNER_SNAP_ROTATION_OFFSETS_DEG,
  CORNER_SNAP_ROTATION_OFFSETS_DEG_LOWER,
  CORNER_SNAP_ROTATION_OFFSETS_DEG_UPPER,
  CORNER_WALL_INSET_OFFSETS,
} from "./snapConstants";

/** Corner index to two wall ids (in order around the corner). */
const CORNER_TO_WALLS = [
  ["left", "front"],   // corner 0: front-left
  ["front", "right"],  // corner 1: front-right
  ["right", "back"],   // corner 2: back-right
  ["back", "left"],    // corner 3: back-left
];

/**
 * Get all valid room corner snap points.
 * @param {{ front?: number, right?: number, back?: number, left?: number }} wallWidthMap
 * @returns {Array<{ id: string, position: { x: number, y: number, z: number }, cornerDirection: { x: number, z: number }, rotationY: number, wallIds: [string, string] }>}
 */
export function getCornerSnapPoints(wallWidthMap, cabinetType = "lower") {
  const descriptor = getRoomDescriptor(wallWidthMap);
  const { walls, floor } = descriptor;
  const corners = floor?.corners ?? [];
  if (!walls?.length || corners.length < 4) return [];

  const selectedPosOffsets =
    cabinetType === "upper"
      ? CORNER_SNAP_POSITION_OFFSETS_UPPER
      : (CORNER_SNAP_POSITION_OFFSETS_LOWER ?? CORNER_SNAP_POSITION_OFFSETS);
  const selectedRotOffsets =
    cabinetType === "upper"
      ? CORNER_SNAP_ROTATION_OFFSETS_DEG_UPPER
      : (CORNER_SNAP_ROTATION_OFFSETS_DEG_LOWER ??
        CORNER_SNAP_ROTATION_OFFSETS_DEG);

  const wallById = {};
  walls.forEach((w) => {
    wallById[w.wallId] = w;
  });

  return corners.map((corner, index) => {
    const wallIds = CORNER_TO_WALLS[index];
    const wallA = wallIds[0] ? wallById[wallIds[0]] : null;
    const wallB = wallIds[1] ? wallById[wallIds[1]] : null;

    const n1 = wallIds[0] ? wallById[wallIds[0]]?.normal : null;
    const n2 = wallIds[1] ? wallById[wallIds[1]]?.normal : null;
    let dx = 0;
    let dz = 0;
    if (n1) {
      dx += n1.x;
      dz += n1.z;
    }
    if (n2) {
      dx += n2.x;
      dz += n2.z;
    }
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 1e-10) {
      dx = 1;
      dz = 0;
    } else {
      dx /= len;
      dz /= len;
    }
    let rotationY = Math.atan2(dx, dz);
    const overrideDeg = CORNER_ROTATION_DEGREES?.[index];
    if (typeof overrideDeg === "number") {
      rotationY = (overrideDeg * Math.PI) / 180;
    }

    // Apply per-wall inset offsets by intersecting the two wall planes
    // shifted inward by the requested inset distances.
    // Equation per wall plane: nx*x + nz*z + d = inset (inset = 0 => original wall plane).
    let posX = corner.x;
    let posZ = corner.z;
    if (wallA?.plane && wallB?.plane) {
      const { nx: nx1, nz: nz1, d: d1 } = wallA.plane;
      const { nx: nx2, nz: nz2, d: d2 } = wallB.plane;
      const inset1 = CORNER_WALL_INSET_OFFSETS?.[wallIds[0]] ?? 0;
      const inset2 = CORNER_WALL_INSET_OFFSETS?.[wallIds[1]] ?? 0;

      const det = nx1 * nz2 - nz1 * nx2;
      if (Math.abs(det) > 1e-10) {
        const rhs1 = inset1 - d1;
        const rhs2 = inset2 - d2;
        posX = (rhs1 * nz2 - nz1 * rhs2) / det;
        posZ = (nx1 * rhs2 - rhs1 * nx2) / det;
      }
    }

    const posOffset = selectedPosOffsets?.[index] ?? {
      x: 0,
      y: 0,
      z: 0,
    };
    posX += posOffset.x ?? 0;
    posZ += posOffset.z ?? 0;

    const rotOffset = selectedRotOffsets?.[index] ?? {
      x: 0,
      y: 0,
      z: 0,
    };
    // Only Y rotation is applied to `rotationY` for floor cabinets today.
    rotationY += ((rotOffset.y ?? 0) * Math.PI) / 180;

    const id = `corner-${wallIds.join("-")}`;
    return {
      id,
      position: {
        x: posX,
        y: posOffset.y ?? 0,
        z: posZ,
      },
      cornerDirection: { x: dx, z: dz },
      rotationY,
      wallIds,
    };
  });
}
