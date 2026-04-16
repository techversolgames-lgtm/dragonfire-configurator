import { useGLTF, useTexture } from "@react-three/drei";
import { useMemo } from "react";
import {
  applyFeetMaterialOverrides,
  setupMetalTexture,
  METAL_TEX_BASE,
} from "./feetMaterialUtils";

const LevelingFeetLowProfile = ({ position, rotation }) => {
  const levelingFeetModel = useGLTF(
    "/models/dragonfire-tools/level_feet_lowprofile.glb",
  );

  const [normalMap, metalnessMap, glossinessMap] = useTexture([
    `${METAL_TEX_BASE}/metal_normal_opengl.jpg`,
    `${METAL_TEX_BASE}/metal_metallic.jpg`,
    `${METAL_TEX_BASE}/metal_glossiness.jpg`,
  ]);

  setupMetalTexture(normalMap);
  setupMetalTexture(metalnessMap);
  setupMetalTexture(glossinessMap);
  if (normalMap) normalMap.flipY = false;

  const sceneClone = useMemo(() => {
    const clone = levelingFeetModel.scene.clone();
    applyFeetMaterialOverrides({
      scene: clone,
      normalMap,
      metalnessMap,
      glossinessMap,
    });
    return clone;
  }, [levelingFeetModel.scene, normalMap, metalnessMap, glossinessMap]);

  return (
    <>
      <primitive object={sceneClone} position={position} rotation={rotation} />
    </>
  );
};

export default LevelingFeetLowProfile;
