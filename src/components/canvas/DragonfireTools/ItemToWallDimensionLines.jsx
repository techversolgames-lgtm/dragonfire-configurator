import { useMemo, useEffect } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import useDragNDropStore from "@/stores/useDragNDropStore";
import useAnimationStore from "@/stores/useAnimationStore";
import { reverseIdMap } from "@/data/DragonfireTools/cabinetItems";
import computeQuadPoints from "@/utils/computeQuadPoints";
import { getFloorItemAABB } from "@/data/DragonfireTools/snapSolver";
import { FLOOR_Y } from "./CabinetModelComponents/CabinetFeet";
import { useSelectedItemBounds } from "./SelectedItemBoundsContext";
import { getOffsetFloorCenter } from "./floorItemSnapUtils";

const DIMENSION_LINE_Y = FLOOR_Y + 0.015;
const LINE_COLOR = "#000000";
const WALL_ITEM_LINE_NUDGE = 0.08; // push dimension line slightly in front of wall
const FLOOR_LINE_END_OFFSET = 0.03; // end "to floor" line above floor so it doesn't penetrate

const ROOM_ITEM_IDS = { TV: 100, DOOR: 101, WINDOW: 102 };

function rangesOverlap(minA, maxA, minB, maxB) {
  return Math.min(maxA, maxB) - Math.max(minA, minB) > 0.0001;
}

/** Corners of floor item footprint in XZ (same OBB as green selection box). */
function getFloorFootprintCornersXZ(cx, cz, width, depth, rotationY) {
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
 * Ray (origin + t*dir, t>=0) vs segment AB in XZ. Returns smallest t>minT, or null.
 * dir should be a unit vector for meaningful distance.
 */
function raySegmentIntersection2D(ox, oz, dirx, dirz, ax, az, bx, bz, minT) {
  const vx = bx - ax;
  const vz = bz - az;
  const wx = ax - ox;
  const wz = az - oz;
  const denom = dirx * vz - dirz * vx;
  if (Math.abs(denom) < 1e-10) return null;
  const t = (wx * vz - wz * vx) / denom;
  const u = (wx * dirz - wz * dirx) / denom;
  if (t < minT) return null;
  if (u < -1e-6 || u > 1 + 1e-6) return null;
  return t;
}

/** First hit distance from (ox,oz) along (dirx,dirz) to room boundary (wall segments). */
function raycastToRoomBoundary(ox, oz, dirx, dirz, wallPlanes, minT = 1e-4) {
  let bestT = Infinity;
  for (let i = 0; i < wallPlanes.length; i++) {
    const w = wallPlanes[i];
    const t = raySegmentIntersection2D(
      ox,
      oz,
      dirx,
      dirz,
      w.start.x,
      w.start.z,
      w.end.x,
      w.end.z,
      minT,
    );
    if (t != null && t < bestT) bestT = t;
  }
  return bestT === Infinity ? null : bestT;
}

/**
 * Local width (right) and depth (front) unit axes in XZ — same as floorItemSnapUtils / green OBB.
 */
function getFloorCabinetLocalAxes(rotationY) {
  const cosR = Math.cos(rotationY);
  const sinR = Math.sin(rotationY);
  const widthX = cosR;
  const widthZ = -sinR;
  const depthX = -sinR;
  const depthZ = -cosR;
  return {
    widthX,
    widthZ,
    depthX,
    depthZ,
  };
}

function boundsFromCorners(corners) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const c of corners) {
    minX = Math.min(minX, c.x);
    maxX = Math.max(maxX, c.x);
    minZ = Math.min(minZ, c.z);
    maxZ = Math.max(maxZ, c.z);
  }
  return { minX, maxX, minZ, maxZ };
}

/** World-axis bounds of a floor item's rotated footprint (for dimensions / occlusion). */
function getFloorItemProjectedXZBounds(placement, itemMeta) {
  if (!itemMeta?.boundingBox) return null;
  const w = placement?.roomItemWidth ?? itemMeta.boundingBox.width ?? 1;
  const d = placement?.roomItemDepth ?? itemMeta.boundingBox.depth ?? 1;
  const rot =
    placement.dragPointNormal && itemMeta.label !== "Upper Corner"
      ? Math.atan2(placement.dragPointNormal.x, placement.dragPointNormal.z)
      : 0;
  const c = getOffsetFloorCenter(placement.position, rot, itemMeta);
  return boundsFromCorners(
    getFloorFootprintCornersXZ(c.x, c.z, w, d, rot),
  );
}

