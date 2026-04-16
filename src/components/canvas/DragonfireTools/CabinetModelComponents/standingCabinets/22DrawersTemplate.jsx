import { useGLTF } from "@react-three/drei";
import { useRef, useMemo } from "react";
import useDragNDropStore from "@/stores/useDragNDropStore";
import CabinetFeet, { getFloorOffsetY } from "../CabinetFeet";
import { applyWhiteLogoMaterialToCabinetRoot } from "../cabinetLogoWhiteMaterial";

/**
 * Center/origin convention for floor cabinets (22D, Locker, etc.):
 * - The template group origin (0,0,0) must be the CENTER of the cabinet footprint at the floor.
 * - So in local space: X = ±width/2, Z = ±depth/2, Y = 0 is floor.
 * - The GLB must be authored with its origin at that center (no offset in the template).
 * - GenerateAllCabinetsInScene uses this origin for placement (x,z) and hitbox; CabinetFeet uses ±width/2, ±depth/2 from origin.
 */
const TwentyTwoDrawersTemplate = ({ isGhost = false, placement }) => {
  const cabinetRef = useRef();
  const setSelectedObject = useDragNDropStore(
    (state) => state.setSelectedObject,
  );
  const setActiveSceneItem = useDragNDropStore(
    (state) => state.setActiveSceneItem,
  );
  const boundingBox = {
    width: 2.15,
    height: 2.04,
    depth: 0.67,
  };
  const floorOffsetY = placement
    ? getFloorOffsetY(placement.baseOption ?? "none")
    : 0;

  const gltf = useGLTF("/models/dragonfire-tools/22D.glb");
  const sceneClone = useMemo(() => {
    const clone = gltf.scene.clone();
    clone.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        child.material.transparent = isGhost;
        child.material.opacity = isGhost ? 0.5 : 1;
        child.material.depthTest = !isGhost;
        child.material.depthWrite = !isGhost;
      }
    });
    applyWhiteLogoMaterialToCabinetRoot(clone, { isGhost });
    return clone;
  }, [gltf.scene, isGhost]);

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
          placement={placement}
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

export default TwentyTwoDrawersTemplate;
