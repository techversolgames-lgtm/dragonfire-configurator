import { useState, useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import useDragNDropStore from "@/stores/useDragNDropStore";
import { isRotationGizmoDraggingRef } from "./rotationGizmoState";
import { useSelectedItemBounds } from "./SelectedItemBoundsContext";

const _box3 = new THREE.Box3();
const _center = new THREE.Vector3();
const _size = new THREE.Vector3();

const RotationGizmo = () => {
  const groupRef = useRef();
  const arcMeshRef = useRef();
  const activeSceneItem = useDragNDropStore((state) => state.activeSceneItem);
  const { setBounds } = useSelectedItemBounds();
  const setIsOrbitControlsEnabled = useDragNDropStore(
    (state) => state.setIsOrbitControlsEnabled,
  );
  const isDragging = useRef(false);
  const previousAngle = useRef(0);
  const startRotation = useRef(0); // Starting rotation when drag begins
  const accumulatedRotation = useRef(0); // Track total rotation for snapping
  const activeSceneItemRef = useRef(activeSceneItem);
  const radiusRef = useRef(1);
  const gizmoYOffset = useRef(0); // Cached height offset above object
  const handlersRef = useRef({ move: null, up: null });
  const rotationDeltaRef = useRef(0);
  const startPointerAngleRef = useRef(0);
  const totalAppliedRotation = useRef(0); // Track total world-Y rotation applied
  const startRotYRef = useRef(0); // For floor cabinets: world Y angle at drag start (so we drive store, no identity)
  const snapAngle = 5;
  const torusThickness = 0.003 * 4;
  // Use selectors to prevent re-renders when unrelated Three.js state changes
  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);

  // Convert snap angle from degrees to radians
  const snapRadians = snapAngle > 0 ? (snapAngle * Math.PI) / 180 : 0;

  useEffect(() => {
    activeSceneItemRef.current = activeSceneItem;
    if (!activeSceneItem) {
      setBounds(null);
      return;
    }
    _box3.setFromObject(activeSceneItem);
    _box3.getCenter(_center);
    _box3.getSize(_size);
    const horizontalSize = Math.max(_size.x, _size.z);
    radiusRef.current = horizontalSize / 2;
    gizmoYOffset.current = _size.y / 2;
    setBounds({
      center: { x: _center.x, y: _center.y, z: _center.z },
      size: { x: _size.x, y: _size.y, z: _size.z },
    });
  }, [activeSceneItem, setBounds]);

  // Sync gizmo position (and shared bounds) from world AABB every frame so pivot matches mesh
  useFrame(() => {
    const item = activeSceneItemRef.current;
    if (!item || !groupRef.current) return;
    _box3.setFromObject(item);
    _box3.getCenter(_center);
    _box3.getSize(_size);
    setBounds({
      center: { x: _center.x, y: _center.y, z: _center.z },
      size: { x: _size.x, y: _size.y, z: _size.z },
    });
    const horizontalSize = Math.max(_size.x, _size.z);
    radiusRef.current = horizontalSize / 2;
    groupRef.current.position.set(
      _center.x,
      _center.y + _size.y / 2 + 0.03,
      _center.z,
    );

    const torusMesh = groupRef.current?.children?.[0];
    if (torusMesh?.isMesh && torusMesh.geometry) {
      const r = radiusRef.current;
      const currentR = torusMesh.geometry.parameters?.radius ?? 0;
      if (Math.abs(currentR - r) > 1e-5) {
        torusMesh.geometry.dispose();
        torusMesh.geometry = new THREE.TorusGeometry(r, torusThickness, 16, 100);
      }
    }

    // Update arc geometry imperatively
    const arcMesh = arcMeshRef.current;
    if (!arcMesh) return;

    const delta = rotationDeltaRef.current;
    const absDelta = Math.abs(delta);

    if (!isDragging.current || absDelta <= 0.01) {
      arcMesh.visible = false;
      return;
    }

    arcMesh.visible = true;
    const arcRadius = radiusRef.current * 0.9;
    const startAngle = startPointerAngleRef.current;
    // Wrap around when exceeding a full circle
    const clampedDelta = absDelta % (Math.PI * 2);
    const thetaStart = delta >= 0 ? startAngle - delta : startAngle;

    // Dispose old geometry and create new one
    if (arcMesh.geometry) arcMesh.geometry.dispose();
    arcMesh.geometry = new THREE.CircleGeometry(
      arcRadius,
      32,
      thetaStart,
      clampedDelta,
    );
  });

  function handlePointerDown(event) {
    event.stopPropagation();
    event.nativeEvent?.stopImmediatePropagation();
    isDragging.current = true;

    // Compute initial world-space angle from the 3D intersection point
    const gizmoPos = groupRef.current.position;
    let initialWorldAngle = 0;
    if (event.point) {
      const dx = event.point.x - gizmoPos.x;
      const dz = event.point.z - gizmoPos.z;
      initialWorldAngle = Math.atan2(dz, dx);
    }
    previousAngle.current = initialWorldAngle;
    startPointerAngleRef.current = initialWorldAngle;

    // Store the initial quaternion so we can apply world-Y rotation relative to it
    const item = activeSceneItemRef.current;
    if (item) {
      startRotation.current = 0;
      totalAppliedRotation.current = 0;
      accumulatedRotation.current = 0;
    }
    rotationDeltaRef.current = 0;

    // Remove any lingering listeners from a previous drag
    const canvas = gl.domElement;
    if (handlersRef.current.move) {
      canvas.removeEventListener("pointermove", handlersRef.current.move);
      canvas.removeEventListener("pointerup", handlersRef.current.up);
    }

    // For floor cabinets: capture starting world Y and drive rotation in real time (store only on release)
    const rotationGroup = item?.children?.[0];
    if (rotationGroup) {
      isRotationGizmoDraggingRef.current = true;
      const worldQuat = new THREE.Quaternion();
      rotationGroup.getWorldQuaternion(worldQuat);
      const euler = new THREE.Euler().setFromQuaternion(worldQuat);
      startRotYRef.current = euler.y;
    }

    // Capture the item's quaternion at drag start for incremental world-Y rotation (used when we mutate position group)
    const startQuat = new THREE.Quaternion();
    if (item) startQuat.copy(item.quaternion);
    const worldYAxis = new THREE.Vector3(0, 1, 0);
    const parentWorldQuat = new THREE.Quaternion();
    const parentWorldQuatInv = new THREE.Quaternion();
    if (item && item.parent && item.parent.type !== "Scene") {
      item.parent.getWorldQuaternion(parentWorldQuat);
      parentWorldQuatInv.copy(parentWorldQuat).invert();
    }

    // Horizontal plane at gizmo height for world-space raycasting during drag
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -gizmoPos.y);
    const dragRaycaster = new THREE.Raycaster();
    const ndcVec = new THREE.Vector2();
    const hitPoint = new THREE.Vector3();

    function onMove(event) {
      const item = activeSceneItemRef.current;
      if (!isDragging.current || !item) return;

      // Raycast pointer onto the horizontal plane at gizmo height
      const rect = canvas.getBoundingClientRect();
      ndcVec.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      dragRaycaster.setFromCamera(ndcVec, camera);
      if (!dragRaycaster.ray.intersectPlane(dragPlane, hitPoint)) return;

      const currentGizmoPos = groupRef.current.position;
      const dx = hitPoint.x - currentGizmoPos.x;
      const dz = hitPoint.z - currentGizmoPos.z;
      const currentAngle = Math.atan2(dz, dx);

      let delta = currentAngle - previousAngle.current;

      // Handle angle wrapping (when crossing from -PI to PI)
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;

      // Accumulate total rotation
      totalAppliedRotation.current -= delta;

      let rotationToApply = totalAppliedRotation.current;
      if (snapRadians > 0) {
        rotationToApply = snapToAngle(rotationToApply);
      }

      const rotGroup = item.children?.[0];
      if (rotGroup) {
        // Floor cabinet: real-time rotation only (no store updates during drag; store on release)
        const currentRotY = startRotYRef.current + rotationToApply;
        rotGroup.rotation.y = currentRotY;
      } else {
        // Wall or other: apply rotation to position group as before
        const worldRotQuat = new THREE.Quaternion().setFromAxisAngle(
          worldYAxis,
          rotationToApply,
        );
        if (item.parent && item.parent.type !== "Scene") {
          const localRotQuat = parentWorldQuatInv
            .clone()
            .multiply(worldRotQuat)
            .multiply(parentWorldQuat);
          item.quaternion.copy(localRotQuat.multiply(startQuat));
        } else {
          item.quaternion.copy(worldRotQuat.multiply(startQuat.clone()));
        }
      }

      rotationDeltaRef.current = rotationToApply;
      previousAngle.current = currentAngle;
    }

    function onUp() {
      if (!isDragging.current) return;
      isDragging.current = false;
      isRotationGizmoDraggingRef.current = false;
      rotationDeltaRef.current = 0;
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      handlersRef.current = { move: null, up: null };
      setIsOrbitControlsEnabled(true);

      const item = activeSceneItemRef.current;
      const { placedPositions, selectedPlacedIndex } =
        useDragNDropStore.getState();
      const placedIndex =
        item?.userData?.placedIndex ?? selectedPlacedIndex;
      if (
        item &&
        placedIndex != null &&
        placedPositions[placedIndex]
      ) {
        const worldQuat = new THREE.Quaternion();
        // Use the rotation group's world quat (first child) so we save the exact combined rotation
        // the user sees (position group + inner rotation group). That way release = same as preview.
        const rotationGroup = item.children && item.children[0];
        if (rotationGroup) {
          rotationGroup.getWorldQuaternion(worldQuat);
        } else {
          item.getWorldQuaternion(worldQuat);
        }
        const euler = new THREE.Euler().setFromQuaternion(worldQuat);
        const rotY = euler.y;
        const dragPointNormal = {
          x: Math.sin(rotY),
          y: 0,
          z: Math.cos(rotY),
        };
        const next = [...placedPositions];
        next[placedIndex] = {
          ...next[placedIndex],
          dragPointNormal,
        };
        useDragNDropStore.setState({ placedPositions: next });
        // Floor cabinet: we never rotated the position group (we drove the store in onMove), so no identity().
        // Wall cabinet: position group was rotated; zero it so rotation lives only in inner group.
        if (!rotationGroup) {
          item.quaternion.identity();
        }
      }
    }

    handlersRef.current = { move: onMove, up: onUp };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    setIsOrbitControlsEnabled(false);
  }

  const cabinetId = activeSceneItem?.userData?.cabinetId;
  const isDoor = cabinetId === 101;
  const isTvOrWindow = cabinetId === 100 || cabinetId === 102;
  return (
    activeSceneItem && !isDoor && !isTvOrWindow && (
      <group ref={groupRef} name="rotation-gizmo">
        <mesh
          rotation={[Math.PI / 2, 0, 0]}
          onPointerDown={handlePointerDown}
          onPointerEnter={(e) => changeOpacityAndCursorStyle(e, 0.9, "pointer")}
          onPointerLeave={(e) => changeOpacityAndCursorStyle(e, 0.5, "default")}
        >
          <torusGeometry args={[radiusRef.current || 1, torusThickness, 16, 100]} />
          <meshBasicMaterial color="#007bff" transparent opacity={0.5} />
        </mesh>
        {/* Arc mesh managed imperatively via useFrame */}
        <mesh ref={arcMeshRef} rotation={[Math.PI / 2, 0, 0]} visible={false}>
          <circleGeometry args={[0.1, 32, 0, 0.01]} />
          <meshBasicMaterial
            color="#4ade80"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    )
  );

  //Helper Functions

  // Snap angle to nearest increment
  function snapToAngle(angle) {
    if (snapRadians <= 0) return angle;
    return Math.round(angle / snapRadians) * snapRadians;
  }
  //Change torus opacity on hover
  function changeOpacityAndCursorStyle(e, opacity, cursorStyle) {
    e.object.material.opacity = opacity;
    document.body.style.cursor = cursorStyle;
  }
};
export default RotationGizmo;
