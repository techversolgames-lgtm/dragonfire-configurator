import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import useDragNDropStore from "@/stores/useDragNDropStore";
import * as THREE from "three";

const DragMovementManager = () => {
  const isCanvasPointerDown = useDragNDropStore(
    (state) => state.isCanvasPointerDown,
  );
  const isCanvasPointerUp = useDragNDropStore(
    (state) => state.isCanvasPointerUp,
  );
  const isCanvasPointerMoving = useDragNDropStore(
    (state) => state.isCanvasPointerMoving,
  );
  const pointerMoveTimestamp = useDragNDropStore(
    (state) => state.pointerMoveTimestamp,
  );

  const selectedDeckItem = useDragNDropStore((state) => state.selectedDeckItem);

  const activeSceneItem = useDragNDropStore((state) => state.activeSceneItem);
  //log active scene item
  // console.log("active scene item", activeSceneItem);

  const itemIgnoreList = useDragNDropStore((state) => state.itemIgnoreList);
  const setIsOrbitControlsEnabled = useDragNDropStore(
    (state) => state.setIsOrbitControlsEnabled,
  );
  const setIsFloatingToolsVisible = useDragNDropStore(
    (state) => state.setIsFloatingToolsVisible,
  );
  const { gl, camera, scene } = useThree();

  const isDragging = useRef(false);
  const dragPlane = useRef(new THREE.Plane());
  const raycaster = useRef(new THREE.Raycaster());
  const intersection = useRef(new THREE.Vector3());
  const offset = useRef(new THREE.Vector3());
  const worldPosition = useRef(new THREE.Vector3());
  const parentMatrixWorldInverse = useRef(new THREE.Matrix4());

  useEffect(() => {
    // Use capture phase to intercept events before OrbitControls
    gl.domElement.addEventListener("pointerdown", handlePointerDown, true);
    gl.domElement.addEventListener("pointermove", handlePointerMove, true);
    gl.domElement.addEventListener("pointerup", handlePointerUp, true);

    return () => {
      gl.domElement.removeEventListener("pointerdown", handlePointerDown, true);
      gl.domElement.removeEventListener("pointermove", handlePointerMove, true);
      gl.domElement.removeEventListener("pointerup", handlePointerUp, true);
    };
  }, [activeSceneItem, itemIgnoreList, gl, scene, camera]);

  function handlePointerDown(event) {
    if (!activeSceneItem) return;

    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;

    raycaster.current.setFromCamera(mouse, camera);
    const intersects = raycaster.current.intersectObject(scene, true);

    // Filter out gizmos and ignored items (same as ObjectSelectionSystem)
    const filteredIntersects = intersects.filter((intersect) => {
      let obj = intersect.object;
      while (obj) {
        if (itemIgnoreList.includes(obj) || obj.name === "gizmo") {
          return false;
        }
        obj = obj.parent;
      }
      return true;
    });

    if (filteredIntersects.length > 0) {
      const firstIntersect = filteredIntersects[0];

      // Find the root group of the intersected object
      // Stop traversing if we hit the Scene OR a floor/wall surface
      let rootGroup = firstIntersect.object;
      while (
        rootGroup.parent &&
        rootGroup.parent.type !== "Scene" &&
        rootGroup.parent.uuid !== "floor" &&
        rootGroup.parent.uuid !== "wall"
      ) {
        rootGroup = rootGroup.parent;
      }

      console.log("Intersected root group:", rootGroup);
      console.log("Active scene item:", activeSceneItem);
      console.log("Is same object?", rootGroup === activeSceneItem);

      // Only start dragging if the clicked object's root group is the activeSceneItem
      if (rootGroup !== activeSceneItem) return;

      // Prevent OrbitControls from processing this event
      event.stopPropagation();
      event.preventDefault();

      isDragging.current = true;
      setIsOrbitControlsEnabled(false);
      gl.domElement.style.cursor = "move";

      // Get the object's world position
      activeSceneItem.getWorldPosition(worldPosition.current);

      // Store the parent's inverse world matrix for converting world coords to local
      if (activeSceneItem.parent && activeSceneItem.parent.type !== "Scene") {
        parentMatrixWorldInverse.current
          .copy(activeSceneItem.parent.matrixWorld)
          .invert();
      } else {
        parentMatrixWorldInverse.current.identity();
      }

      // Determine the drag plane normal based on parent surface
      let normal;
      const parentUuid = activeSceneItem.parent
        ? activeSceneItem.parent.uuid
        : null;

      if (parentUuid === "wall") {
        // For wall items, get the wall's world normal (local Z transformed to world)
        const wallNormal = new THREE.Vector3(0, 0, 1);
        const wallQuaternion = new THREE.Quaternion();
        activeSceneItem.parent.getWorldQuaternion(wallQuaternion);
        wallNormal.applyQuaternion(wallQuaternion);
        normal = wallNormal;
      } else {
        // For floor items or scene children, use Y-up plane
        normal = new THREE.Vector3(0, 1, 0);
      }

      dragPlane.current.setFromNormalAndCoplanarPoint(
        normal,
        worldPosition.current,
      );

      // Calculate offset between mouse intersection and object position
      raycaster.current.ray.intersectPlane(
        dragPlane.current,
        intersection.current,
      );
      offset.current.copy(intersection.current).sub(worldPosition.current);
    }
  }

  function handlePointerMove(event) {
    if (!isDragging.current || !activeSceneItem) return;

    // Hide floating tools while dragging
    setIsFloatingToolsVisible(false);

    // Prevent OrbitControls from processing this event while dragging
    event.stopPropagation();
    event.preventDefault();

    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;

    raycaster.current.setFromCamera(mouse, camera);

    // Intersect with the drag plane
    if (
      raycaster.current.ray.intersectPlane(
        dragPlane.current,
        intersection.current,
      )
    ) {
      // Calculate world position (subtract offset to maintain the grab point)
      const newWorldPos = intersection.current.sub(offset.current);

      // Convert world position to local position relative to parent
      const localPos = newWorldPos
        .clone()
        .applyMatrix4(parentMatrixWorldInverse.current);

      activeSceneItem.position.copy(localPos);
    }
  }

  function handlePointerUp(event) {
    if (isDragging.current) {
      // Prevent OrbitControls from processing this event
      event.stopPropagation();
      event.preventDefault();

      isDragging.current = false;
      setIsOrbitControlsEnabled(true);
      gl.domElement.style.cursor = "default";
    }
  }

  return null;
};

export default DragMovementManager;
