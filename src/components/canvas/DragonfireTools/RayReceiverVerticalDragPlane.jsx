//package imports
import * as THREE from "three";
import { useEffect } from "react";

//local imports
import useDragNDropStore from "@/stores/useDragNDropStore";

//convenience variables
const planePosition = new THREE.Vector3();
const cameraDirectionDefault = new THREE.Vector3(0, 0, 10);
const planeOffset = 3;
const planeSize = 1000;

const RayReceiverVerticalDragPlane = () => {
  //#region active states
  const cameraPosition = useDragNDropStore((state) => state.cameraPosition) || {
    x: 0,
    y: 0,
    z: 0,
  };

  const cameraDirection =
    useDragNDropStore((state) => state.cameraDirection) ||
    cameraDirectionDefault;
  const cameraRotation = useDragNDropStore((state) => state.cameraRotation) || {
    x: 0,
    y: 0,
    z: -1,
  };
  const selectedDeckItem = useDragNDropStore((state) => state.selectedDeckItem);
  let isPointerDown = false;

  //! not used but needed to bust state freeze, to get latest values
  const cameraTicker = useDragNDropStore((state) => state.cameraTicker);

  //#endregion

  useEffect(() => {
    // console.log("selectedDeckItem", selectedDeckItem);
    if (selectedDeckItem) {
      //write floor position
      // console.log("selectedDeckItem", selectedDeckItem);
      isPointerDown = true;
    }
  }, [selectedDeckItem]);

  const handlePointerMove = (e) => {
    if (selectedDeckItem) {
      const { point } = e;
      // console.log("dragging raycaster", e);
      useDragNDropStore.setState({
        airDragPoint: point,
      });
    }
  };

  const handlePointerUp = () => {
    if (selectedDeckItem) {
      useDragNDropStore.setState({
        airDragPoint: { x: 10000000000, y: 10000000000, z: 10000000000 },
      });
      isPointerDown = false;
    }
  };

  //use camera position and direction to calculate plane position and rotation
  planePosition.copy(cameraPosition);
  planePosition.add(cameraDirection.clone().multiplyScalar(planeOffset));

  const { x: rx, y: ry, z: rz } = cameraRotation;
  const { x, y, z } = planePosition;
  return (
    <>
      <group
        position={[x, y, z]}
        rotation={[rx, ry, rz]}
        onPointerMove={(e) => handlePointerMove(e)}
        onPointerUp={(e) => handlePointerUp(e)}
      >
        <mesh position={[0, planeSize / 4, 0]}>
          <planeGeometry args={[planeSize, planeSize]} />
          <meshStandardMaterial
            color="red"
            transparent
            opacity={0.0005}
            depthTest={false}
          />
        </mesh>
      </group>
    </>
  );
};

export default RayReceiverVerticalDragPlane;
