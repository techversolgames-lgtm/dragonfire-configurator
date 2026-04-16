/**
 * Optional debug: visualize AABBs for all placed items (green = wall, blue = floor)
 * and optionally log min/max/size to console. Set ENABLE_DEBUG_BOUNDS to true to use.
 * Helps diagnose false overlap (e.g. wall item Y treated as center vs bottom).
 */
import { useMemo, useEffect } from "react";
import useDragNDropStore from "@/stores/useDragNDropStore";
import { getPlacedItemWorldAABB } from "@/data/DragonfireTools/snapSolver";
import { reverseIdMap } from "@/data/DragonfireTools/cabinetItems";

const ENABLE_DEBUG_BOUNDS = false; // Toggle to show green/blue wireframes for all items
const LOG_BOUNDS = false; // Toggle to log AABB min/max/size to console (when ENABLE_DEBUG_BOUNDS)

function WireframeBox({ center, size, color }) {
  return (
    <mesh position={center}>
      <boxGeometry args={size} />
      <meshBasicMaterial color={color} wireframe depthTest={true} depthWrite={false} />
    </mesh>
  );
}

export default function OverlapDebugBounds() {
  const placedPositions = useDragNDropStore((state) => state.placedPositions);

  const boxes = useMemo(() => {
    if (!ENABLE_DEBUG_BOUNDS) return [];
    const out = [];
    placedPositions.forEach((placement, i) => {
      const meta = reverseIdMap[placement?.cabinetId];
      if (!placement || !meta?.boundingBox) return;
      const aabb = getPlacedItemWorldAABB(placement, meta);
      if (!aabb) return;
      const sx = aabb.maxX - aabb.minX;
      const sy = aabb.maxY - aabb.minY;
      const sz = aabb.maxZ - aabb.minZ;
      const center = [
        (aabb.minX + aabb.maxX) / 2,
        (aabb.minY + aabb.maxY) / 2,
        (aabb.minZ + aabb.maxZ) / 2,
      ];
      out.push({
        key: i,
        center,
        size: [sx, sy, sz],
        isWall: meta.itemType === "wall",
        label: meta.label ?? placement.cabinetId,
      });
    });
    return out;
  }, [placedPositions]);

  useEffect(() => {
    if (!LOG_BOUNDS || boxes.length === 0) return;
    boxes.forEach(({ key, center, size, isWall, label }) => {
      const [cx, cy, cz] = center;
      const [sx, sy, sz] = size;
      console.log(`[Bounds] ${label} (${isWall ? "wall" : "floor"}) idx=${key}`, {
        center: { x: cx.toFixed(3), y: cy.toFixed(3), z: cz.toFixed(3) },
        size: { x: sx.toFixed(3), y: sy.toFixed(3), z: sz.toFixed(3) },
        minY: (cy - sy / 2).toFixed(3),
        maxY: (cy + sy / 2).toFixed(3),
      });
    });
  }, [boxes]);

  if (!ENABLE_DEBUG_BOUNDS || boxes.length === 0) return null;

  return (
    <group>
      {boxes.map(({ key, center, size, isWall }) => (
        <WireframeBox
          key={key}
          center={center}
          size={size}
          color={isWall ? "#22cc44" : "#4488ff"}
        />
      ))}
    </group>
  );
}
