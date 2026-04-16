import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";

const SmallLegs = ({ position, rotation }) => {
  const smallLegsModel = useGLTF(
    "/models/dragonfire-tools/small_legs.glb",
  );

  const chromeLegsScene = useMemo(() => {
    const clone = smallLegsModel.scene.clone();
    clone.traverse((child) => {
      if (child.isMesh && child.material) {
        const mat = new THREE.MeshStandardMaterial({
          color: "#d0d4de",
          metalness: 1,
          roughness: 0.08,
          envMapIntensity: 0.8,
        });
        child.material = mat;
      }
    });
    return clone;
  }, [smallLegsModel.scene]);

  return (
    <>
      <primitive object={chromeLegsScene} position={position} rotation={rotation} />
    </>
  );
};

export default SmallLegs;