function segmentIntersectsAABB2D(x0, z0, x1, z1, bounds) {
  const dx = x1 - x0;
  const dz = z1 - z0;
  let tMin = 0;
  let tMax = 1;
  const EPS = 0.000001;

  if (Math.abs(dx) < EPS) {
    if (x0 < bounds.minX || x0 > bounds.maxX) return false;
  } else {
    let tx1 = (bounds.minX - x0) / dx;
    let tx2 = (bounds.maxX - x0) / dx;
    if (tx1 > tx2) [tx1, tx2] = [tx2, tx1];
    tMin = Math.max(tMin, tx1);
    tMax = Math.min(tMax, tx2);
    if (tMin > tMax) return false;
  }

  if (Math.abs(dz) < EPS) {
    if (z0 < bounds.minZ || z0 > bounds.maxZ) return false;
  } else {
    let tz1 = (bounds.minZ - z0) / dz;
    let tz2 = (bounds.maxZ - z0) / dz;
    if (tz1 > tz2) [tz1, tz2] = [tz2, tz1];
    tMin = Math.max(tMin, tz1);
    tMax = Math.min(tMax, tz2);
    if (tMin > tMax) return false;
  }

  return true;
}

function useWallPlanes() {
  const wallWidthValues = useAnimationStore((state) => state.wallWidthValues);
  return useMemo(() => {
    const frontW = wallWidthValues?.front || 9.144;
    const rightW = wallWidthValues?.right || 7.3152;
    const backW = wallWidthValues?.back || 9.144;
    const leftW = wallWidthValues?.left || 7.3152;
    const floorPoints = computeQuadPoints(frontW, rightW, backW, leftW);
    const [p1, p2, p3, p4] = floorPoints;
    const c = [
      { x: p1.x, z: -p1.y },
      { x: p2.x, z: -p2.y },
      { x: p3.x, z: -p3.y },
      { x: p4.x, z: -p4.y },
    ];
    const wallDefs = [
      { name: "front", from: 0, to: 1 },
      { name: "right", from: 1, to: 2 },
      { name: "back", from: 2, to: 3 },
      { name: "left", from: 3, to: 0 },
    ];
    return wallDefs.map(({ name, from, to }) => {
      const start = c[from];
      const end = c[to];
      const dx = c[to].x - c[from].x;
      const dz = c[to].z - c[from].z;
      let nx = -dz;
      let nz = dx;
      const len = Math.sqrt(nx * nx + nz * nz);
      nx /= len;
      nz /= len;
      let d = -(nx * c[from].x + nz * c[from].z);
      if (d < 0) {
        nx = -nx;
        nz = -nz;
        d = -d;
      }
      return { name, nx, nz, d, start, end, wallLength: len };
    });
  }, [wallWidthValues]);
}

function useCeilingY() {
  const wallHeightValues = useAnimationStore((state) => state.wallHeightValues);
  return useMemo(() => {
    const f = wallHeightValues?.front ?? 3.048;
    const r = wallHeightValues?.right ?? 3.048;
    const b = wallHeightValues?.back ?? 3.048;
    const l = wallHeightValues?.left ?? 3.048;
    return Math.max(f, r, b, l);
  }, [wallHeightValues]);
}

const baseLabelStyle = {
  fontFamily: "sans-serif",
  whiteSpace: "nowrap",
  pointerEvents: "none",
  userSelect: "none",
  padding: "4px 12px",
  borderRadius: 4,
};

/** dist in meters; unit one of "mm" | "ft" | "in" */
function formatDimension(distM, unit) {
  if (unit === "ft") {
    const ft = distM * 3.28084;
    return `${ft.toFixed(2)} ft`;
  }
  if (unit === "in") {
    const inch = distM * 39.3701;
    return `${inch.toFixed(1)} in`;
  }
  return `${Math.round(distM * 1000)} mm`;
}

/**
 * Renders dimension lines:
 * - Floor item: from each face center (local front/back/left/right) along that face
 *   outward normal to the room boundary (rotates with the cabinet).
 * - Wall room item (TV/Door/Window): from item to floor and to ceiling (vertical).
 */
