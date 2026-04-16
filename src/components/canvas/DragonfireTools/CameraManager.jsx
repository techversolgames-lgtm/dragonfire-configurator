//package imports
import { useRef } from "react";
import { CameraControls } from "@react-three/drei";
import * as THREE from "three";

//local imports
import useDragNDropStore from "@/stores/useDragNDropStore";

//convenience variables
const position = new THREE.Vector3();
const direction = new THREE.Vector3();

const CameraManager = ({ controlsRef }) => {
  const isEnabled = useDragNDropStore((state) => state.isOrbitControlsEnabled);
  //**potential optimization: only write on mouse up. could have edge case bugs though */
  const handleCameraChange = () => {
    controlsRef.current?.getPosition(position, false);
    controlsRef.current?.camera?.getWorldDirection(direction);

    useDragNDropStore.setState({
      cameraPosition: position,
      cameraDirection: direction,
      cameraRotation: controlsRef.current?.camera?.rotation,
      cameraTicker: Date.now(), //busts state freeze to for re-render on receivers
    });
  };

  return (
    <>
      <CameraControls
        ref={controlsRef}
        target={[0, 1.25, 0]}
        makeDefault
        minDistance={2}
        maxDistance={15}
        onChange={handleCameraChange}
        enabled={isEnabled}
      />
    </>
  );
};

export default CameraManager;
