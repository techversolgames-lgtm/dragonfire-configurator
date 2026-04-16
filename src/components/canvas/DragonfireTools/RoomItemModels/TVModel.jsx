import { useRef } from "react";
import useDragNDropStore from "@/stores/useDragNDropStore";
import { reverseIdMap } from "@/data/DragonfireTools/cabinetItems";

const TVModel = ({ isGhost = false, placement }) => {
  const groupRef = useRef();
  const setActiveSceneItem = useDragNDropStore(
    (state) => state.setActiveSceneItem,
  );

  const meta = placement?.cabinetId != null ? reverseIdMap[placement.cabinetId] : null;
  const box = meta?.boundingBox || { width: 1.22, height: 0.69, depth: 0.03 };
  const width = box.width;
  const height = box.height;
  const depth = box.depth;

  const handlePointerUp = () => {
    // Selection stays from pointer down (set in GenerateAllCabinetsInScene) until user clicks elsewhere
  };

  // Wall-mounted: back at wall (z=0), screen faces room; group offset so center at depth/2
  return (
    <group
      ref={groupRef}
      position={[0, height / 2, depth / 2]}
      onPointerUp={handlePointerUp}
    >
      {/* Screen panel */}
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color="#0d0d0f"
          transparent={isGhost}
          opacity={isGhost ? 0.5 : 1}
          depthTest={!isGhost}
          depthWrite={!isGhost}
        />
      </mesh>
      {/* Screen bezel (front face) */}
      <mesh position={[0, 0, depth / 2 + 0.01]}>
        <planeGeometry args={[width * 0.95, height * 0.95]} />
        <meshBasicMaterial
          color="#333338"
          transparent={isGhost}
          opacity={isGhost ? 0.5 : 1}
          depthTest={!isGhost}
          depthWrite={!isGhost}
        />
      </mesh>
    </group>
  );
};

export default TVModel;
