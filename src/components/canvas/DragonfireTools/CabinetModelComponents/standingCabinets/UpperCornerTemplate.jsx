import { useGLTF, useTexture } from "@react-three/drei";
import { useRef, useMemo, useEffect, useState } from "react";
import * as THREE from "three";
import useDragNDropStore from "@/stores/useDragNDropStore";
import {
  getLockerColorHex,
  getLockerBodyColorHex,
} from "@/data/DragonfireTools/lockerColors";
import { applyWhiteLogoMaterialToCabinetRoot } from "../cabinetLogoWhiteMaterial";

const METAL_TEX_BASE = "/textures/DragonFireTextuees/MetalTexture";

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

const drawerDoorNamePattern =
  /r_door|l_door|drawer|cabinet_door|_door\b|door\b|front/i;
const isDrawerMesh = (name) => drawerDoorNamePattern.test((name || "").trim());
const isUnderDrawerOrDoorNode = (node) => {
  let n = node;
  while (n) {
    if (drawerDoorNamePattern.test((n.name || "").trim())) return true;
    n = n.parent;
  }
  return false;
};
const isHardwareMesh = (name) =>
  /handle|lock|latch|pull|knob/i.test((name || "").trim());

// Upper-corner GLB local alignment to logical cabinet center.
// Tune these values if mesh and green bounding box are slightly off.
const UPPER_CORNER_MODEL_LOCAL_OFFSET = {
  x: -0.01,
  y: 0.0,
  z: 0.01,
};
const UPPER_CORNER_MODEL_LOCAL_ROTATION = {
  x: 0,
  y: -Math.PI / 2,
  z: 0,
};

const UpperCornerTemplate = ({ isGhost = false, placement }) => {
  const cabinetRef = useRef();
  const setSelectedObject = useDragNDropStore(
    (state) => state.setSelectedObject,
  );
  const setActiveSceneItem = useDragNDropStore(
    (state) => state.setActiveSceneItem,
  );
  const boundingBox = {
    // Keep in sync with cabinetItems.js (id: 12 "Upper Corner")
    width: 1.1,
    height: 0.65,
    depth: 1.1,
  };

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

  const gltf = useGLTF("/models/dragonfire-tools/upper_corner.glb");
  const sceneClone = useMemo(() => {
    const clone = gltf.scene.clone();
    clone.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        child.material.transparent = isGhost;
        child.material.opacity = isGhost ? 0.5 : 1;
        child.material.depthTest = !isGhost;
        child.material.depthWrite = !isGhost;
        if (!isGhost && child.material.isMeshStandardMaterial) {
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
    });
    applyWhiteLogoMaterialToCabinetRoot(clone, { isGhost });
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

  const handlePointerDown = () => {};
  const handlePointerUp = () => {};

  return (
    <>
      <group
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        ref={cabinetRef}
      >
        <primitive
          object={sceneClone}
          rotation={[
            UPPER_CORNER_MODEL_LOCAL_ROTATION.x,
            UPPER_CORNER_MODEL_LOCAL_ROTATION.y,
            UPPER_CORNER_MODEL_LOCAL_ROTATION.z
          ]}
          position={[
            UPPER_CORNER_MODEL_LOCAL_OFFSET.x,
            UPPER_CORNER_MODEL_LOCAL_OFFSET.y,
            UPPER_CORNER_MODEL_LOCAL_OFFSET.z
          ]}
        />
      </group>
    </>
  );
};

export default UpperCornerTemplate;
