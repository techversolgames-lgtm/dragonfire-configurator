import TwelveDrawersTemplate from "../7ftCabinets/12DrawersTemplate";
import WallCabinetTemplate from "../standingCabinets/WallCabinetTemplate";
import LockerTemplate from "../standingCabinets/LockerTemplate";
import CabinetFeet, {
  WORKBENCH_GROUP_Y_IN_PACKAGE,
  getFloorOffsetY,
} from "../CabinetFeet";
import { useRef } from "react";
import useDragNDropStore from "@/stores/useDragNDropStore";
const TwelveDrawerPTemplate = ({ isGhost = false, placement }) => {
  const cabinetRef = useRef();
  const setSelectedObject = useDragNDropStore(
    (state) => state.setSelectedObject,
  );
  const setActiveSceneItem = useDragNDropStore(
    (state) => state.setActiveSceneItem,
  );
  const twelveDrawerDimensions = {
    width: 2.15,
    height: 0.95,
    depth: 0.7,
  };

  const wallCabinetDimensions = {
    width: 0.71,
    height: 0.65,
    depth: 0.35,
  };

  const lockerDimensions = {
    width: 0.9,
    height: 2.12,
    depth: 0.7,
  };

  /** Package feet: 6 leveling feet under workbench, 4 legs per locker (14 total). No options. */
  const workbenchFeetPlacement = {
    cabinetId: 2,
    baseOption: placement?.packageWorkbenchFeetOption ?? "riser",
  };
  const lockerFeetPlacement = { cabinetId: 8, baseOption: "legs" };

  const boundingBox = {
    width: 2.15 + 2 * 0.9,
    height: lockerDimensions.height,
    depth: 0.7,
  };

  const WALL_GROUP_Y = 0.165;
  const lockerTopY = lockerDimensions.height + getFloorOffsetY("legs");
  const wallCabinetYPosition =
    lockerTopY - wallCabinetDimensions.height - WALL_GROUP_Y;
  const wallCabinetZPosition =
    -twelveDrawerDimensions.depth / 2 + (0 * wallCabinetDimensions.depth) / 2;
  const wallCabinetXPositions = [
    -wallCabinetDimensions.width,
    0,
    wallCabinetDimensions.width,
  ];

  const lockerXPositions = [
    -(twelveDrawerDimensions.width / 2 + lockerDimensions.width / 2),
    twelveDrawerDimensions.width / 2 + lockerDimensions.width / 2,
  ];

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
        <group position={[0, WORKBENCH_GROUP_Y_IN_PACKAGE, -0.0175]}>
          <TwelveDrawersTemplate
            isGhost={isGhost}
            placement={placement}
            isPartOfPackage
            packageWorkbenchFeetOption={placement?.packageWorkbenchFeetOption ?? "riser"}
          />
          <CabinetFeet
            width={twelveDrawerDimensions.width}
            depth={twelveDrawerDimensions.depth}
            placement={workbenchFeetPlacement}
            isGhost={isGhost}
          />
        </group>
        <group position={[0, WALL_GROUP_Y, 0]}>
          {wallCabinetXPositions.map((xPos, index) => (
            <group
              key={`wall-${index}`}
              position={[xPos, wallCabinetYPosition, wallCabinetZPosition]}
            >
              <WallCabinetTemplate isGhost={isGhost} placement={placement} />
            </group>
          ))}
        </group>
        {lockerXPositions.map((xPos, index) => (
          <group key={`locker-${index}`} position={[xPos, 0, 0]}>
            <LockerTemplate isGhost={isGhost} placement={placement} isPartOfPackage />
            <CabinetFeet
              width={lockerDimensions.width}
              depth={lockerDimensions.depth}
              placement={lockerFeetPlacement}
              isGhost={isGhost}
            />
          </group>
        ))}
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

export default TwelveDrawerPTemplate;
