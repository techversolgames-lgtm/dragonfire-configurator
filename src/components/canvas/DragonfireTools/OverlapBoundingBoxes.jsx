import { useMemo } from "react";
import useAnimationStore from "@/stores/useAnimationStore";
import useDragNDropStore from "@/stores/useDragNDropStore";
import {
  getOverlappingPlacedIndices,
  getPlacedItemWorldAABB,
} from "@/data/DragonfireTools/snapSolver";
import { reverseIdMap } from "@/data/DragonfireTools/cabinetItems";

/** Small padding so the red box sits just outside the object. */
const BOX_PADDING = 0.02;
/** Minimum size per axis so thin wall items (e.g. Window) don't render as fragmented lines. */
const MIN_BOX_SIZE = 0.04;

/**
 * Renders red wireframe bounding boxes around every placed item that is overlapping
 * (floor vs floor, wall vs wall, wall vs floor, or penetrating wall).
 */
export default function OverlapBoundingBoxes() {
  const placedPositions = useDragNDropStore((state) => state.placedPositions);
  const wallWidthValues = useAnimationStore((state) => state.wallWidthValues);
  const wallHeightValues = useAnimationStore((state) => state.wallHeightValues);

  const wallWidthMap = useMemo(
    () => ({
      front: wallWidthValues?.front ?? 9.144,
      right: wallWidthValues?.right ?? 7.3152,
      back: wallWidthValues?.back ?? 9.144,
      left: wallWidthValues?.left ?? 7.3152,
    }),
    [wallWidthValues],
  );
  const wallHeightMap = useMemo(
    () => ({
      front: wallHeightValues?.front ?? 3.048,
      right: wallHeightValues?.right ?? 3.048,
      back: wallHeightValues?.back ?? 3.048,
      left: wallHeightValues?.left ?? 3.048,
    }),
    [wallHeightValues],
  );

  const overlappingIndices = useMemo(
    () =>
      getOverlappingPlacedIndices(
        placedPositions,
        reverseIdMap,
        null,
        wallWidthMap,
        wallHeightMap,
      ),
    [placedPositions, wallWidthMap, wallHeightMap],
  );

  const boxes = useMemo(() => {
    const out = [];
    for (const i of overlappingIndices) {
      const placement = placedPositions[i];
      const meta = reverseIdMap[placement?.cabinetId];
      if (!placement || !meta) continue;
      const aabb = getPlacedItemWorldAABB(placement, meta);
      if (!aabb) continue;
      const pad = BOX_PADDING;
      let minX = aabb.minX - pad;
      let maxX = aabb.maxX + pad;
      let minY = aabb.minY - pad;
      let maxY = aabb.maxY + pad;
      let minZ = aabb.minZ - pad;
      let maxZ = aabb.maxZ + pad;
      // Enforce minimum size so thin wall items render as a clear box, not fragmented lines
      const sx = Math.max(maxX - minX, MIN_BOX_SIZE);
      const sy = Math.max(maxY - minY, MIN_BOX_SIZE);
      const sz = Math.max(maxZ - minZ, MIN_BOX_SIZE);
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const cz = (minZ + maxZ) / 2;
      out.push({
        key: i,
        center: [cx, cy, cz],
        size: [sx, sy, sz],
      });
    }
    return out;
  }, [overlappingIndices, placedPositions]);

  if (boxes.length === 0) return null;

  return (
    <group>
      {boxes.map(({ key, center, size }) => (
        <mesh key={key} position={center}>
          <boxGeometry args={size} />
          <meshBasicMaterial
            color="#e03030"
            wireframe
            depthTest={true}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
