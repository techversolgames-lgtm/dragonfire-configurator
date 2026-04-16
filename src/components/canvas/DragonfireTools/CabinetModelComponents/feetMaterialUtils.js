import * as THREE from "three";
import { LOCKER_BODY_GLOSS_BLACK_HEX } from "@/data/DragonfireTools/lockerColors";

/**
 * Shared material-color + metal-texture override for leveling-feet models.
 * Matches the look logic in `LegsFeet.jsx` so riser/black parts render consistently.
 */

export const METAL_TEX_BASE = "/textures/DragonFireTextuees/MetalTexture";

export const LEG_MATERIAL_LOOKS = {
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

export function setupMetalTexture(tex) {
  if (!tex) return;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  if (tex.colorSpace !== undefined) tex.colorSpace = THREE.NoColorSpace;
}

function getFeetMaterialKey({
  materialName,
  meshName,
  materialsLength,
  materialIndex,
}) {
  const m = (materialName || "").trim().toLowerCase();
  const n = (meshName || "").trim().toLowerCase();

  // If this is a multi-material feet mesh, enforce the rule:
  // first slot (index 0) = black; remaining slots = steel.
  // This avoids name-based detection accidentally marking both slots the same.
  const looksFooty =
    /foot/i.test(n) || /foot/i.test(m) || /riser/i.test(n) || /riser/i.test(m);
  if (materialsLength > 1 && looksFooty) {
    return materialIndex === 0 ? "black" : "steel";
  }

  // Prefer explicit naming if the GLB has meaningful material/mesh names.
  if (m === "steel" || m.includes("steel") || n.includes("steel")) return "steel";
  if (m === "riser" || m.includes("riser") || n.includes("riser")) return "riser";
  if (m === "black" || m.includes("black") || n.includes("black")) return "black";

  return "steel";
}

export function applyFeetMaterialOverrides({
  scene,
  normalMap,
  metalnessMap,
  glossinessMap,
}) {
  scene.traverse((child) => {
    if (!child.isMesh || !child.material) return;

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    const cloned = materials.map((mat, index) => {
      if (!mat) return mat;

      // Always clone to avoid multiple slots referencing the same material instance.
      const m = mat.clone();
      const materialKey = getFeetMaterialKey({
        materialName: mat.name,
        meshName: child.name,
        materialsLength: materials.length,
        materialIndex: index,
      });

      const look = LEG_MATERIAL_LOOKS[materialKey] ?? LEG_MATERIAL_LOOKS.steel;

      // Some GLBs may use non-StandardMaterial; set only properties that exist.
      if (m.color?.set) m.color.set(look.color);
      if (m.isMeshStandardMaterial) {
        m.metalness = look.metalness;
        m.roughness = look.roughness;
        m.envMapIntensity = look.envMapIntensity;
      }

      // Apply the same metal textures as the locker/legs for black/riser parts.
      if (
        (materialKey === "black" || materialKey === "riser") &&
        m.isMeshStandardMaterial
      ) {
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
  });
}

