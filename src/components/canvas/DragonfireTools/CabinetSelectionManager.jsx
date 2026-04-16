import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import useDragNDropStore from "@/store/useDragNDropStore";
import { useEffect, useRef, useState } from "react";

const CabinetSelectionManager = () => {
  const { camera, gl, scene } = useThree();
  const {
    itemIgnoreList,
    setItemIgnoreList,
    setActiveSceneItem,
    rotationRequest,
    clearRotationRequest,
    setRaycastData,
  } = useDragNDropStore();
  const activeObject = useRef(null);
  const [selectedObject, setSelectedObject] = useState(null);
  const pointerDownPos = useRef({ x: 0, y: 0 });
  const pointerDownTime = useRef(0);
  const activeSceneItem = useDragNDropStore((state) => state.activeSceneItem);

  const tempActiveCursorMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0, 1, 4),
    new THREE.MeshStandardMaterial({ color: "red" }),
  );
  tempActiveCursorMesh.name = "gizmo";

  const rayCaster = new THREE.Raycaster();

  useEffect(() => {
    // setItemIgnoreList([...itemIgnoreList, tempActiveCursorMesh]);
    gl.domElement.addEventListener("pointerdown", handlePointerDown);
    gl.domElement.addEventListener("pointerup", handlePointerUp);
    // window.addEventListener("keydown", handleSetObjectRotation);

    return () => {
      gl.domElement.removeEventListener("pointerdown", handlePointerDown);
      gl.domElement.removeEventListener("pointerup", handlePointerUp);
      // window.removeEventListener("keydown", handleSetObjectRotation);
    };
  }, [gl, scene]);

  // Listen for rotation requests from buttons
  useEffect(() => {
    if (rotationRequest && activeObject.current) {
      // console.log("Rotation request received:", rotationRequest.angle);
      // rotateObject(activeObject.current, rotationRequest.angle);
      clearRotationRequest();
    }
  }, [rotationRequest]);

  //   return selectedObject && activeSceneItem ? (
  //     <primitive
  //       object={tempActiveCursorMesh}
  //       position={setCursorMeshPosition(selectedObject)}
  //       scale={0.07}
  //     />
  //   ) : null;

  //   function setCursorMeshPosition(object) {
  //     const bbox = new THREE.Box3().setFromObject(object);
  //     const center = new THREE.Vector3();
  //     bbox.getCenter(center);
  //     const size = new THREE.Vector3();
  //     bbox.getSize(size);

  //     const cursorPosition = new THREE.Vector3(
  //       center.x,
  //       bbox.max.y + 0.05,
  //       center.z,
  //     );
  //     return cursorPosition;
  //   }

  function handlePointerDown(e) {
    // Record pointer position and time when mouse is pressed
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    pointerDownTime.current = Date.now();
  }

  function handlePointerUp(e) {
    // Calculate distance moved and time elapsed
    const dx = e.clientX - pointerDownPos.current.x;
    const dy = e.clientY - pointerDownPos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const timeElapsed = Date.now() - pointerDownTime.current;

    // Only treat as click if pointer didn't move much and was quick
    // Distance threshold: 5 pixels, Time threshold: 300ms
    if (distance < 5 && timeElapsed < 300) {
      //log the active scene item
      console.log("CLick detector");
      // const { hitResult } = setUpRaycaster(e);
      // activeObject.current = hitResult;
      // setSelectedObject(hitResult);
      // setActiveSceneItem(hitResult);
      // console.log("Hit result:", hitResult);
    } else {
      // console.log("Drag detected, ignoring selection");
    }
  }

  //   function setUpRaycaster(event) {
  //     let hitResult;
  //     const mouse = new THREE.Vector2();
  //     mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
  //     mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;

  //     rayCaster.setFromCamera(mouse, camera);
  //     const intersects = rayCaster.intersectObject(scene, true);
  //     setRaycastData(intersects);

  //     const filteredIntersects = intersects.filter((intersect) => {
  //       let obj = intersect.object;
  //       while (obj) {
  //         if (itemIgnoreList.includes(obj) || obj.name === "gizmo") {
  //           return false;
  //         }
  //         obj = obj.parent;
  //       }
  //       return true;
  //     });

  //     if (filteredIntersects.length > 0) {
  //       const intersectedMesh = filteredIntersects[0].object;

  //       // Check the immediate parent chain for itemType
  //       let currentObj = intersectedMesh;
  //       let foundPlacedItem = null;

  //       while (currentObj && currentObj.parent) {
  //         if (currentObj.userData && currentObj.userData.itemType) {
  //           foundPlacedItem = currentObj;
  //           break;
  //         }
  //         if (currentObj.parent.type === "Scene") {
  //           break; // Stop at scene level
  //         }
  //         currentObj = currentObj.parent;
  //       }

  //       if (foundPlacedItem) {
  //         // Select the placed item
  //         console.log(
  //           "Hit placed object:",
  //           foundPlacedItem.name || foundPlacedItem.type,
  //         );
  //         console.log("Item type:", foundPlacedItem.userData.itemType);
  //         hitResult = foundPlacedItem;
  //       } else {
  //         // Select the surface (traverse to root as before)
  //         let rootGroup = intersectedMesh;
  //         while (rootGroup.parent && rootGroup.parent.type !== "Scene") {
  //           rootGroup = rootGroup.parent;
  //         }
  //         console.log("Hit surface:", rootGroup.name || rootGroup.type);
  //         hitResult = rootGroup;
  //       }

  //       return { hitResult };
  //     } else {
  //       return { hitResult: null };
  //     }
  //   }
  //   function rotateObject(activeObject, angleInterval = Math.PI / 2) {
  //     // Simply rotate around the object's local Y axis
  //     // This works regardless of the surface orientation
  //     activeObject.rotateY(angleInterval);

  //     console.log("Rotated by:", angleInterval, "radians around local Y axis");
  //   }
};

export default CabinetSelectionManager;
