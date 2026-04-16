import { useGLTF, useTexture } from "@react-three/drei";
import { useRef, useMemo, useEffect, useState } from "react";
import * as THREE from "three";
import useDragNDropStore from "@/stores/useDragNDropStore";
import CabinetFeet, { getFloorOffsetY } from "../CabinetFeet";
import { applyWhiteLogoMaterialToCabinetRoot } from "../cabinetLogoWhiteMaterial";
import {
  getLockerColorHex,
  getLockerBodyColorHex,
  LOCKER_BODY_GLOSS_BLACK_HEX,
} from "@/data/DragonfireTools/lockerColors";
import {
  STAINLESS_COLOR,
  STAINLESS_ROUGHNESS,
  STAINLESS_METALNESS,
  STAINLESS_ENV_MAP_INTENSITY,
  prepareCabinetMeshMaterialsForTopSteel,
} from "../cabinetStainlessTopUtils";

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

/** Drawer/door name pattern (e.g. r_door 1, l_door 1, cabinet_door, front; child meshes like mesh393_mesh.001 get colour via parent). */
const drawerDoorNamePattern =
  /r_door|l_door|drawer|front|cabinet_door|_door\b|door\b/i;
const isDrawerFront = (name) =>
  drawerDoorNamePattern.test((name || "").trim());
/** True if this node or any ancestor is named like a door/drawer so child meshes get the selected colour. */
const isUnderDrawerOrDoorNode = (node) => {
  let n = node;
  while (n) {
    if (drawerDoorNamePattern.test((n.name || "").trim())) return true;
    n = n.parent;
  }
  return false;
};
/** Handles/locks stay stainless/metal. */
const isHardwareMesh = (name) =>
  /handle|lock|latch|pull|knob/i.test((name || "").trim());

/** Backsplash assembly parts (visibility: hide with backsplash off). */
const isBacksplashPart = (name) => {
  const n = (name || "").trim();
  return (
    /worktable\s*backsplash|backsplash|back_splash|wback|back\s*panel|rear\s*panel|backpanel|rearpanel|^\s*splash\s*$/i.test(n) ||
    /power\s*strip|powerstrip|power_strip|powerstrip\.?\d*|outlet|fixture|receptacle|strip\s*panel/i.test(n) ||
    (n.length < 30 && /power/i.test(n) && /strip/i.test(n)) ||
    /^part\s*\d+$/i.test(n)
  );
};
/** Power strip etc. – do not get SS; only the backsplash panel gets SS. */
const isPowerStripPart = (name) => {
  const n = (name || "").trim();
  return (
    /power\s*strip|powerstrip|power_strip|powerstrip\.?\d*|outlet|fixture|receptacle|strip\s*panel/i.test(n) ||
    (n.length < 30 && /power/i.test(n) && /strip/i.test(n))
  );
};
/** Backsplash panel only (excludes power strip) – these get stainless steel. */
const isBacksplashPanelForSS = (name) =>
  isBacksplashPart(name) && !isPowerStripPart(name);
/** True if node or an ancestor is the backsplash panel (not power strip). */
const isUnderBacksplashPanelNode = (node) => {
  let n = node;
  while (n) {
    if (isBacksplashPanelForSS(n.name)) return true;
    n = n.parent;
  }
  return false;
};
/** True if node or an ancestor is power strip (no SS). */
const isUnderPowerStripNode = (node) => {
  let n = node;
  while (n) {
    if (isPowerStripPart(n.name)) return true;
    n = n.parent;
  }
  return false;
};
const hideNodeAndDescendants = (node) => {
  node.visible = false;
  node.traverse((descendant) => {
    descendant.visible = false;
  });
};

