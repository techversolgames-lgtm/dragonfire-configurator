import { useGLTF, useTexture } from "@react-three/drei";
import { useRef, useMemo, useEffect, useState } from "react";
import * as THREE from "three";
import useDragNDropStore from "@/stores/useDragNDropStore";
import {
  getLockerColorHex,
  getLockerBodyColorHex,
} from "@/data/DragonfireTools/lockerColors";
import CabinetFeet, { getFloorOffsetY } from "../CabinetFeet";
import { applyStainlessLogoMaterialToCabinetRoot } from "../cabinetLogoWhiteMaterial";

const METAL_TEX_BASE = "/textures/DragonFireTextuees/MetalTexture";

/** Glossiness (white = glossy) → roughness (white = rough). */
function useRoughnessFromGlossiness(glossinessTexture) {
  const [roughnessTex, setRoughnessTex] = useState(null);
  useEffect(() => {
    if (!glossinessTexture?.image) return;
    const img = glossinessTexture.image;
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < id.data.length; i += 4) {
      const g = id.data[i];
      id.data[i] = 255 - g;
      id.data[i + 1] = 255 - g;
      id.data[i + 2] = 255 - g;
    }
    ctx.putImageData(id, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.copy(glossinessTexture.repeat);
    tex.offset.copy(glossinessTexture.offset);
    tex.colorSpace = THREE.NoColorSpace;
    setRoughnessTex(tex);
    return () => tex.dispose();
  }, [glossinessTexture]);
  return roughnessTex;
}

const isBuiltInFeet = (name) =>
  /feet|foot|legs?|riser/i.test((name || "").trim());
/** Drawer/door name pattern (e.g. r_cabinet_door 1, r_door 1, l_door 1, mesh393_mesh.001 under r_door). */
const drawerDoorNamePattern = /r_door|l_door|drawer|cabinet_door|_door\b|door\b/i;
const isDrawerMesh = (name) => drawerDoorNamePattern.test((name || "").trim());
/** True if this node or any ancestor is named like a door/drawer so child meshes get the selected colour. */
const isUnderDrawerOrDoorNode = (node) => {
  let n = node;
  while (n) {
    if (drawerDoorNamePattern.test((n.name || "").trim())) return true;
    n = n.parent;
  }
  return false;
};
/** Hardware (handles, locks, etc.) stay stainless/metal. */
const isHardwareMesh = (name) =>
  /handle|lock|latch|pull|knob/i.test((name || "").trim());

const ElevenDrawersTemplate = ({ isGhost = false, placement }) => {
  const cabinetRef = useRef();
  const setSelectedObject = useDragNDropStore(
    (state) => state.setSelectedObject,
  );
  const setActiveSceneItem = useDragNDropStore(
    (state) => state.setActiveSceneItem,
  );
  const boundingBox = {
    width: 1.1,
    height: 1.96,
    depth: .6,
  };
  /** 11 Drawer (10) uses Legs by default. */
  const baseOption = placement?.baseOption ?? "legs";
  const floorOffsetY = placement
    ? getFloorOffsetY(baseOption)
    : isGhost
      ? getFloorOffsetY(baseOption)
      : 0;
  const feetPlacement = placement
    ? { ...placement, baseOption }
    : isGhost
      ? { cabinetId: 10, baseOption }
      : null;

  /** Drawer colour: Gunmetal Gray or Gloss Black (user choice). Body/frame always Gloss Black. */
  const drawerColorHex = getLockerColorHex(placement?.lockerColor);
  const bodyColorHex = getLockerBodyColorHex(placement?.lockerColor);

  const [normalMap, metalnessMap, glossinessMap, specularMap] = useTexture([
    `${METAL_TEX_BASE}/metal_normal_opengl.jpg`,
    `${METAL_TEX_BASE}/metal_metallic.jpg`,
    `${METAL_TEX_BASE}/metal_glossiness.jpg`,
    `${METAL_TEX_BASE}/metal_specular.jpg`,
  ]);
  const roughnessMap = useRoughnessFromGlossiness(glossinessMap);

  const setupTex = (tex, repeat = 2) => {
    if (!tex) return;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat, repeat);
    if (tex.colorSpace !== undefined) tex.colorSpace = THREE.NoColorSpace;
  };
  setupTex(normalMap);
  setupTex(metalnessMap);
  setupTex(glossinessMap);
  setupTex(specularMap);
  if (normalMap) normalMap.flipY = false;

  // Same center convention as 22D/Locker: group origin = footprint center. 11D.glb has origin at a corner, so offset model.
  const modelCenterOffset = [
    -boundingBox.width / 2,
    0,
    -boundingBox.depth / 2,
  ];

  const gltf = useGLTF("/models/dragonfire-tools/11D.glb");

  // One-time log: how many materials and meshes are in 11D.glb (for reference)
  useEffect(() => {
    if (!gltf?.scene) return;
    const materialIds = new Set();
    const meshNames = [];
    gltf.scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => materialIds.add(m.uuid));
        meshNames.push(child.name || "(unnamed)");
      }
    });
    console.log(
      "[11D.glb] materials:",
      materialIds.size,
      "meshes:",
      meshNames.length,
      "mesh names:",
      meshNames,
    );
  }, [gltf.scene]);

  const sceneClone = useMemo(() => {
    const clone = gltf.scene.clone();
    clone.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        child.material.transparent = isGhost;
        child.material.opacity = isGhost ? 0.5 : 1;
        child.material.depthTest = !isGhost;
        child.material.depthWrite = !isGhost;
        if (!isGhost && child.material.isMeshStandardMaterial && !isBuiltInFeet(child.name)) {
          if (isHardwareMesh(child.name)) {
            child.material.metalness = 1;
            child.material.roughness = 0.2;
            child.material.envMapIntensity = 0.6;
          } else {
            const isDrawerOrDoor =
              isDrawerMesh(child.name) || isUnderDrawerOrDoorNode(child);
            child.material.color.set(
              isDrawerOrDoor ? drawerColorHex : bodyColorHex,
            );
            child.material.roughness = 1;
            child.material.metalness = 0.35;
            child.material.normalMap = normalMap ?? null;
            child.material.normalScale = new THREE.Vector2(1, 1);
            child.material.metalnessMap = metalnessMap ?? null;
            child.material.roughnessMap = roughnessMap ?? null;
            child.material.envMapIntensity = specularMap ? 0.5 : 0.35;
            child.material.needsUpdate = true;
          }
        }
      }
      if (isBuiltInFeet(child.name)) child.visible = false;
    });
    applyStainlessLogoMaterialToCabinetRoot(clone, { isGhost });
    return clone;
  }, [
    gltf.scene,
    isGhost,
    drawerColorHex,
    normalMap,
    metalnessMap,
    roughnessMap,
    specularMap,
  ]);

  const handlePointerDown = () => {
    //
  };

  const handlePointerUp = () => {
    // Selection stays from pointer down (set in GenerateAllCabinetsInScene) until user clicks elsewhere
  };

  return (
    <>
      <group
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        ref={cabinetRef}
      >
        <group position={[modelCenterOffset[0], floorOffsetY, modelCenterOffset[2]]}>
          <primitive object={sceneClone} />
        </group>
        <CabinetFeet
          width={boundingBox.width}
          depth={boundingBox.depth}
          placement={feetPlacement}
          isGhost={isGhost}
        />
      </group>
    </>
  );
};

export default ElevenDrawersTemplate;
