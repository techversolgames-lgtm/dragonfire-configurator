import { useRef } from "react";
import useDragNDropStore from "@/stores/useDragNDropStore";

const boundingBox = { width: 1.2, height: 1.0, depth: 0.1 };

const WindowModel = ({ isGhost = false, placement }) => {
  const groupRef = useRef();
  const setActiveSceneItem = useDragNDropStore(
    (state) => state.setActiveSceneItem,
  );

  const handlePointerUp = () => {
    // Selection stays from pointer down (set in GenerateAllCabinetsInScene) until user clicks elsewhere
  };

  return (
    <group
      ref={groupRef}
      position={[0, boundingBox.height / 2, boundingBox.depth / 2]}
      onPointerUp={handlePointerUp}
    >
      {/* Frame */}
      <mesh>
        <boxGeometry
          args={[boundingBox.width, boundingBox.height, boundingBox.depth]}
        />
        <meshStandardMaterial
          color="#e8e8e8"
          transparent={isGhost}
          opacity={isGhost ? 0.5 : 1}
          depthTest={!isGhost}
          depthWrite={!isGhost}
        />
      </mesh>
      {/* Glass */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry
          args={[boundingBox.width * 0.9, boundingBox.height * 0.9]}
        />
        <meshPhysicalMaterial
          color="#c8dcf0"
          transparent
          opacity={isGhost ? 0.4 : 0.6}
          depthTest={!isGhost}
          depthWrite={!isGhost}
          roughness={0.1}
          metalness={0}
        />
      </mesh>
    </group>
  );
};

export default WindowModel;
