//package imports
import * as THREE from "three";
import { useGLTF, useTexture } from "@react-three/drei";
import { useRef, useMemo, useEffect } from "react";

//local imports
import useDragNDropStore from "@/stores/useDragNDropStore";
import CabinetFeet, { getFloorOffsetY } from "../CabinetFeet";
import {
  getLockerColorHex,
  LOCKER_BODY_GLOSS_BLACK_HEX,
} from "@/data/DragonfireTools/lockerColors";
import { applyWhiteLogoMaterialToCabinetRoot } from "../cabinetLogoWhiteMaterial";
import {
  STAINLESS_COLOR,
  STAINLESS_ROUGHNESS,
  STAINLESS_METALNESS,
  STAINLESS_ENV_MAP_INTENSITY,
  prepareCabinetMeshMaterialsForTopSteel,
} from "../cabinetStainlessTopUtils";

/** Dragonfire logo on front fascia: tweak position (m), scale (width in m), rotation (radians). */


const FiftySixInchTemplate = ({
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
    width: 1.42,
    height: 0.95,
    depth: 0.66,
  };

  const backsplash = placement?.backsplash !== false;
  const bottomColor = placement?.bottomColor ?? "gunmetal";
  const reflectorOffsetX = placement?.reflectorOffsetX ?? 0;
  const reflectorOffsetZ = placement?.reflectorOffsetZ ?? 0.05;
  /** 56" Worktable defaults to small legs. Allow "none" to hide legs for standalone item. */
  const feetPlacement = isPartOfPackage
    ? null
    : placement
      ? { ...placement, baseOption: placement.baseOption ?? "smallLegs" }
      : { baseOption: "smallLegs" };
  const packageLegsOption =
    placement?.baseOption === "none" ? "none" : "smallLegs";
  const floorOffsetY = isPartOfPackage
    ? getFloorOffsetY(packageLegsOption)
    : getFloorOffsetY(feetPlacement?.baseOption ?? "smallLegs");

  const [metal046BRough, metal046BNormal, dragonfireLogoTex] = useTexture([
    "/textures/Metal046B_1K-JPG/Metal046B_1K-JPG_Roughness.jpg",
    "/textures/Metal046B_1K-JPG/Metal046B_1K-JPG_NormalGL.jpg",
    "/logos/dragonfire%20logo.svg",
  ]);

  if (metal046BRough) {
    metal046BRough.wrapS = metal046BRough.wrapT = THREE.RepeatWrapping;
    metal046BRough.repeat.set(2, 2);
  }
  if (metal046BNormal) {
    metal046BNormal.wrapS = metal046BNormal.wrapT = THREE.RepeatWrapping;
    metal046BNormal.repeat.set(2, 2);
  }
  if (dragonfireLogoTex) {
    dragonfireLogoTex.wrapS = dragonfireLogoTex.wrapT = THREE.ClampToEdgeWrapping;
    dragonfireLogoTex.flipY = false;
  }

  const gltf = useGLTF("/models/dragonfire-tools/work_table.glb");
  const sceneClone = useMemo(() => {
    const clone = gltf.scene.clone();
    // When Backsplash is off, hide the entire backsplash assembly by name (all disabled by the toggle)
    const isBuiltInFeet = (name) => {
      const n = (name || "").trim();
      return /feet|foot|legs?|riser/i.test(n);
    };
    const isBacksplashPart = (name) => {
      const n = (name || "").trim();
      return (
        /worktable\s*backsplash|backsplash|back_splash|wback|back\s*panel|rear\s*panel|backpanel|rearpanel|^\s*splash\s*$/i.test(n) ||
        // Power strip: match "POWER STRIP", "POWER STRIP.001", "PowerStrip", "power_strip", or name containing both "power" and "strip"
        /power\s*strip|powerstrip|power_strip|powerstrip\.?\d*|outlet|fixture|receptacle|strip\s*panel/i.test(n) ||
        (n.length < 30 && /power/i.test(n) && /strip/i.test(n)) ||
        /^part\s*\d+$/i.test(n) // Part 1, Part 2, etc. in backsplash assembly
      );
    };
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
    const hideNodeAndDescendants = (node) => {
      node.visible = false;
      node.traverse((descendant) => {
        descendant.visible = false;
      });
    };
    const gunmetalHex = getLockerColorHex("gunmetal");
    const blackHex = LOCKER_BODY_GLOSS_BLACK_HEX;

    clone.traverse((child) => {
      if (child.isMesh && child.material) {
        const skipTopFromGlb =
          prepareCabinetMeshMaterialsForTopSteel(child, isGhost);

        if (!isGhost && child.material.isMeshStandardMaterial && !skipTopFromGlb) {
          const name = (child.name || "").trim().toLowerCase();
          const isTopOrBacksplash =
            /backsplash|top|surface|counter/.test(name);
          const isPowerStrip =
            isPowerStripPart(child.name) || isUnderPowerStripNode(child);

          if (isPowerStrip) {
            // Keep power strip black like the 7ft/9ft templates.
            child.material.color.set(LOCKER_BODY_GLOSS_BLACK_HEX);
            child.material.roughness = 1;
            child.material.metalness = 0;
            child.material.envMapIntensity = 0;
            if (metal046BRough) {
              child.material.roughnessMap = metal046BRough;
            }
            if (metal046BNormal) {
              child.material.normalMap = metal046BNormal;
              child.material.normalScale = new THREE.Vector2(1, 1);
            }
            child.material.needsUpdate = true;
          } else if (isTopOrBacksplash) {
            // Stainless steel for top and backsplash
            child.material.color.set("#c0c5d3");
            child.material.roughness = 0.08;
            child.material.metalness = 1;
            child.material.envMapIntensity = 0.3;
          } else {
            // Painted bottom color (Gunmetal Gray or Gloss Black, shared with locker/11D palette)
            const useBlack =
              bottomColor === "black" || bottomColor === "glossBlack";
            const hex = useBlack ? blackHex : gunmetalHex;
            child.material.color.set(hex);
            child.material.roughness = 1;
            child.material.metalness =0;
            child.material.envMapIntensity =0;
            if (metal046BRough) {
              child.material.roughnessMap = metal046BRough;
            }
            if (metal046BNormal) {
              child.material.normalMap = metal046BNormal;
              child.material.normalScale = new THREE.Vector2(1, 1);
            }
            child.material.needsUpdate = true;
          }
        }
      }
      if (isBuiltInFeet(child.name)) {
        child.visible = false;
      }
      if (!backsplash && isBacksplashPart(child.name)) {
        hideNodeAndDescendants(child);
      }
    });
    // When Backsplash is off: also hide the whole backsplash assembly by finding WORKTABLE BACKSPLASH and hiding it + all its siblings (so POWER STRIP, POWER STRIP.001, Part 1 all go with it even if names differ in GLB)
    if (!backsplash) {
      clone.traverse((node) => {
        if (/worktable\s*backsplash/i.test((node.name || "").trim())) {
          const parent = node.parent;
          if (parent && parent !== clone) {
            parent.visible = false;
            parent.traverse((descendant) => {
              descendant.visible = false;
            });
          }
          return;
        }
      });
    }
    applyWhiteLogoMaterialToCabinetRoot(clone, { isGhost });
    return clone;
  }, [gltf.scene, isGhost, backsplash, bottomColor, metal046BRough, metal046BNormal]);

  const handlePointerDown = () => {
    /*
     * @todo
     * convert tiny movements into click.
     */
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

export default FiftySixInchTemplate;
