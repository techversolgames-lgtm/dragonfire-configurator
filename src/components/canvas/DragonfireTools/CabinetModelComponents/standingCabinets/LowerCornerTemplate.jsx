import { useGLTF, useTexture } from "@react-three/drei";
import { useRef, useMemo, useEffect, useState } from "react";
import * as THREE from "three";
import useDragNDropStore from "@/stores/useDragNDropStore";
import {
  getLockerColorHex,
  getLockerBodyColorHex,
  LOCKER_BODY_GLOSS_BLACK_HEX,
} from "@/data/DragonfireTools/lockerColors";
import { reverseIdMap } from "@/data/DragonfireTools/cabinetItems";
import CabinetFeet, { getFloorOffsetY } from "../CabinetFeet";
import {
  STAINLESS_COLOR,
  STAINLESS_ROUGHNESS,
  STAINLESS_METALNESS,
  STAINLESS_ENV_MAP_INTENSITY,
  prepareCabinetMeshMaterialsForTopSteel,
} from "../cabinetStainlessTopUtils";

const isStainlessTopPart = (name) =>
  /top|surface|counter|worktop|stainless/i.test((name || "").trim());

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
const POWER_STRIP_RED_MATERIAL_NAME =
  "0.686275_0.145098_0.145098_0.000000_0.001";
const isPowerStripPart = (name) => {
  const n = (name || "").trim();
  return (
    /power\s*strip|powerstrip|power_strip|powerstrip\.?\d*|outlet|fixture|receptacle|strip\s*panel/i.test(n) ||
    (n.length < 30 && /power/i.test(n) && /strip/i.test(n))
  );
};
const isUnderPowerStripNode = (node) => {
  let n = node;
  while (n) {
    if (isPowerStripPart(n.name)) return true;
    n = n.parent;
  }
  return false;
};

const LowerCornerTemplate = ({ isGhost = false, placement }) => {
  const cabinetRef = useRef();
  const setSelectedObject = useDragNDropStore(
    (state) => state.setSelectedObject,
  );
  const setActiveSceneItem = useDragNDropStore(
    (state) => state.setActiveSceneItem,
  );
  const boundingBox = {
    width: 1.06,
    height: 0.95,
    depth: 1.06,
  };
  const centerOffset =
    reverseIdMap[11]?.centerOffsetPosition ?? { x: 0.25, z: 0 };

  const drawerColorHex = getLockerColorHex(placement?.lockerColor);
  const bodyColorHex = getLockerBodyColorHex(placement?.lockerColor);
  const backsplash = placement?.backsplash !== false;
  const floorOffsetY = placement
    ? getFloorOffsetY(placement.baseOption ?? "none")
    : 0;

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

  const gltf = useGLTF("/models/dragonfire-tools/lower_corner.glb");
  const sceneClone = useMemo(() => {
    const clone = gltf.scene.clone();
    clone.traverse((child) => {
      if (child.isMesh && child.material) {
        const skipTopFromGlb =
          prepareCabinetMeshMaterialsForTopSteel(child, isGhost);
        if (!isGhost && child.material.isMeshStandardMaterial) {
          if (isHardwareMesh(child.name)) {
            child.material.metalness = 1;
            child.material.roughness = 0.2;
            child.material.envMapIntensity = 0.6;
          } else if (
            isPowerStripPart(child.name) ||
            isUnderPowerStripNode(child)
          ) {
            const isRedPowerStripMaterial =
              child.material?.name === POWER_STRIP_RED_MATERIAL_NAME;
            child.material.color.set(
              isRedPowerStripMaterial ? "#ff0000" : LOCKER_BODY_GLOSS_BLACK_HEX,
            );
            child.material.roughness = 1;
            child.material.metalness = 0.35;
            child.material.normalMap = normalMap ?? null;
            child.material.normalScale = new THREE.Vector2(1, 1);
            child.material.metalnessMap = metalnessMap ?? null;
            child.material.roughnessMap = roughnessMap ?? null;
            child.material.envMapIntensity = specularMap ? 0.5 : 0.35;
            child.material.needsUpdate = true;
          } else if (skipTopFromGlb || isStainlessTopPart(child.name)) {
            if (!skipTopFromGlb) {
              child.material.color.set(STAINLESS_COLOR);
              child.material.roughness = STAINLESS_ROUGHNESS;
              child.material.metalness = STAINLESS_METALNESS;
              child.material.envMapIntensity = STAINLESS_ENV_MAP_INTENSITY;
            }
            child.material.normalMap = normalMap ?? null;
            child.material.normalScale = new THREE.Vector2(1, 1);
            child.material.metalnessMap = metalnessMap ?? null;
            child.material.roughnessMap = roughnessMap ?? null;
            child.material.needsUpdate = true;
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

  const gltfWback = useGLTF("/models/dragonfire-tools/corner_wback.glb");
  const wbackClone = useMemo(() => {
    const clone = gltfWback.scene.clone();
    clone.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        child.material.transparent = isGhost;
        child.material.opacity = isGhost ? 0.5 : 1;
        child.material.depthTest = !isGhost;
        child.material.depthWrite = !isGhost;
        if (!isGhost && child.material.isMeshStandardMaterial) {
          if (
            isPowerStripPart(child.name) ||
            isUnderPowerStripNode(child)
          ) {
            const isRedPowerStripMaterial =
              child.material?.name === POWER_STRIP_RED_MATERIAL_NAME;
            child.material.color.set(
              isRedPowerStripMaterial ? "#ff0000" : LOCKER_BODY_GLOSS_BLACK_HEX,
            );
            child.material.roughness = 1;
            child.material.metalness = 0.35;
            child.material.normalMap = normalMap ?? null;
            child.material.normalScale = new THREE.Vector2(1, 1);
            child.material.metalnessMap = metalnessMap ?? null;
            child.material.roughnessMap = roughnessMap ?? null;
            child.material.envMapIntensity = specularMap ? 0.5 : 0.35;
          } else {
            child.material.color.set(STAINLESS_COLOR);
            child.material.roughness = STAINLESS_ROUGHNESS;
            child.material.metalness = STAINLESS_METALNESS;
            child.material.envMapIntensity = STAINLESS_ENV_MAP_INTENSITY;
          }
          child.material.needsUpdate = true;
        }
      }
    });
    return clone;
  }, [gltfWback.scene, isGhost, normalMap, metalnessMap, roughnessMap, specularMap]);

  const wbackPosition = [0, 0, 0];
  const wbackRotation = [0, 0, 0];

  const handlePointerDown = () => {};
  const handlePointerUp = () => {};

  return (
    <>
      <group
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        ref={cabinetRef}
      >
        <group position={[centerOffset.x ?? 0, floorOffsetY, centerOffset.z ?? 0]}>
          <primitive object={sceneClone} />
          {backsplash && (
            <group position={wbackPosition} rotation={wbackRotation}>
              <primitive object={wbackClone} />
            </group>
          )}
        </group>
        <CabinetFeet
          width={boundingBox.width}
          depth={boundingBox.depth}
          placement={placement}
          isGhost={isGhost}
          footInsetZFrontOverrideByIndex={{ 0: 0.2 }}
          footInsetXOverrideByIndex={{ 0: 0.2 }}
        />
      </group>
    </>
  );
};

export default LowerCornerTemplate;
