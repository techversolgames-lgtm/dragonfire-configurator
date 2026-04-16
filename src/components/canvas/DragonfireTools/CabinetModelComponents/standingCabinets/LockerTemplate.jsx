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

/** Glossiness (white = glossy) → roughness (white = rough). Returns a texture that inverts the glossiness image. */
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

const isBuiltInFeet = (name) => /feet|foot|legs?|riser/i.test((name || "").trim());
/** Door name pattern: panels, frame/trim, and hierarchy names like r_door 1, l_door 1. */
const doorNamePattern = /r_door|l_door|door|doorframe|door_frame|doortrim|door_trim|frame|trim/i;
const isDoorMesh = (name) => doorNamePattern.test((name || "").trim());
/** True if this node or any ancestor is named like a door (e.g. r_door 1, l_door 1) so child meshes get door colour. */
const isUnderDoorLikeNode = (node) => {
  let n = node;
  while (n) {
    if (doorNamePattern.test((n.name || "").trim())) return true;
    n = n.parent;
  }
  return false;
};
/** Hardware (handles, locks, latches, pulls) stay stainless/metal, not painted. */
const isHardwareMesh = (name) =>
  /handle|lock|latch|pull|knob/i.test((name || "").trim());

const LockerTemplate = ({
  isGhost = false,
  placement,
  isPartOfPackage = false,
}) => {
  const cabinetRef = useRef();
  const setSelectedObject = useDragNDropStore(
    (state) => state.setSelectedObject,
  );
  const setActiveSceneItem = useDragNDropStore(
    (state) => state.setActiveSceneItem,
  );
  const boundingBox = {
    width: 0.9,
    height: 2.4,
    depth: 0.7,
  };
  /** Locker (8) uses Legs by default. When part of package, feet are rendered by package but body still sits on legs. */
  const baseOption = placement?.baseOption ?? "legs";
  const floorOffsetY = isPartOfPackage
    ? getFloorOffsetY("legs")
    : placement
      ? getFloorOffsetY(baseOption)
      : isGhost
        ? getFloorOffsetY(baseOption)
        : 0;
  const feetPlacement = isPartOfPackage
    ? null
    : placement
      ? { ...placement, baseOption }
      : isGhost
        ? { cabinetId: 8, baseOption }
        : null;

  /** Door color: Gunmetal Gray or Gloss Black (user choice). Body/base always Gloss Black. */
  const doorColorHex = getLockerColorHex(placement?.lockerColor);
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

  const gltf = useGLTF("/models/dragonfire-tools/locker_full.glb");
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
            const isDoor = isDoorMesh(child.name) || isUnderDoorLikeNode(child);
            child.material.color.set(
              isDoor ? doorColorHex : bodyColorHex,
            );
            child.material.roughness = 1;
            child.material.metalness = 0.35;
            child.material.normalMap = normalMap ?? null;
            child.material.normalScale = new THREE.Vector2(1, 1);
            child.material.metalnessMap = metalnessMap ?? null;
            child.material.roughnessMap = roughnessMap ?? null;
            if (specularMap) {
              child.material.envMapIntensity = 0.5;
            } else {
              child.material.envMapIntensity = 0.35;
            }
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
    doorColorHex,
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
        <group position={[0, floorOffsetY, 0]}>
          <primitive object={sceneClone} />
        </group>
        <CabinetFeet
          width={boundingBox.width}
          depth={boundingBox.depth}
          placement={feetPlacement}
          isGhost={isGhost}
        />
      </group>
      {/* <group position={[0, boundingBox.height / 2, 0]}>
        <mesh>
          <boxGeometry
            args={[boundingBox.width, boundingBox.height, boundingBox.depth]}
          />
          <meshStandardMaterial
            color="rgb(0, 128, 0)"
            opacity={isGhost ? 0.5 : 1}
            transparent={isGhost}
            depthTest={!isGhost}
            depthWrite={!isGhost}
            wireframe
          />
        </mesh>
      </group> */}
    </>
  );
};

export default LockerTemplate;