const ItemToWallDimensionLines = () => {
  const placedPositions = useDragNDropStore((state) => state.placedPositions);
  const selectedPlacedIndex = useDragNDropStore(
    (state) => state.selectedPlacedIndex,
  );
  const { bounds } = useSelectedItemBounds();
  const showDimensionLines = useAnimationStore(
    (state) => state.showDimensionLines,
  );
  const dimensionUnits = useAnimationStore((state) => state.dimensionUnits);
  const dimensionLabelFontSize = useAnimationStore(
    (state) => state.dimensionLabelFontSize ?? 24,
  );
  const dimensionLabelBackgroundColor = useAnimationStore(
    (state) => state.dimensionLabelBackgroundColor ?? "#ffffff",
  );
  const dimensionLabelTextColor = useAnimationStore(
    (state) => state.dimensionLabelTextColor ?? "#000000",
  );
  const wallPlanes = useWallPlanes();
  const ceilingY = useCeilingY();

  const { lines, verticalSegments } = useMemo(() => {
    const out = { lines: [], verticalSegments: [] };
    if (
      selectedPlacedIndex == null ||
      !placedPositions?.length ||
      selectedPlacedIndex >= placedPositions.length
    ) {
      return out;
    }
    const placement = placedPositions[selectedPlacedIndex];
    const meta = reverseIdMap[placement?.cabinetId];
    if (!meta) return out;

    const id = placement.cabinetId;
    const isRoomItem = id === ROOM_ITEM_IDS.TV || id === ROOM_ITEM_IDS.DOOR || id === ROOM_ITEM_IDS.WINDOW;

    const isWallCabinet = meta.itemType === "wall" && !isRoomItem;

    if (meta.itemType === "floor") {
      // OBB footprint (logical W/D + dragPointNormal rotation), same basis as SelectedItemBoundingBox —
      // not the world AABB from bounds.size (that grows when the cabinet rotates).
      const logicalW = placement.roomItemWidth ?? meta.boundingBox?.width ?? 1;
      const logicalD = placement.roomItemDepth ?? meta.boundingBox?.depth ?? 1;
      const floorRot =
        placement.dragPointNormal && meta.label !== "Upper Corner"
          ? Math.atan2(placement.dragPointNormal.x, placement.dragPointNormal.z)
          : 0;
      const floorCenter = getOffsetFloorCenter(placement.position, floorRot, meta);
      const cx = floorCenter.x;
      const cz = floorCenter.z;
      const dimensionLineY = isWallCabinet
        ? (bounds?.center?.y ?? placement.position.y ?? DIMENSION_LINE_Y)
        : DIMENSION_LINE_Y;
      const footprintCorners = getFloorFootprintCornersXZ(
        cx,
        cz,
        logicalW,
        logicalD,
        floorRot,
      );
      const hw = logicalW / 2;
      const hd = logicalD / 2;
      const { widthX, widthZ, depthX, depthZ } =
        getFloorCabinetLocalAxes(floorRot);

      // One line per cabinet face: start at face center, cast along outward normal to room edge.
      const faceRays = [
        {
          key: "face-right",
          ox: cx + widthX * hw,
          oz: cz + widthZ * hw,
          dx: widthX,
          dz: widthZ,
        },
        {
          key: "face-left",
          ox: cx - widthX * hw,
          oz: cz - widthZ * hw,
          dx: -widthX,
          dz: -widthZ,
        },
        {
          key: "face-front",
          ox: cx + depthX * hd,
          oz: cz + depthZ * hd,
          dx: depthX,
          dz: depthZ,
        },
        {
          key: "face-back",
          ox: cx - depthX * hd,
          oz: cz - depthZ * hd,
          dx: -depthX,
          dz: -depthZ,
        },
      ];

      out.lines = faceRays
        .map(({ key, ox, oz, dx, dz }) => {
          const tHit = raycastToRoomBoundary(ox, oz, dx, dz, wallPlanes);
          if (tHit == null) return null;
          return {
            key: `room-${key}`,
            start: [ox, dimensionLineY, oz],
            end: [ox + dx * tHit, dimensionLineY, oz + dz * tHit],
            dist: tHit,
          };
        })
        .filter((segment) => {
          if (!segment) return false;
          const [sx, , sz] = segment.start;
          const [ex, , ez] = segment.end;
          return !placedPositions.some((otherPlacement, otherIndex) => {
            if (otherIndex === selectedPlacedIndex) return false;
            const otherMeta = reverseIdMap[otherPlacement?.cabinetId];
            if (!otherMeta || otherMeta.itemType !== meta.itemType) return false;
            if (
              meta.itemType === "wall" &&
              (otherPlacement?.cabinetId === ROOM_ITEM_IDS.TV ||
                otherPlacement?.cabinetId === ROOM_ITEM_IDS.DOOR ||
                otherPlacement?.cabinetId === ROOM_ITEM_IDS.WINDOW)
            ) {
              return false;
            }
            const otherBounds = getFloorItemProjectedXZBounds(
              otherPlacement,
              otherMeta,
            );
            if (!otherBounds) return false;
            return segmentIntersectsAABB2D(sx, sz, ex, ez, otherBounds);
          });
        });

      // Also show nearest cabinet-to-cabinet clear gaps (left/right/front/back)
      // for floor cabinets so users can dimension both to walls and to neighbors.
      const selectedBounds = boundsFromCorners(footprintCorners);
      const nearest = {
        left: null,
        right: null,
        front: null,
        back: null,
      };

      placedPositions.forEach((otherPlacement, otherIndex) => {
        if (otherIndex === selectedPlacedIndex) return;
        const otherMeta = reverseIdMap[otherPlacement?.cabinetId];
        if (!otherMeta || otherMeta.itemType !== meta.itemType) return;
        if (
          meta.itemType === "wall" &&
          (otherPlacement?.cabinetId === ROOM_ITEM_IDS.TV ||
            otherPlacement?.cabinetId === ROOM_ITEM_IDS.DOOR ||
            otherPlacement?.cabinetId === ROOM_ITEM_IDS.WINDOW)
        ) {
          return;
        }

        const otherBounds = getFloorItemProjectedXZBounds(
          otherPlacement,
          otherMeta,
        );
        if (!otherBounds) return;

        const overlapZ = rangesOverlap(
          selectedBounds.minZ,
          selectedBounds.maxZ,
          otherBounds.minZ,
          otherBounds.maxZ,
        );
        if (overlapZ) {
          if (otherBounds.maxX <= selectedBounds.minX) {
            const gap = selectedBounds.minX - otherBounds.maxX;
            if (gap > 0.001 && (!nearest.left || gap < nearest.left.dist)) {
              const zMid =
                (Math.max(selectedBounds.minZ, otherBounds.minZ) +
                  Math.min(selectedBounds.maxZ, otherBounds.maxZ)) /
                2;
              nearest.left = {
                key: `cab-left-${otherIndex}`,
                start: [selectedBounds.minX, dimensionLineY, zMid],
                end: [otherBounds.maxX, dimensionLineY, zMid],
                dist: gap,
              };
            }
          }
          if (otherBounds.minX >= selectedBounds.maxX) {
            const gap = otherBounds.minX - selectedBounds.maxX;
            if (gap > 0.001 && (!nearest.right || gap < nearest.right.dist)) {
              const zMid =
                (Math.max(selectedBounds.minZ, otherBounds.minZ) +
                  Math.min(selectedBounds.maxZ, otherBounds.maxZ)) /
                2;
              nearest.right = {
                key: `cab-right-${otherIndex}`,
                start: [selectedBounds.maxX, dimensionLineY, zMid],
                end: [otherBounds.minX, dimensionLineY, zMid],
                dist: gap,
              };
            }
          }
        }

        const overlapX = rangesOverlap(
          selectedBounds.minX,
          selectedBounds.maxX,
          otherBounds.minX,
          otherBounds.maxX,
        );
        if (overlapX) {
          if (otherBounds.maxZ <= selectedBounds.minZ) {
            const gap = selectedBounds.minZ - otherBounds.maxZ;
            if (gap > 0.001 && (!nearest.back || gap < nearest.back.dist)) {
              const xMid =
                (Math.max(selectedBounds.minX, otherBounds.minX) +
                  Math.min(selectedBounds.maxX, otherBounds.maxX)) /
                2;
              nearest.back = {
                key: `cab-back-${otherIndex}`,
                start: [xMid, dimensionLineY, selectedBounds.minZ],
                end: [xMid, dimensionLineY, otherBounds.maxZ],
                dist: gap,
              };
            }
          }
          if (otherBounds.minZ >= selectedBounds.maxZ) {
            const gap = otherBounds.minZ - selectedBounds.maxZ;
            if (gap > 0.001 && (!nearest.front || gap < nearest.front.dist)) {
              const xMid =
                (Math.max(selectedBounds.minX, otherBounds.minX) +
                  Math.min(selectedBounds.maxX, otherBounds.maxX)) /
                2;
              nearest.front = {
                key: `cab-front-${otherIndex}`,
                start: [xMid, dimensionLineY, selectedBounds.maxZ],
                end: [xMid, dimensionLineY, otherBounds.minZ],
                dist: gap,
              };
            }
          }
        }
      });

      out.lines.push(
        ...Object.values(nearest).filter(Boolean),
      );
      return out;
    }

    if (isWallCabinet) {
      const centerX = bounds?.center?.x ?? placement.position.x ?? 0;
      const centerY = bounds?.center?.y ?? placement.position.y ?? 0;
      const centerZ = bounds?.center?.z ?? placement.position.z ?? 0;
      const width =
        bounds?.size?.x ?? placement?.roomItemWidth ?? meta?.boundingBox?.width ?? 1;
      const height =
        bounds?.size?.y ?? placement?.roomItemHeight ?? meta?.boundingBox?.height ?? 1;

      const normal = placement.dragPointNormal ?? { x: 0, z: -1 };
      const tLen = Math.hypot(normal.z ?? 0, -(normal.x ?? 0)) || 1;
      const tangent = { x: (normal.z ?? 0) / tLen, z: (-(normal.x ?? 0)) / tLen };
      const projectU = (x, z) => x * tangent.x + z * tangent.z;

      const selectedU = projectU(centerX, centerZ);
      const selectedMinU = selectedU - width / 2;
      const selectedMaxU = selectedU + width / 2;
      const selectedMinY = centerY - height / 2;
      const selectedMaxY = centerY + height / 2;

      let nearestLeft = null;
      let nearestRight = null;

      placedPositions.forEach((otherPlacement, otherIndex) => {
        if (otherIndex === selectedPlacedIndex) return;
        const otherMeta = reverseIdMap[otherPlacement?.cabinetId];
        if (!otherMeta || otherMeta.itemType !== "wall") return;
        if (
          otherPlacement?.cabinetId === ROOM_ITEM_IDS.TV ||
          otherPlacement?.cabinetId === ROOM_ITEM_IDS.DOOR ||
          otherPlacement?.cabinetId === ROOM_ITEM_IDS.WINDOW
        ) {
          return;
        }

        const otherCenterX = otherPlacement?.position?.x ?? 0;
        const otherCenterY = otherPlacement?.position?.y ?? 0;
        const otherCenterZ = otherPlacement?.position?.z ?? 0;
        const otherWidth = otherMeta?.boundingBox?.width ?? 1;
        const otherHeight = otherMeta?.boundingBox?.height ?? 1;
        const otherU = projectU(otherCenterX, otherCenterZ);
        const otherMinU = otherU - otherWidth / 2;
        const otherMaxU = otherU + otherWidth / 2;
        const otherMinY = otherCenterY - otherHeight / 2;
        const otherMaxY = otherCenterY + otherHeight / 2;

        if (
          !rangesOverlap(selectedMinY, selectedMaxY, otherMinY, otherMaxY)
        ) {
          return;
        }

        if (otherMaxU <= selectedMinU) {
          const gap = selectedMinU - otherMaxU;
          if (gap > 0.001 && (!nearestLeft || gap < nearestLeft.dist)) {
            const lineY =
              (Math.max(selectedMinY, otherMinY) +
                Math.min(selectedMaxY, otherMaxY)) /
              2;
            const startX = centerX + tangent.x * (-width / 2);
            const startZ = centerZ + tangent.z * (-width / 2);
            const endX = startX - tangent.x * gap;
            const endZ = startZ - tangent.z * gap;
            nearestLeft = {
              key: `wall-cab-left-${otherIndex}`,
              start: [startX, lineY, startZ],
              end: [endX, lineY, endZ],
              dist: gap,
            };
          }
        }

        if (otherMinU >= selectedMaxU) {
          const gap = otherMinU - selectedMaxU;
          if (gap > 0.001 && (!nearestRight || gap < nearestRight.dist)) {
            const lineY =
              (Math.max(selectedMinY, otherMinY) +
                Math.min(selectedMaxY, otherMaxY)) /
              2;
            const startX = centerX + tangent.x * (width / 2);
            const startZ = centerZ + tangent.z * (width / 2);
            const endX = startX + tangent.x * gap;
            const endZ = startZ + tangent.z * gap;
            nearestRight = {
              key: `wall-cab-right-${otherIndex}`,
              start: [startX, lineY, startZ],
              end: [endX, lineY, endZ],
              dist: gap,
            };
          }
        }
      });

      const planeDist = (wall) => Math.abs(wall.nx * centerX + wall.nz * centerZ + wall.d);
      const activeWall = wallPlanes.reduce((best, wall) => {
        const dist = planeDist(wall);
        if (!best || dist < best.dist) return { wall, dist };
        return best;
      }, null)?.wall;

      const wallSideLines = [];
      if (activeWall?.start && activeWall?.end) {
        const wallDx = activeWall.end.x - activeWall.start.x;
        const wallDz = activeWall.end.z - activeWall.start.z;
        const wallLen = Math.hypot(wallDx, wallDz) || 1;
        const wallTx = wallDx / wallLen;
        const wallTz = wallDz / wallLen;
        const wallPerpX = -wallTz;
        const wallPerpZ = wallTx;
        const wallStart = activeWall.start;

        const getUVRel = (x, z) => {
          const rx = x - wallStart.x;
          const rz = z - wallStart.z;
          return {
            u: rx * wallTx + rz * wallTz,
            v: rx * wallPerpX + rz * wallPerpZ,
          };
        };

        // Find nearest floor item "in the way" and stop the dimension line there.
        // We treat the dimension line as a thin strip at Y=centerY.
        const findNearestFloorObstacleU = ({ side, edgeU, edgePoint, axisTol }) => {
          let best = null;
          const { v: vEdge } = getUVRel(edgePoint.x, edgePoint.z);

          for (let otherIndex = 0; otherIndex < placedPositions.length; otherIndex++) {
            if (otherIndex === selectedPlacedIndex) continue;
            const otherPlacement = placedPositions[otherIndex];
            const otherMeta = reverseIdMap[otherPlacement?.cabinetId];
            if (!otherMeta || otherMeta.itemType !== "floor") continue;

            const otherW =
              otherPlacement?.roomItemWidth ??
              otherMeta?.boundingBox?.width ??
              1;
            const otherD =
              otherPlacement?.roomItemDepth ??
              otherMeta?.boundingBox?.depth ??
              1;
            const otherH =
              otherPlacement?.roomItemHeight ??
              otherMeta?.boundingBox?.height ??
              1;
            const otherBaseY = otherPlacement?.position?.y ?? FLOOR_Y;
            const otherTopY = otherBaseY + otherH;

            // Only consider obstacles tall enough to visually intersect the line.
            if (centerY < otherBaseY - 0.001 || centerY > otherTopY + 0.001) continue;

            const otherRot = otherPlacement?.dragPointNormal != null
              ? Math.atan2(
                  otherPlacement.dragPointNormal.x,
                  otherPlacement.dragPointNormal.z
                )
              : 0;

            const ox = otherPlacement?.position?.x ?? 0;
            const oz = otherPlacement?.position?.z ?? 0;
            const aabb = getFloorItemAABB(ox, oz, otherW, otherD, otherRot);
            const corners = [
              { x: aabb.minX, z: aabb.minZ },
              { x: aabb.minX, z: aabb.maxZ },
              { x: aabb.maxX, z: aabb.minZ },
              { x: aabb.maxX, z: aabb.maxZ },
            ];

            let uMin = Infinity,
              uMax = -Infinity,
              vMin = Infinity,
              vMax = -Infinity;
            for (const p of corners) {
              const { u, v } = getUVRel(p.x, p.z);
              uMin = Math.min(uMin, u);
              uMax = Math.max(uMax, u);
              vMin = Math.min(vMin, v);
              vMax = Math.max(vMax, v);
            }

            // Strip overlap test (line should intersect obstacle footprint).
            if (!(vMin <= vEdge + axisTol && vMax >= vEdge - axisTol)) continue;

            // Candidate must be between the cabinet edge and the wall boundary direction.
            // side = "left" means dimension goes toward decreasing U (toward wallStart).
            // side = "right" means dimension goes toward increasing U (toward wall end).
            let candidateU = null;
            if (side === "left") {
              if (uMax < 0.0001 || uMin > edgeU) continue;
              // If the obstacle overlaps the cabinet edge, treat distance as 0.
              if (uMin <= edgeU && uMax >= edgeU) candidateU = edgeU;
              else candidateU = uMax <= edgeU ? uMax : null;
              if (candidateU == null) continue;
              // Nearest to cabinet => maximum candidateU
              if (!best || candidateU > best.u) best = { u: candidateU };
            } else {
              if (uMin > wallLen + 0.0001 || uMax < edgeU) continue;
              // If the obstacle overlaps the cabinet edge, treat distance as 0.
              if (uMin <= edgeU && uMax >= edgeU) candidateU = edgeU;
              else candidateU = uMin >= edgeU ? uMin : null;
              if (candidateU == null) continue;
              // Nearest to cabinet => minimum candidateU
              if (!best || candidateU < best.u) best = { u: candidateU };
            }
          }
          return best?.u ?? null;
        };

        const centerAlong =
          (centerX - activeWall.start.x) * wallTx +
          (centerZ - activeWall.start.z) * wallTz;
        const leftEdgeAlong = centerAlong - width / 2;
        const rightEdgeAlong = centerAlong + width / 2;
        const leftGap = leftEdgeAlong;
        const rightGap = wallLen - rightEdgeAlong;

        if (leftGap > 0.001) {
          const startX = activeWall.start.x + wallTx * leftEdgeAlong;
          const startZ = activeWall.start.z + wallTz * leftEdgeAlong;
          const axisTol = 0.01; // XZ strip thickness (meters)
          const obstacleNearU = findNearestFloorObstacleU({
            side: "left",
            edgeU: leftEdgeAlong,
            edgePoint: { x: startX, z: startZ },
            axisTol,
          });
          const endU = obstacleNearU != null ? obstacleNearU : 0;
          const endX = wallStart.x + wallTx * endU;
          const endZ = wallStart.z + wallTz * endU;
          const dist = leftEdgeAlong - endU;
          wallSideLines.push({
            key: "wall-side-left",
            start: [startX, centerY, startZ],
            end: [endX, centerY, endZ],
            dist,
          });
        }
        if (rightGap > 0.001) {
          const startX = activeWall.start.x + wallTx * rightEdgeAlong;
          const startZ = activeWall.start.z + wallTz * rightEdgeAlong;
          const axisTol = 0.01; // XZ strip thickness (meters)
          const obstacleNearU = findNearestFloorObstacleU({
            side: "right",
            edgeU: rightEdgeAlong,
            edgePoint: { x: startX, z: startZ },
            axisTol,
          });
          const endU = obstacleNearU != null ? obstacleNearU : wallLen;
          const endX = wallStart.x + wallTx * endU;
          const endZ = wallStart.z + wallTz * endU;
          const dist = endU - rightEdgeAlong;
          wallSideLines.push({
            key: "wall-side-right",
            start: [startX, centerY, startZ],
            end: [endX, centerY, endZ],
            dist,
          });
        }
      }

      const cabinetGapLines = [nearestLeft, nearestRight].filter(Boolean);
      out.lines = [...wallSideLines, ...cabinetGapLines];

      // If a floor cabinet exists directly under this wall cabinet,
      // end the vertical dimension at that floor cabinet's top.
      let nearestFloorTopY = FLOOR_Y;
      placedPositions.forEach((otherPlacement, otherIndex) => {
        if (otherIndex === selectedPlacedIndex) return;
        const otherMeta = reverseIdMap[otherPlacement?.cabinetId];
        if (!otherMeta || otherMeta.itemType !== "floor") return;

        const otherW =
          otherPlacement?.roomItemWidth ??
          otherMeta?.boundingBox?.width ??
          1;
        const otherD =
          otherPlacement?.roomItemDepth ??
          otherMeta?.boundingBox?.depth ??
          1;
        const otherH =
          otherPlacement?.roomItemHeight ??
          otherMeta?.boundingBox?.height ??
          1;

        const ox = otherPlacement?.position?.x ?? 0;
        const oz = otherPlacement?.position?.z ?? 0;

        const inXZ =
          centerX >= ox - otherW / 2 &&
          centerX <= ox + otherW / 2 &&
          centerZ >= oz - otherD / 2 &&
          centerZ <= oz + otherD / 2;
        if (!inXZ) return;

        const baseY = otherPlacement?.position?.y ?? FLOOR_Y;
        const topY = baseY + otherH;

        // Only consider floor cabinets that are below this wall cabinet bottom.
        if (topY <= selectedMinY && topY > nearestFloorTopY) {
          nearestFloorTopY = topY;
        }
      });

      const toFloorDist = selectedMinY - nearestFloorTopY;
      const toCeilingDist = ceilingY - selectedMaxY;
      if (toFloorDist > 0.001) {
        out.verticalSegments.push({
          key: "wallCabToFloor",
          start: [centerX, selectedMinY, centerZ],
          end: [centerX, nearestFloorTopY + FLOOR_LINE_END_OFFSET, centerZ],
          dist: toFloorDist,
        });
      }
      if (toCeilingDist > 0.001) {
        out.verticalSegments.push({
          key: "wallCabToCeiling",
          start: [centerX, selectedMaxY, centerZ],
          end: [centerX, ceilingY, centerZ],
          dist: toCeilingDist,
        });
      }

      return out;
    }

    if (meta.itemType === "wall" && isRoomItem) {
      const effW = placement.roomItemWidth ?? meta.boundingBox?.width ?? 1;
      const effH = placement.roomItemHeight ?? meta.boundingBox?.height ?? 1;

      // Avoid using `bounds.center` here because bounds can become stale during reposition drag.
      // For Door: `roomItemY` is centerY.
      // For TV/Window: `roomItemY` (and placement.position.y) are bottomY.
      const centerY =
        id === ROOM_ITEM_IDS.DOOR
          ? placement.roomItemY ?? placement.position.y ?? effH / 2
          : placement.roomItemY != null
            ? placement.roomItemY + effH / 2
            : placement.position.y != null
              ? placement.position.y + effH / 2
              : effH / 2;

      const bottomY = centerY - effH / 2;
      const topY = centerY + effH / 2;

      let x = placement.position.x;
      let z = placement.position.z;
      const normal = placement.dragPointNormal;
      if (normal && (normal.x !== 0 || normal.z !== 0)) {
        x += WALL_ITEM_LINE_NUDGE * (normal.x ?? 0);
        z += WALL_ITEM_LINE_NUDGE * (normal.z ?? 0);
      }

      const toFloorDist = bottomY - FLOOR_Y;
      const toCeilingDist = ceilingY - topY;
      out.verticalSegments = [];
      if (toFloorDist > 0.001) {
        const floorEndY = FLOOR_Y + FLOOR_LINE_END_OFFSET;
        out.verticalSegments.push({
          key: "toFloor",
          start: [x, bottomY, z],
          end: [x, floorEndY, z],
          dist: toFloorDist,
        });
      }
      if (toCeilingDist > 0.001) {
        out.verticalSegments.push({
          key: "toCeiling",
          start: [x, topY, z],
          end: [x, ceilingY, z],
          dist: toCeilingDist,
        });
      }
    }
    return out;
  }, [placedPositions, selectedPlacedIndex, wallPlanes, ceilingY, bounds]);

  const labelStyle = useMemo(
    () => ({
      ...baseLabelStyle,
      color: dimensionLabelTextColor,
      fontSize: Number.isFinite(dimensionLabelFontSize)
        ? `${dimensionLabelFontSize}px`
        : "24px",
      background: dimensionLabelBackgroundColor,
    }),
    [
      dimensionLabelBackgroundColor,
      dimensionLabelFontSize,
      dimensionLabelTextColor,
    ],
  );

  const allSegments = useMemo(
    () => [...lines, ...verticalSegments],
    [lines, verticalSegments],
  );

  const lineObject = useMemo(() => {
    if (allSegments.length === 0) return null;
    const positions = new Float32Array(allSegments.length * 2 * 3);
    allSegments.forEach(({ start, end }, i) => {
      positions[i * 6 + 0] = start[0];
      positions[i * 6 + 1] = start[1];
      positions[i * 6 + 2] = start[2];
      positions[i * 6 + 3] = end[0];
      positions[i * 6 + 4] = end[1];
      positions[i * 6 + 5] = end[2];
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({ color: LINE_COLOR });
    const lineSegments = new THREE.LineSegments(geometry, material);
    // Keep dimension lines fully visual: never participate in pointer/raycast hits.
    lineSegments.raycast = () => null;
    return lineSegments;
  }, [allSegments]);

  useEffect(() => {
    return () => {
      if (lineObject) {
        lineObject.geometry?.dispose();
        lineObject.material?.dispose();
      }
    };
  }, [lineObject]);

  if (showDimensionLines === false || !lineObject) return null;

  return (
    <group>
      <primitive object={lineObject} />
      {allSegments.map(({ key, start, end, dist }) => {
        const mx = (start[0] + end[0]) / 2;
        const my = (start[1] + end[1]) / 2;
        const mz = (start[2] + end[2]) / 2;
        const label = formatDimension(dist, dimensionUnits ?? "in");
        return (
          <Html
            key={key}
            position={[mx, my, mz]}
            center
            style={{ pointerEvents: "none" }}
          >
            <span style={labelStyle}>{label}</span>
          </Html>
        );
      })}
    </group>
  );
};

export default ItemToWallDimensionLines;
