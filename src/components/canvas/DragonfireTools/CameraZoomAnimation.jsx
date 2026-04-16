import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useRef } from "react";
import { getPlacedItemWorldAABB } from "@/data/DragonfireTools/snapSolver";
import useDragNDropStore from "@/stores/useDragNDropStore";

const ZOOM_EVENT_NAME = "dragonfire-tools-zoom-to-item";

/**
 * Listens for `dragonfire-tools-zoom-to-item` events and animates the active
 * `CameraControls` instance toward the provided item's world-space center.
 *
 * The DragonfireTools sidebar dispatches the event with:
 *  - placement: current placedPositions entry
 *  - meta: reverseIdMap[placement.cabinetId]
 */
export default function CameraZoomAnimation({ controlsRef }) {
  const { invalidate } = useThree();

  const isOrbitControlsEnabled = useDragNDropStore(
    (state) => state.isOrbitControlsEnabled,
  );
  const setIsOrbitControlsEnabled = useDragNDropStore(
    (state) => state.setIsOrbitControlsEnabled,
  );

  const pendingZoomRef = useRef(null);

  const applyZoom = () => {
    const controls = controlsRef?.current;
    if (!controls) return;

    const pending = pendingZoomRef.current;
    if (!pending) return;

    const { placement, meta } = pending;
    if (!placement || !meta) return;

    // AABB gives us stable world-space min/max around the item.
    const aabb = getPlacedItemWorldAABB(placement, meta);
    if (!aabb) return;

    const center = new THREE.Vector3(
      (aabb.minX + aabb.maxX) / 2,
      (aabb.minY + aabb.maxY) / 2,
      (aabb.minZ + aabb.maxZ) / 2,
    );

    const size = new THREE.Vector3(
      aabb.maxX - aabb.minX,
      aabb.maxY - aabb.minY,
      aabb.maxZ - aabb.minZ,
    );
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = Math.max(1, maxDim ); // camera distance multiplier

    // Cabinet "front" is represented by placement.dragPointNormal (XZ direction).
    const n = placement.dragPointNormal ?? { x: 0, y: 0, z: 1 };
    const frontDir = new THREE.Vector3(n.x, 0, n.z);
    if (frontDir.lengthSq() < 1e-9) frontDir.set(0, 0, 1);
    frontDir.normalize();

    // ~30 degrees from horizontal: slight top-down angle.
    const angleFromHorizontal = Math.PI / 6;
    const horizontalDistance = distance * Math.cos(angleFromHorizontal);
    const verticalDistance = distance * Math.sin(angleFromHorizontal);

    const eye = center
      .clone()
      .add(frontDir.multiplyScalar(horizontalDistance))
      .add(new THREE.Vector3(0, verticalDistance, 0));

    // Ensure transitions are allowed while animating.
    const prevEnabled = isOrbitControlsEnabled;
    if (!prevEnabled && setIsOrbitControlsEnabled) {
      setIsOrbitControlsEnabled(true);
    }

    controls.transitionTime = 1.2;
    controls.setLookAt(
      eye.x,
      eye.y,
      eye.z, // camera position
      center.x,
      center.y,
      center.z, // target position
      true,
    );
    invalidate();

    pendingZoomRef.current = null;

    // Restore enabled state shortly after transition starts.
    if (!prevEnabled && setIsOrbitControlsEnabled) {
      window.setTimeout(() => {
        setIsOrbitControlsEnabled(false);
      }, 1400);
    }
  };

  useEffect(() => {
    const onZoomEvent = (e) => {
      pendingZoomRef.current = e.detail ?? null;
      applyZoom();
    };

    window.addEventListener(ZOOM_EVENT_NAME, onZoomEvent);
    return () => {
      window.removeEventListener(ZOOM_EVENT_NAME, onZoomEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlsRef]);

  // If the sidebar dispatches before controls are ready, retry shortly after mount.
  useEffect(() => {
    const t = window.setTimeout(() => applyZoom(), 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

