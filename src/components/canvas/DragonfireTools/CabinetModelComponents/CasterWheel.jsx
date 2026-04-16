import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";

const wheelBlackMaterial = new THREE.MeshStandardMaterial({
  color: "#000000",
  metalness: 0,
  roughness: 1,
  envMapIntensity: 0,
});

const CasterWheel = ({ position, rotation }) => {
  const casterWheelModel = useGLTF(
    "/models/dragonfire-tools/caster_wheel_w_rigids_2.glb",
  );

  const blackWheelScene = useMemo(() => {
    const clone = casterWheelModel.scene.clone();
    clone.traverse((child) => {
      if (child.isMesh) {
        child.material = wheelBlackMaterial;
      }
    });
    return clone;
  }, [casterWheelModel.scene]);

  return (
    <primitive
      object={blackWheelScene}
      position={position}
      rotation={rotation}
    />
  );
};

export default CasterWheel;
