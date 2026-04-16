import { useRef } from "react";
import useDragNDropStore from "@/stores/useDragNDropStore";
import { reverseIdMap } from "@/data/DragonfireTools/cabinetItems";

const boundingBox = { width: 0.9, height: 2.1, depth: 0.05 };

const DOOR_ID = 101;

/** Door position offset (metres): X = left/right, Y = up/down from floor base, Z = out from wall. */
const DOOR_OFFSET = {
  x: 0,
  y: 0,
  z: 0,
};

/** Door material color (CSS hex). */
const DOOR_COLOR = "#000000";

/** meshCenterOffsetY from room data (single source of truth for AABB/overlap box). */
const doorMeshCenterOffsetY = reverseIdMap[DOOR_ID]?.meshCenterOffsetY ?? 0.54;

/** Local offset of door mesh from parent group (so selection box can match). Export for GenerateAllCabinetsInScene. */
export const DOOR_BOUNDING_BOX_OFFSET = {
  x: DOOR_OFFSET.x,
  y: DOOR_OFFSET.y + doorMeshCenterOffsetY,
  z: boundingBox.depth / 2 + DOOR_OFFSET.z,
};

const DoorModel = ({ isGhost = false, placement }) => {
  const groupRef = useRef();
  const setActiveSceneItem = useDragNDropStore(
    (state) => state.setActiveSceneItem,
  );

  const handlePointerUp = () => {
    // Selection stays from pointer down (set in GenerateAllCabinetsInScene) until user clicks elsewhere
  };

  // Parent positions door center at FLOOR_Y + height/2 (base on floor); depth/2 offsets from wall
  return (
    <group
      ref={groupRef}
      position={[DOOR_BOUNDING_BOX_OFFSET.x, DOOR_BOUNDING_BOX_OFFSET.y, DOOR_BOUNDING_BOX_OFFSET.z]}
      onPointerUp={handlePointerUp}
    >
      <mesh>
        <boxGeometry
          args={[boundingBox.width, boundingBox.height, boundingBox.depth]}
        />
        <meshStandardMaterial
          color={DOOR_COLOR}
          metalness={1}
          roughness={0}
          transparent={isGhost}
          opacity={isGhost ? 0.5 : 1}
          depthTest={!isGhost}
          depthWrite={!isGhost}
        />
      </mesh>
    </group>
  );
};

export default DoorModel;
