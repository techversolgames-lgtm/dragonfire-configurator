//package imports
import { useEffect } from "react";

//local imports
import useDragNDropStore from "@/stores/useDragNDropStore";
import {
  items,
  worktableOptions,
  reverseIdMap,
} from "@/data/DragonfireTools/cabinetItems";

//log cabinetItems
console.log("items", items, worktableOptions);

const InitialDummyCube = () => {
  const height = 1;

  //#region active states
  const airDragPoint = useDragNDropStore((state) => state.airDragPoint) || {
    x: 10000000000000,
    y: 10000000000000,
    z: 10000000000000,
  };
  const floorPoint = useDragNDropStore((state) => state.floorPoint) || {
    x: 10000000000000,
    y: 10000000000000,
    z: 10000000000000,
  };
  const placedPositions = useDragNDropStore((state) => state.placedPositions);
  const selectedDeckItem = useDragNDropStore((state) => state.selectedDeckItem);

  //#endregion
  //TODO: add hasLanded variable either as ref or state
  // to prevent jerky jump to the back immediately after landing
  const ghostPosition = selectedDeckItem
    ? floorPoint.x > 100000
      ? airDragPoint
      : floorPoint
    : { x: 10000000000, y: 10000000000, z: 10000000000 };

  const selectedDeckItemColor = selectedDeckItem
    ? reverseIdMap[selectedDeckItem.id].color
    : "red";
  const { boundingBox } = reverseIdMap[selectedDeckItem?.id] || {};
  const {
    width: ghostWidth,
    height: ghostHeight,
    depth: ghostDepth,
  } = boundingBox || {};
  return (
    <>
      <group
        position={[
          ghostPosition.x,
          ghostPosition.y + ghostHeight / 2,
          ghostPosition.z,
        ]}
      >
        <mesh>
          <boxGeometry
            args={[ghostWidth || 1, ghostHeight || height, ghostDepth || 1]}
          />
          <meshStandardMaterial
            color={selectedDeckItemColor}
            transparent
            opacity={0.5}
            depthTest={false}
            depthWrite={false}
            wireframe
          />
        </mesh>
      </group>
      {placedPositions.map((onePosition, _) => {
        //log onePosition
        console.log("onePosition", onePosition);
        const {
          position: { x, y, z },
        } = onePosition;
        // const item = reverseIdMap[onePosition.id];
        console.log("item", onePosition, reverseIdMap, onePosition.cabinetId);
        const {
          boundingBox: { width, height, depth },
        } = reverseIdMap[onePosition.cabinetId] || {};
        return (
          <group position={[x, height / 2, z]}>
            <mesh>
              <boxGeometry args={[width || 1, height || 1, depth || 1]} />
              <meshStandardMaterial
                color={reverseIdMap[onePosition.cabinetId].color}
                wireframe
              />
            </mesh>
          </group>
        );
      })}
    </>
  );
};

export default InitialDummyCube;
