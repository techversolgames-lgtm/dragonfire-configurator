import ElevenDrawersTemplate from "../standingCabinets/11DrawersTemplate";
import CabinetFeet, { getFloorOffsetY } from "../CabinetFeet";
import { useRef } from "react";
import useDragNDropStore from "@/stores/useDragNDropStore";

/**
 * 11 Drawer Package: two 11-drawer cabinets placed side by side.
 *
 * Legs (baseOption = "legs"): 4 + 4 = 8 legs total — two independent sets of 4,
 * one per sub-cabinet, offset ±0.55 m in X.
 *
 * Wheels (baseOption = "wheel"): 3 + 3 = 6 casters — a 6-position layout
 * (front-left, front-center, front-right / back-left, back-center, back-right)
 * across the full package width. The single center wheel per row replaces the
 * two adjacent inner wheels that would otherwise be close together at the
 * junction of the two cabinets.
 */
const ElevenDrawerPackageTemplate = ({ isGhost = false, placement }) => {
  const cabinetRef = useRef();
  const setSelectedObject = useDragNDropStore(
    (state) => state.setSelectedObject,
  );
  const setActiveSceneItem = useDragNDropStore(
    (state) => state.setActiveSceneItem,
  );

  /** Dimensions for a single 11-drawer unit. */
  const unitDimensions = {
    width: 1.1,
    height: 1.96,
    depth: 0.6,
  };

  /** Package bounding box: two units side by side. */
  const boundingBox = {
    width: unitDimensions.width * 2, // 2.2
    height: unitDimensions.height,
    depth: unitDimensions.depth,
  };

  /** Distance from package center to each sub-cabinet center along X. */
  const halfUnitWidth = unitDimensions.width / 2; // 0.55

  /** Active base option; default to "legs". */
  const baseOption = placement?.baseOption ?? "legs";

  /**
   * Sub-cabinet placement: forwards colour choice and the resolved baseOption
   * (needed so each sub-cabinet sits at the correct floor-offset height).
   * Feet are suppressed (isPartOfPackage=true) – the package renders them.
   */
  const subPlacement = placement ? { ...placement, baseOption } : null;

  /** Feet placement for each individual 11D unit — uses the actual baseOption so
   * "riser" / "riserLowProfile" / "legs" each render the correct foot model. */
  const unitFeetPlacement = { cabinetId: 10, baseOption };

  /**
   * Feet placement for wheels across the full package width.
   * cabinetId 23 is in SIX_FEET_CABINET_IDS, so CabinetFeet will use the
   * 6-position (getFeetTransforms6) layout automatically when baseOption="wheel".
   */
  const packageWheelFeetPlacement = { cabinetId: 23, baseOption: "wheel" };

  const handlePointerDown = () => {
    //
  };

  const handlePointerUp = () => {
    // Selection stays from pointer down (set in GenerateAllCabinetsInScene)
  };

  return (
    <>
      <group
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        ref={cabinetRef}
      >
        {/* Left 11-drawer unit */}
        <group position={[-halfUnitWidth, 0, 0]}>
          <ElevenDrawersTemplate
            isGhost={isGhost}
            placement={subPlacement}
            isPartOfPackage
          />
        </group>

        {/* Right 11-drawer unit */}
        <group position={[halfUnitWidth, 0, 0]}>
          <ElevenDrawersTemplate
            isGhost={isGhost}
            placement={subPlacement}
            isPartOfPackage
          />
        </group>

        {/* Feet: 4 + 4 = 8 total (4 per sub-cabinet) for legs / riser / riserLowProfile. */}
        {baseOption !== "wheel" && baseOption !== "none" && (
          <>
            <group position={[-halfUnitWidth, 0, 0]}>
              <CabinetFeet
                width={unitDimensions.width}
                depth={unitDimensions.depth}
                placement={unitFeetPlacement}
                isGhost={isGhost}
              />
            </group>
            <group position={[halfUnitWidth, 0, 0]}>
              <CabinetFeet
                width={unitDimensions.width}
                depth={unitDimensions.depth}
                placement={unitFeetPlacement}
                isGhost={isGhost}
              />
            </group>
          </>
        )}

        {/* Wheels: 3 + 3 = 6 casters across the full package width.
            Center wheel per row replaces the two adjacent inner wheels. */}
        {baseOption === "wheel" && (
          <CabinetFeet
            width={boundingBox.width}
            depth={boundingBox.depth}
            placement={packageWheelFeetPlacement}
            isGhost={isGhost}
          />
        )}
      </group>
    </>
  );
};

export default ElevenDrawerPackageTemplate;