import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useRef, useEffect } from "react";

import useAnimationStore from "@/stores/useAnimationStore";

const mannequinVec = new THREE.Vector2();
const cameraVec = new THREE.Vector2();

const Mannequin = () => {
  const mannequinRef = useRef();
  const cameraPositionForMannequin = useAnimationStore(
    (state) => state.cameraPositionForMannequin
  );

  const mannequinTexture = useTexture("/textures/manqut_2x.png");
  mannequinTexture.colorSpace = THREE.SRGBColorSpace;
  mannequinTexture.minFilter = THREE.NearestFilter;
  mannequinTexture.magFilter = THREE.NearestFilter;
  mannequinTexture.generateMipmaps = false;

  const mannequinMaterial = new THREE.MeshBasicMaterial({
    map: mannequinTexture,
    transparent: true,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
    color: "#ccc", //darken cos it's indoors
  });

  //width to height ratio is 7/23
  const widthToHeightRatio = 7 / 23;
  const manHeight = 1.8;
  const manWidth = manHeight * widthToHeightRatio;
  const manSize = { width: manWidth, height: manHeight };

  useEffect(() => {
    if (!cameraPositionForMannequin) return;

    if (cameraPositionForMannequin.x && cameraPositionForMannequin.z) {
      // Set mannequin position in 2D space (x-z plane)
      mannequinVec.set(0, 0);

      // Set camera position in 2D space (x-z plane)
      cameraVec.set(cameraPositionForMannequin.x, cameraPositionForMannequin.z);

      // Calculate direction vector from mannequin to camera
      const directionVec = new THREE.Vector2()
        .subVectors(cameraVec, mannequinVec)
        .normalize();

      // Use atan2 to get the full angle range (-π to π)
      const absoluteAngle = Math.atan2(directionVec.y, directionVec.x);

      // Convert to degrees and ensure it's 0-360 range
      const degrees = ((absoluteAngle * 180) / Math.PI + 360) % 360;

      if (mannequinRef.current) {
        mannequinRef.current.rotation.y =
          -degrees * (Math.PI / 180) + Math.PI / 2;
      }
    }
  }, [cameraPositionForMannequin]);

  return (
    <>
      <group rotation={[0, 0, 0]}>
        <group position={[0, 0.9, 0]}>
          <mesh material={mannequinMaterial} ref={mannequinRef}>
            <planeGeometry args={[manSize.width, manSize.height]} />
          </mesh>
        </group>
      </group>
    </>
  );
};

export default Mannequin;

/****** */

function mmToInches(mm) {
  return mm * 0.0393701;
}
