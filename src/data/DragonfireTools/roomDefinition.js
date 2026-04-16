/**
 * Structured room definition (walls + floor) for DragonfireTools.
 * Single source of truth for snap planes and room geometry; mirrors reference procedural room pattern.
 */

import computeQuadPoints from "@/utils/computeQuadPoints";

const WALL_DEFS = [
  { wallId: "front", from: 0, to: 1 },
  { wallId: "right", from: 1, to: 2 },
  { wallId: "back", from: 2, to: 3 },
  { wallId: "left", from: 3, to: 0 },
];

const DEFAULT_WALL_WIDTH = 9.144;
const DEFAULT_WALL_HEIGHT = 3.048;

/**
 * Build room descriptor from current wall dimensions (from store).
 * @param {{ front?: number, right?: number, back?: number, left?: number }} wallWidthMap
 * @param {{ front?: number, right?: number, back?: number, left?: number }} [wallHeightMap]
 * @returns {{ walls: Array<{ wallId: string, plane: { nx, nz, d }, normal: { x, y, z }, width: number, height: number }>, floor: { corners: Array<{x,z}> } }}
 */
export function getRoomDescriptor(wallWidthMap, wallHeightMap = {}) {
  const frontW = wallWidthMap?.front ?? DEFAULT_WALL_WIDTH;
  const rightW = wallWidthMap?.right ?? 7.3152;
  const backW = wallWidthMap?.back ?? DEFAULT_WALL_WIDTH;
  const leftW = wallWidthMap?.left ?? 7.3152;
  const floorPoints = computeQuadPoints(frontW, rightW, backW, leftW);
  const c = floorPoints.map((p) => ({ x: p.x, z: -p.y }));

  const walls = WALL_DEFS.map(({ wallId, from, to }) => {
    const dx = c[to].x - c[from].x;
    const dz = c[to].z - c[from].z;
    const width = Math.sqrt(dx * dx + dz * dz);
    let nx = -dz;
    let nz = dx;
    const len = Math.sqrt(nx * nx + nz * nz);
    nx = len < 1e-10 ? 0 : nx / len;
    nz = len < 1e-10 ? 0 : nz / len;
    let d = -(nx * c[from].x + nz * c[from].z);
    if (d < 0) {
      nx = -nx;
      nz = -nz;
      d = -d;
    }
    const heightKey = wallId === "front" ? "front" : wallId === "back" ? "back" : wallId === "left" ? "left" : "right";
    const height = wallHeightMap?.[heightKey] ?? DEFAULT_WALL_HEIGHT;
    return {
      wallId,
      plane: { nx, nz, d },
      normal: { x: nx, y: 0, z: nz },
      width,
      height,
    };
  });

  const floor = {
    corners: [...c],
  };

  return { walls, floor };
}

/**
 * Get wall planes in the shape used by existing snap (name, nx, nz, d) for drop-in use.
 * @param {{ walls: Array }} descriptor - from getRoomDescriptor
 * @returns {Array<{ name: string, nx: number, nz: number, d: number }>}
 */
export function getWallPlanesFromDescriptor(descriptor) {
  return descriptor.walls.map((w) => ({
    name: w.wallId,
    nx: w.plane.nx,
    nz: w.plane.nz,
    d: w.plane.d,
  }));
}