const TwelveDrawersTemplate = ({
  isGhost = false,
  placement,
  isPartOfPackage = false,
  packageWorkbenchFeetOption = "riser",
}) => {
  const cabinetRef = useRef();
  const setSelectedObject = useDragNDropStore(
    (state) => state.setSelectedObject,
  );
  const setActiveSceneItem = useDragNDropStore(
    (state) => state.setActiveSceneItem,
  );
  const boundingBox = {
    width: 2.15,
    height: 0.95,
    depth: 0.65,
  };

  /** 12 Drawer fronts use shared Gunmetal / Gloss Black palette; cabinet body stays Gloss Black. */
  const drawerColorHex = getLockerColorHex(placement?.lockerColor);
  const bodyColorHex = getLockerBodyColorHex(placement?.lockerColor);

  const backsplash = placement?.backsplash !== false;
  const floorOffsetY =
    isPartOfPackage
      ? getFloorOffsetY(packageWorkbenchFeetOption)
      : placement?.cabinetId === 2
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

  const gltf = useGLTF("/models/dragonfire-tools/12D.glb");
  const sceneClone = useMemo(() => {
    const clone = gltf.scene.clone();
    // When Backsplash is off, hide backsplash/power strip parts by name (same as 56" workbench).
    clone.traverse((child) => {
      if (child.isMesh && child.material) {
        const skipCabinetBodyStyling =
          prepareCabinetMeshMaterialsForTopSteel(child, isGhost);

        if (
          !isGhost &&
          child.material.isMeshStandardMaterial &&
          !skipCabinetBodyStyling
        ) {
          if (isHardwareMesh(child.name)) {
            child.material.metalness = 1;
            child.material.roughness = 0.2;
            child.material.envMapIntensity = 0.6;
          } else if (
            isBacksplashPanelForSS(child.name) ||
            isUnderBacksplashPanelNode(child)
          ) {
            // Stainless steel for backsplash panel only; power strip does not get SS.
            child.material.color.set(STAINLESS_COLOR);
            child.material.roughness = STAINLESS_ROUGHNESS;
            child.material.metalness = STAINLESS_METALNESS;
            child.material.envMapIntensity = STAINLESS_ENV_MAP_INTENSITY;
            child.material.needsUpdate = true;
          } else if (
            isPowerStripPart(child.name) ||
            isUnderPowerStripNode(child)
          ) {
            // Power strip (POWER STRIP.003, etc.): cabinet body look, not SS.
            child.material.color.set(LOCKER_BODY_GLOSS_BLACK_HEX);
            child.material.roughness = 1;
            child.material.metalness = 0.35;
            child.material.normalMap = normalMap ?? null;
            child.material.normalScale = new THREE.Vector2(1, 1);
            child.material.metalnessMap = metalnessMap ?? null;
            child.material.roughnessMap = roughnessMap ?? null;
            child.material.envMapIntensity = specularMap ? 0.5 : 0.35;
            child.material.needsUpdate = true;
          } else {
            const isFront =
              isDrawerFront(child.name) || isUnderDrawerOrDoorNode(child);
            child.material.color.set(
              isFront ? drawerColorHex : bodyColorHex,
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
      if (!backsplash && isBacksplashPart(child.name)) {
        hideNodeAndDescendants(child);
      }
    });
    // When Backsplash is off: hide whole backsplash assembly by parent (power strip, Part 1, etc. go with it).
    if (!backsplash) {
      clone.traverse((node) => {
        if (/worktable\s*backsplash|backsplash\s*assembly/i.test((node.name || "").trim())) {
          const parent = node.parent;
          if (parent && parent !== clone) {
            parent.visible = false;
            parent.traverse((descendant) => {
              descendant.visible = false;
            });
          }
        }
      });
    }
    applyWhiteLogoMaterialToCabinetRoot(clone, { isGhost });
    return clone;
  }, [
    gltf.scene,
    isGhost,
    backsplash,
    drawerColorHex,
    normalMap,
    metalnessMap,
    roughnessMap,
    specularMap,
  ]);

  const gltfWback = useGLTF("/models/dragonfire-tools/7ft_wback.glb");
  /** Backsplash clone: SS for panel only; power strip gets body colour (not SS). */
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
          const isPanel =
            isBacksplashPanelForSS(child.name) ||
            isUnderBacksplashPanelNode(child);
          const isPowerStrip =
            isPowerStripPart(child.name) || isUnderPowerStripNode(child);
          if (isPanel && !isPowerStrip) {
            child.material.color.set(STAINLESS_COLOR);
            child.material.roughness = STAINLESS_ROUGHNESS;
            child.material.metalness = STAINLESS_METALNESS;
            child.material.envMapIntensity = STAINLESS_ENV_MAP_INTENSITY;
          } else if (isPowerStrip) {
            child.material.color.set(LOCKER_BODY_GLOSS_BLACK_HEX);
            child.material.roughness = 1;
            child.material.metalness = 0.35;
            child.material.normalMap = normalMap ?? null;
            child.material.normalScale = new THREE.Vector2(1, 1);
            child.material.metalnessMap = metalnessMap ?? null;
            child.material.roughnessMap = roughnessMap ?? null;
            child.material.envMapIntensity = specularMap ? 0.5 : 0.35;
          }
          child.material.needsUpdate = true;
        }
      }
    });
    applyWhiteLogoMaterialToCabinetRoot(clone, { isGhost });
    return clone;
  }, [
    gltfWback.scene,
    isGhost,
    normalMap,
    metalnessMap,
    roughnessMap,
    specularMap,
  ]);

  // Backsplash at the back of cabinet
  const wbackPosition = [0, 0, 0];
  const wbackRotation = [0, 0, 0];

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
          {backsplash && (
            <group position={wbackPosition} rotation={wbackRotation}>
              <primitive object={wbackClone} />
            </group>
          )}
        </group>
        {!isPartOfPackage && placement?.cabinetId === 2 && (
          <CabinetFeet
            width={boundingBox.width}
            depth={boundingBox.depth}
            placement={placement}
            isGhost={isGhost}
          />
        )}
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
      </group>*/}
    </>
  );
};

export default TwelveDrawersTemplate;
