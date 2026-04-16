/**
 * Debug visualization for corner snap points.
 * Visible only while dragging a corner cabinet; hidden otherwise.
 * Uses a different style from regular snap points (e.g. orange/magenta spheres and snap radius).
 */
import { useMemo } from "react";
import useDragNDropStore from "@/stores/useDragNDropStore";
import useAnimationStore from "@/stores/useAnimationStore";
import { reverseIdMap } from "@/data/DragonfireTools/cabinetItems";
import { getCornerSnapPoints } from "@/data/DragonfireTools/cornerSnapPoints";
import { isCornerCabinet, isLowerCornerCabinet } from "./wallSnapUtils";
import {
  CORNER_SNAP_THRESHOLD_DISTANCE,
  DEBUG_CORNER_SNAP_POINTS_VISIBLE,
  CORNER_DEBUG_SPHERE_RADIUS,
  CORNER_DEBUG_MARKER_HEIGHT,
  CORNER_DEBUG_RING_OFFSET,
  CORNER_DEBUG_SPHERE_SEGMENTS,
  CORNER_DEBUG_RING_SEGMENTS,
  CORNER_DEBUG_COLOR_INACTIVE,
  CORNER_DEBUG_COLOR_ACTIVE,
  CORNER_DEBUG_SPHERE_OPACITY,
  CORNER_DEBUG_RING_OPACITY,
} from "@/data/DragonfireTools/snapConstants";
import { findNearestCornerSnapPoint } from "./cornerSnapUtils";

function CornerMarker({
  position,
  isActive,
  snapRadius,
  sphereRadius,
  markerHeight,
  ringOffset,
  sphereSegments,
  ringSegments,
  colorInactive,
  colorActive,
  sphereOpacity,
  ringOpacity,
}) {
  const color = isActive ? colorActive : colorInactive;
  return (
    <group position={[position.x, position.y + markerHeight, position.z]}>
      <mesh>
        <sphereGeometry args={[sphereRadius, sphereSegments, sphereSegments]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={sphereOpacity}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      {snapRadius > 0 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry
            args={[
              snapRadius - ringOffset,
              snapRadius + ringOffset,
              ringSegments,
            ]}
          />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={ringOpacity}
            side={2}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

export default function CornerSnapPointsDebug() {
  const draggedCabinetIndex = useDragNDropStore(
    (state) => state.draggedCabinetIndex,
  );
  const placedPositions = useDragNDropStore((state) => state.placedPositions);
  const selectedDeckItem = useDragNDropStore((state) => state.selectedDeckItem);
  const wallWidthValues = useAnimationStore((state) => state.wallWidthValues);
  const wallWidthMap = useMemo(
    () => ({
      front: wallWidthValues?.front ?? 9.144,
      right: wallWidthValues?.right ?? 7.3152,
      back: wallWidthValues?.back ?? 9.144,
      left: wallWidthValues?.left ?? 7.3152,
    }),
    [wallWidthValues],
  );

  const cornerSnapPoints = useMemo(
    () => getCornerSnapPoints(wallWidthMap),
    [wallWidthMap],
  );

  const isDraggingCornerCabinet = useMemo(() => {
    if (draggedCabinetIndex != null && placedPositions[draggedCabinetIndex]) {
      const cabinet = placedPositions[draggedCabinetIndex];
      const meta = reverseIdMap[cabinet?.cabinetId];
      if (meta?.itemType === "floor" && isCornerCabinet(meta)) return true;
    }
    if (selectedDeckItem?.itemType === "floor") {
      const meta = reverseIdMap[selectedDeckItem?.id];
      if (meta && isCornerCabinet(meta)) return true;
    }
    return false;
  }, [draggedCabinetIndex, placedPositions, selectedDeckItem]);

  const activeCornerId = useMemo(() => {
    if (!isDraggingCornerCabinet || !cornerSnapPoints.length) return null;
    if (draggedCabinetIndex != null && placedPositions[draggedCabinetIndex]) {
      const cabinet = placedPositions[draggedCabinetIndex];
      const meta = reverseIdMap[cabinet?.cabinetId];
      const snapThreshold = isLowerCornerCabinet(meta)
        ? Number.POSITIVE_INFINITY
        : CORNER_SNAP_THRESHOLD_DISTANCE;
      const dims = meta?.boundingBox ?? { width: 1, depth: 1 };
      const rot =
        cabinet.dragPointNormal != null
          ? Math.atan2(cabinet.dragPointNormal.x, cabinet.dragPointNormal.z)
          : 0;
      const anchor = {
        x: cabinet.position.x - (dims.depth / 2) * Math.sin(rot),
        z: cabinet.position.z - (dims.depth / 2) * Math.cos(rot),
      };
      const nearest = findNearestCornerSnapPoint(
        anchor,
        cornerSnapPoints,
        snapThreshold,
      );
      return nearest?.point?.id ?? null;
    }
    return null;
  }, [
    isDraggingCornerCabinet,
    draggedCabinetIndex,
    placedPositions,
    cornerSnapPoints,
  ]);

  if (!DEBUG_CORNER_SNAP_POINTS_VISIBLE || !isDraggingCornerCabinet)
    return null;
  if (!cornerSnapPoints.length) return null;

  return (
    <group>
      {cornerSnapPoints.map((point) => (
        <CornerMarker
          key={point.id}
          position={point.position}
          isActive={point.id === activeCornerId}
          snapRadius={CORNER_SNAP_THRESHOLD_DISTANCE}
          sphereRadius={CORNER_DEBUG_SPHERE_RADIUS}
          markerHeight={CORNER_DEBUG_MARKER_HEIGHT}
          ringOffset={CORNER_DEBUG_RING_OFFSET}
          sphereSegments={CORNER_DEBUG_SPHERE_SEGMENTS}
          ringSegments={CORNER_DEBUG_RING_SEGMENTS}
          colorInactive={CORNER_DEBUG_COLOR_INACTIVE}
          colorActive={CORNER_DEBUG_COLOR_ACTIVE}
          sphereOpacity={CORNER_DEBUG_SPHERE_OPACITY}
          ringOpacity={CORNER_DEBUG_RING_OPACITY}
        />
      ))}
    </group>
  );
}
