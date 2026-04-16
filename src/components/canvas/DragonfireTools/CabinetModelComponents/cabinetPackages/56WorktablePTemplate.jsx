import FiftySixInchTemplate from "../worktable/56InchTemplate";
import WallCabinetTemplate from "../standingCabinets/WallCabinetTemplate";
import CabinetFeet, { getFloorCabinetBaseY } from "../CabinetFeet";
import { useRef } from "react";
import useDragNDropStore from "@/stores/useDragNDropStore";

const FiftySixInchWorktablePTemplate = ({ isGhost = false, placement }) => {
  const cabinetRef = useRef();
  const setSelectedObject = useDragNDropStore(
    (state) => state.setSelectedObject,
  );
  const setActiveSceneItem = useDragNDropStore(
    (state) => state.setActiveSceneItem,
  );
  const worktableDimensions = {
    width: 1.42,
    height: 0.95,
    depth: 0.7,
  };

  const wallCabinetDimensions = {
    width: 0.71,
    height: 0.65,
    depth: 0.35,
  };

  const boundingBox = {
    width: 1.42,
    height: 1.96,
    depth: 0.7,
  };

  const wallCabinetYBase =
    boundingBox.height - wallCabinetDimensions.height + 0.19;
  /** When legs are off, package root Y rises (getFloorCabinetBaseY); offset wall cabs down so world height stays aligned with legs-on. */
  const packageBaseYDeltaNoLegs =
    getFloorCabinetBaseY("none", { cabinetId: 16 }) -
    getFloorCabinetBaseY("smallLegs", { cabinetId: 16 });
  const legsOn =
    placement == null || (placement.baseOption ?? "smallLegs") !== "none";
  const wallCabinetYPosition = legsOn
    ? wallCabinetYBase
    : wallCabinetYBase - packageBaseYDeltaNoLegs;
  const wallCabinetZPosition =
    -worktableDimensions.depth / 2 + (0 * wallCabinetDimensions.depth) / 2+0.015;
  const wallCabinetXPositions = [
    -wallCabinetDimensions.width / 2,
    wallCabinetDimensions.width / 2,
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
        <FiftySixInchTemplate
          isGhost={isGhost}
          placement={placement}
          isPartOfPackage
        />
        {/* Package feet: 4 small legs; baseOption none / smallLegs from sidebar. */}
        <CabinetFeet
          width={worktableDimensions.width}
          depth={worktableDimensions.depth}
          placement={
            placement
              ? {
                  ...placement,
                  cabinetId: 16,
                  baseOption: placement.baseOption ?? "smallLegs",
                }
              : { cabinetId: 16, baseOption: "smallLegs" }
          }
          isGhost={isGhost}
        />
        {wallCabinetXPositions.map((xPos, index) => (
          <group
            key={index}
            position={[xPos, wallCabinetYPosition, wallCabinetZPosition]}
          >
            <WallCabinetTemplate isGhost={isGhost} placement={placement} />
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

export default FiftySixInchWorktablePTemplate;
