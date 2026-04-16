import WallCabinetTemplate from "./WallCabinetTemplate";
import { useRef } from "react";
import useDragNDropStore from "@/stores/useDragNDropStore";

const ThreeWallCabinetsTemplate = ({ isGhost = false, placement }) => {
  const cabinetRef = useRef();
  const setSelectedObject = useDragNDropStore(
    (state) => state.setSelectedObject,
  );
  const setActiveSceneItem = useDragNDropStore(
    (state) => state.setActiveSceneItem,
  );
  const singleCabinetWidth = 0.71;
  const boundingBox = {
    width: singleCabinetWidth * 3,
    height: 0.65,
    depth: 0.35,
  };

  const positions = [-singleCabinetWidth, 0, singleCabinetWidth];

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
        {positions.map((xPos, index) => (
          <group key={index} position={[xPos, 0, 0]}>
            <WallCabinetTemplate isGhost={isGhost} placement={placement} />
          </group>
        ))}
      </group>
      {/* <group position={[0, boundingBox.height / 2, 0 + boundingBox.depth / 2]}>
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

export default ThreeWallCabinetsTemplate;
