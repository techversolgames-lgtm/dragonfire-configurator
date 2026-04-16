import { useGLTF, useTexture } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { LOCKER_BODY_GLOSS_BLACK_HEX } from "@/data/DragonfireTools/lockerColors";

/**
 * Edit these values to change the look of each material.
 * - Steel stays stainless/silver
 * - Black and Riser match the outer body gloss black
 */
const METAL_TEX_BASE = "/textures/DragonFireTextuees/MetalTexture";

const LEG_MATERIAL_LOOKS = {
  steel: {
    color: "#c0c5d0",
    metalness: 1,
    roughness: 0.15,
    envMapIntensity: 0.7,
  },
  black: {
    color: LOCKER_BODY_GLOSS_BLACK_HEX,
    metalness: 0,
    roughness: 1,
    envMapIntensity: 0,
  },
  riser: {
    color: LOCKER_BODY_GLOSS_BLACK_HEX,
    metalness: 0.35,
    roughness: 1,
    envMapIntensity: 0,
  },
};

const getMaterialKey = (materialName, meshName) => {
  const m = (materialName || "").trim().toLowerCase();
  const n = (meshName || "").trim().toLowerCase();
  if (m === "steel" || n.includes("steel")) return "steel";
  if (m === "black" || n.includes("black")) return "black";
  if (m === "riser" || n.includes("riser")) return "riser";
  return "steel";
};

const LegsFeet = ({ position, rotation, isGhost = false }) => {
  const legsModel = useGLTF(
    "/models/dragonfire-tools/level_feet_only_old.glb",
  );
  const [normalMap, metalnessMap, glossinessMap] = useTexture([
    `${METAL_TEX_BASE}/metal_normal_opengl.jpg`,
    `${METAL_TEX_BASE}/metal_metallic.jpg`,
    `${METAL_TEX_BASE}/metal_glossiness.jpg`,
  ]);

  const setupTex = (tex) => {
    if (!tex) return;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    if (tex.colorSpace !== undefined) tex.colorSpace = THREE.NoColorSpace;
  };
  setupTex(normalMap);
  setupTex(metalnessMap);
  setupTex(glossinessMap);
  if (normalMap) normalMap.flipY = false;

  const sceneClone = useMemo(() => {
    const clone = legsModel.scene.clone();
    clone.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      const cloned = materials.map((mat, index) => {
        if (!mat?.isMeshStandardMaterial) return mat;
        const m = mat.clone();
        const materialKey =
          /foot/i.test(child.name || "") && materials.length > 1 && index === 1
            ? "black"
            : getMaterialKey(m.name, child.name);
        const look = LEG_MATERIAL_LOOKS[materialKey] ?? LEG_MATERIAL_LOOKS.steel;
        m.color.set(look.color);
        m.metalness = look.metalness;
        m.roughness = look.roughness;
        m.envMapIntensity = look.envMapIntensity;
        // Apply same metal textures as locker to black/riser parts (and optionally steel)
        if (materialKey === "black" || materialKey === "riser") {
          if (normalMap) {
            m.normalMap = normalMap;
            m.normalScale = new THREE.Vector2(1, 1);
          }
          if (metalnessMap) m.metalnessMap = metalnessMap;
          if (glossinessMap) m.roughnessMap = glossinessMap;
        }
        return m;
      });
      child.material = cloned.length === 1 ? cloned[0] : cloned;
      if (isGhost) {
        const mats = Array.isArray(child.material)
          ? child.material
          : [child.material];
        mats.forEach((m) => {
          if (m) {
            m.transparent = true;
            m.opacity = 0.5;
            m.depthTest = false;
            m.depthWrite = false;
          }
        });
      }
    });
    return clone;
  }, [legsModel.scene, normalMap, metalnessMap, glossinessMap, isGhost]);

  return (
    <primitive object={sceneClone} position={position} rotation={rotation} />
  );
};

export default LegsFeet;
