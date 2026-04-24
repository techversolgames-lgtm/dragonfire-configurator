import CustomSidebar from "@/components/dom/CustomSidebar";
import useAnimationStore from "@/stores/useAnimationStore";
import useDragNDropStore from "@/stores/useDragNDropStore";
import { useEffect, useMemo, useState } from "react";
import {
  FaRuler,
  FaVectorSquare,
  FaBorderAll,
  FaLayerGroup,
  FaToolbox,
  FaFileAlt,
  FaTimes,
  FaTrash,
  FaUser,
  FaQuestionCircle,
} from "react-icons/fa";
import { BiSolidCabinet } from "react-icons/bi";
import {
  FLOOR_MATERIALS,
  DEFAULT_FLOOR_MATERIAL_ID,
  getFloorMaterialDefaultTextureTiles,
} from "@/data/DragonfireTools/floorMaterials";
import { reverseIdMap } from "@/data/DragonfireTools/cabinetItems";
import {
  LOCKER_COLOR_OPTIONS,
  DEFAULT_LOCKER_COLOR,
} from "@/data/DragonfireTools/lockerColors";
import {
  TV_SIZE_INCHES,
  tvDiagonalInchesToWidthHeightM,
} from "@/data/DragonfireTools/roomItems";
import Select from "@/components/dom/Select";
import styles from "@/styles/dom/DragonfireTools/DragonfireToolsSidebar.module.scss";
import DragonfireQuoteSidebarPanel from "./DragonfireQuoteSidebarPanel";
import { useDragonfireTutorial } from "./DragonfireTutorialContext";
import { TUTORIAL_STEPS } from "@/data/DragonfireTools/dragonfireTutorialSteps";
import {
  SCALE_REFERENCE_ID,
  syncScaleCharacterPlacements,
  clearScaleCharacterPlacementCache,
} from "@/components/canvas/DragonfireTools/scaleCharacterPlacementSync";
import { CabinetOptionsToDrag } from "@/components/dom/DragonfireTools/CabinetOptionsToDrag";

const TOOLBAR_SECTIONS = [
  { id: "help", label: "Help", icon: FaQuestionCircle },
  { id: "units", label: "Units & Grid", icon: FaRuler },
  { id: "walls", label: "Walls", icon: FaVectorSquare },
  { id: "floor", label: "Floor", icon: FaLayerGroup },
  { id: "scale", label: "Scale Character", icon: FaUser },
  { id: "items", label: "Cabinet / Room item options", icon: FaToolbox },
  { id: "quote", label: "Quote", icon: FaFileAlt },
  { id: "config", label: "Configuration", icon: BiSolidCabinet },
];
// const TOOLBAR_SECTIONS = [
//   { id: "help", label: "Help", icon: '/icons/help.png' },
//   { id: "units", label: "Units & Grid", icon: '/icons/scale.png' },
//   { id: "walls", label: "Walls", icon: FaVectorSquare },
//   { id: "floor", label: "Floor", icon: FaLayerGroup },
//   { id: "scale", label: "Scale Character", icon: '/icons/character.png' },
//   { id: "items", label: "Cabinet / Room item options", icon: FaToolbox },
//   { id: "quote", label: "Quote", icon: '/icons/form.png' },
//   
// ];

/** Section IDs that render custom content (no CustomSidebar). These get the shared Spokbee footer; add new tool sections here. */
const CUSTOM_CONTENT_SECTION_IDS = ["scale", "items", "quote"];
const ROOM_ITEM_IDS = [100, 101, 102];
const TV_ID = 100;
const INCHES_PER_M = 1 / 0.0254;
function mToIn(m) {
  return m * INCHES_PER_M;
}
function inToM(inches) {
  return Number(inches) / INCHES_PER_M;
}
function tvWidthHeightMToDiagonalInches(widthM, heightM) {
  const diagM = Math.sqrt(widthM * widthM + heightM * heightM);
  return diagM / 0.0254;
}
function closestTvSizeInches(widthM, heightM) {
  const diag = tvWidthHeightMToDiagonalInches(widthM, heightM);
  let best = TV_SIZE_INCHES[0];
  let bestDiff = Math.abs(diag - best);
  for (const size of TV_SIZE_INCHES) {
    const d = Math.abs(diag - size);
    if (d < bestDiff) {
      bestDiff = d;
      best = size;
    }
  }
  return best;
}
const ROOM_ITEM_SLIDER_RANGES = {
  widthIn: { min: 12, max: 96, step: 1 },
  heightIn: { min: 12, max: 96, step: 1 },
  heightOnWallIn: { min: 0, max: 120, step: 1 },
};
// Metric equivalents (metres) for room item dimensions; store always uses metres
const ROOM_ITEM_SLIDER_RANGES_M = {
  widthM: { min: 0.3, max: 2.44, step: 0.01 },
  heightM: { min: 0.3, max: 2.44, step: 0.01 },
  heightOnWallM: { min: 0, max: 3.05, step: 0.01 },
};

const CABINET_12D_ID = 2;
const CABINET_17D_ID = 3;
const WORKTABLE_56_ID = 1;
const LOCKER_ID = 8;
const isCabinetId = (id) => id >= 1 && id <= 22;
const baseOptionCabinetIds = [2, 3, 4, 5, 6, 7, 11];
const MIDDLE_WORKBENCH_PACKAGE_IDS = [17, 18, 19, 20, 21, 22];
const FT_TO_M = 0.3048;
const ROOM_SIZE_PRESETS = [
  { id: "20x20", label: "20 x 20", widthFt: 20, lengthFt: 20 },
  { id: "30x30", label: "30 x 30", widthFt: 30, lengthFt: 30 },
  { id: "40x40", label: "40 x 40", widthFt: 40, lengthFt: 40 },
  { id: "15x30", label: "15 x 30", widthFt: 15, lengthFt: 30 },
  { id: "20x40", label: "20 x 40", widthFt: 20, lengthFt: 40 },
  { id: "30x60", label: "30 x 60", widthFt: 30, lengthFt: 60 },
];

function normalizeDegrees(deg) {
  // Normalize to [-180, 180]
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

export default function DragonfireToolsSidebar() {
  const [activeSection, setActiveSection] = useState(null);
  const [activeTab, setActiveTab] = useState("cabinet");
  const [roomPresetId, setRoomPresetId] = useState("");
  const { openFullTutorial, openTopicByStepId } = useDragonfireTutorial();
  const selectedPlacedIndex = useDragNDropStore(
    (state) => state.selectedPlacedIndex,
  );
  const selectedDeckItem = useDragNDropStore(
    (state) => state.selectedDeckItem,
  );
  const placedPositions = useDragNDropStore((state) => state.placedPositions);
  // const roomWidth = useAnimationStore((state) => state.roomWidth) || 10;
  // const roomLength = useAnimationStore((state) => state.roomLength) || 10;
  // const roomHeight = useAnimationStore((state) => state.roomHeight) || 2.5;
  const measurementUnits =
    useAnimationStore((state) => state.measurementUnits) || "in";
  const wallHeightValues = useAnimationStore((state) => state.wallHeightValues);
  const wallWidthValues = useAnimationStore((state) => state.wallWidthValues);
  const selectedWallName = useAnimationStore((state) => state.selectedWallName);
  const selectedWallHeightValue = useAnimationStore(
    (state) => state.selectedWallHeightValue,
  );
  const selectedWallWidthValue = useAnimationStore(
    (state) => state.selectedWallWidthValue,
  );
  const disabledWallValues = useAnimationStore(
    (state) => state.disabledWallValues,
  );
  const selectedWallDisabledValue = useAnimationStore(
    (state) => state.selectedWallDisabledValue,
  );
  const showFloorGrid = useAnimationStore((state) => state.showFloorGrid);
  const showDimensionLines = useAnimationStore(
    (state) => state.showDimensionLines,
  );
  const dimensionUnits = useAnimationStore((state) => state.dimensionUnits);
  const dimensionLabelFontSize = useAnimationStore(
    (state) => state.dimensionLabelFontSize ?? 24,
  );

  const unitSystem = useAnimationStore((state) => state.unitSystem);
  const floorMaterialId =
    useAnimationStore((state) => state.floorMaterialId) ?? DEFAULT_FLOOR_MATERIAL_ID;
  const showScaleCharacter =
    useAnimationStore((state) => state.showScaleCharacter) ?? false;

  // Inform the 3D canvas about whether the sidebar content panel is expanded.
  // This lets the NavCube shift away when the panel is open.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("dragonfire-tools-panel-open", {
        detail: { open: activeSection != null },
      }),
    );
  }, [activeSection]);

  const floorMaterialOptions = useMemo(() => {
    const opts = {};
    Object.entries(FLOOR_MATERIALS).forEach(([id, { label }]) => {
      opts[label] = id;
    });
    return opts;
  }, []);

  const handleApplyToAllWalls = () => {
    const state = useAnimationStore.getState();
    const wall = state.selectedWallName;
    if (!wall) return;
    const height = state.wallHeightValues?.[wall] ?? 3.048;
    const width = state.wallWidthValues?.[wall] ?? 7.3152;
    const disabled = state.disabledWallValues?.[wall] ?? false;
    useAnimationStore.setState({
      wallHeightValues: {
        ...state.wallHeightValues,
        front: height,
        back: height,
        left: height,
        right: height,
      },
      wallWidthValues: {
        ...state.wallWidthValues,
        front: width,
        back: width,
        left: width,
        right: width,
      },
      disabledWallValues: {
        ...state.disabledWallValues,
        front: disabled,
        back: disabled,
        left: disabled,
        right: disabled,
      },
    });
  };

  const handleApplyRoomSizePreset = ({ widthFt, lengthFt }) => {
    const state = useAnimationStore.getState();
    const nextWidthM = widthFt * FT_TO_M;
    const nextLengthM = lengthFt * FT_TO_M;
    const selected = state.selectedWallName || "back";
    const nextWallWidthValues = {
      ...state.wallWidthValues,
      left: nextWidthM,
      right: nextWidthM,
      front: nextLengthM,
      back: nextLengthM,
    };

    useAnimationStore.setState({
      wallWidthValues: nextWallWidthValues,
      selectedWallWidthValue: nextWallWidthValues[selected] ?? nextLengthM,
    });
  };

  const handleRoomPresetChange = (e) => {
    const nextPresetId = e.target.value;
    setRoomPresetId(nextPresetId);
    const preset = ROOM_SIZE_PRESETS.find((item) => item.id === nextPresetId);
    if (!preset) return;
    handleApplyRoomSizePreset(preset);
  };

  const sidebarData = {
    unitSystem: {
      name: "unitSystem",
      label: "Units",
      type: "select",
      defaultValue: "imperial",
      currentValue: unitSystem ?? "imperial",
      // Keys = display labels; values = stored in store (used by sync)
      options: {
        "Imperial (in)": "imperial",
        "Metric (mm)": "metric",
      },
    },
    measurementUnits: {
      name: "measurementUnits",
      label: "Measurement Units",
      type: "select",
      defaultValue: "in",
      currentValue: measurementUnits,
      options: {
        m: "m",
        ft: "ft",
        in: "in",
      },
    },
    selectedWallHeightValue: {
      name: "selectedWallHeightValue",
      label: `Selected Wall Height (${measurementUnits})`,
      type: "range",
      defaultValue: 3.048,
      currentValue:
        (wallHeightValues && wallHeightValues[selectedWallName]) || 3.048,
      step: 0.01,
      min: 1,
      max: 5,
      measurementUnits: measurementUnits,
    },
    selectedWallWidthValue: {
      name: "selectedWallWidthValue",
      label: `Selected Wall Width (${measurementUnits})`,
      type: "range",
      defaultValue: 7.3152,
      currentValue:
        (wallWidthValues && wallWidthValues[selectedWallName]) || 7.3152,
      step: 0.01,
      min: 1,
      max: 20,
      measurementUnits: measurementUnits,
    },
    disableWall: {
      type: "boolean",
      collapsible: true,
      name: "selectedWallDisabledValue",
      label: "Disable Wall",
      // tooltip: "Disable Wall",
      defaultValue: false,
      currentValue:
        (disabledWallValues && disabledWallValues[selectedWallName]) || false,
    },
    applyToAllWalls: {
      type: "button",
      label: "Apply to all walls",
      text: "Apply to all walls",
      defaultValue: handleApplyToAllWalls,
    },
    dimensionUnits: {
      name: "dimensionUnits",
      label: "Dimension line unit",
      type: "select",
      defaultValue: "in",
      currentValue: dimensionUnits ?? "in",
      options: {
        mm: "mm",
        inches: "in",
        feet: "ft",
      },
    },
    dimensionLabelFontSize: {
      name: "dimensionLabelFontSize",
      label: "Dimension label font size (px)",
      type: "range",
      defaultValue: 24,
      currentValue: dimensionLabelFontSize ?? 24,
      step: 1,
      min: 8,
      max: 72,
    },
    showFloorGrid: {
      type: "boolean",
      name: "showFloorGrid",
      label: "Show Floor Grid",
      defaultValue: true,
      currentValue: showFloorGrid !== false,
    },

    toggleDimensionLinesButton: {
      type: "button",
      label: "Dimension lines",
      text:
        showDimensionLines !== false
          ? "Hide dimension lines"
          : "Show dimension lines",
      defaultValue: () => {
        const current = useAnimationStore.getState().showDimensionLines;
        useAnimationStore.setState({ showDimensionLines: !current });
      },
    },
    floorMaterial: {
      name: "floorMaterialId",
      label: "Floor material",
      type: "select",
      defaultValue: DEFAULT_FLOOR_MATERIAL_ID,
      currentValue: floorMaterialId,
      options: floorMaterialOptions,
    },

    // roomWidth: {
    //   name: "roomWidth",
    //   label: "Room Width (m)",
    //   type: "range",
    //   defaultValue: 10,
    //   currentValue: roomWidth,
    //   step: 0.01,
    //   min: 1,
    //   max: 20,
    // },
    // roomLength: {
    //   name: "roomLength",
    //   label: "Room Length (m)",
    //   type: "range",
    //   defaultValue: 10,
    //   currentValue: roomLength,
    //   step: 0.01,
    //   min: 1,
    //   max: 20,
    // },
  };

  const sectionData = {
    units: {
      unitSystem: sidebarData.unitSystem,
      measurementUnits: sidebarData.measurementUnits,
      dimensionUnits: sidebarData.dimensionUnits,
      dimensionLabelFontSize: sidebarData.dimensionLabelFontSize,
      toggleDimensionLinesButton: sidebarData.toggleDimensionLinesButton,
      showFloorGrid: sidebarData.showFloorGrid,

    },
    walls: {
      selectedWallHeightValue: sidebarData.selectedWallHeightValue,
      selectedWallWidthValue: sidebarData.selectedWallWidthValue,
      disableWall: sidebarData.disableWall,
      applyToAllWalls: sidebarData.applyToAllWalls,
    },
    floor: {
      floorMaterial: sidebarData.floorMaterial,
    },
  };

  // Set default value for box type (default units: imperial / inches)
  useEffect(() => {
    useAnimationStore.setState({
      unitSystem: "imperial",
      measurementUnits: "in",
      dimensionUnits: "in",
      selectedWallName: "back",
      wallHeightValues: {
        left: 3.048,
        right: 3.048,
        front: 3.048,
        back: 3.048,
        floor: 0,
        ceiling: 5,
      },
      wallWidthValues: {
        left: 7.3152,
        right: 7.3152,
        front: 9.144,
        back: 9.144,
        floor: 0,
        ceiling: 5,
      },
      disabledWallValues: {
        left: false,
        right: false,
        front: false,
        back: false,
        floor: false,
        ceiling: false,
      },
      selectedWallHeightValue: 3.048,
      selectedWallWidthValue: 9.144,
      showFloorGrid: false,
      showDimensionLines: true,
      dimensionLabelFontSize: 24,
      dimensionLabelBackgroundColor: "#ffffff",
      dimensionLabelTextColor: "#000000",
      materialScheme: "Matte",
      floorMaterialId: DEFAULT_FLOOR_MATERIAL_ID,
      floorTextureTileX: 8,
      floorTextureTileY: 8,
      floorDisplacementScale: 0.1,
      showScaleCharacter: false,
    });
  }, []);

  useEffect(() => {
    const tiles = getFloorMaterialDefaultTextureTiles(floorMaterialId);
    if (tiles) {
      useAnimationStore.setState({
        floorTextureTileX: tiles.x,
        floorTextureTileY: tiles.y,
      });
    } else {
      useAnimationStore.setState({
        floorTextureTileX: 8,
        floorTextureTileY: 8,
      });
    }
  }, [floorMaterialId]);

  // Sync Units dropdown to dimension lines and wall units as soon as unitSystem changes
  useEffect(() => {
    let prevUnitSystem = useAnimationStore.getState().unitSystem;
    const unsub = useAnimationStore.subscribe(() => {
      const u = useAnimationStore.getState().unitSystem;
      if (u === prevUnitSystem) return;
      prevUnitSystem = u;
      if (u === "imperial") {
        useAnimationStore.setState({ dimensionUnits: "in", measurementUnits: "in" });
      } else if (u === "metric") {
        useAnimationStore.setState({ dimensionUnits: "mm", measurementUnits: "m" });
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (wallHeightValues && selectedWallName) {
      useAnimationStore.setState({
        selectedWallHeightValue: wallHeightValues[selectedWallName],
      });
    }
  }, [selectedWallName, wallHeightValues]);

  useEffect(() => {
    if (wallWidthValues && selectedWallName) {
      useAnimationStore.setState({
        selectedWallWidthValue: wallWidthValues[selectedWallName],
      });
    }
  }, [selectedWallName, wallWidthValues]);

  useEffect(() => {
    if (disabledWallValues && selectedWallName) {
      useAnimationStore.setState({
        selectedWallDisabledValue: disabledWallValues[selectedWallName],
      });
    }
  }, [selectedWallName, disabledWallValues]);

  useEffect(() => {
    if (
      wallHeightValues &&
      selectedWallName &&
      selectedWallHeightValue !== undefined
    ) {
      const tempWallHeightValues = { ...wallHeightValues };
      tempWallHeightValues[selectedWallName] = selectedWallHeightValue;
      useAnimationStore.setState({
        wallHeightValues: tempWallHeightValues,
      });
    }
  }, [selectedWallHeightValue]);

  useEffect(() => {
    if (
      wallWidthValues &&
      selectedWallName &&
      selectedWallWidthValue !== undefined
    ) {
      const tempWallWidthValues = { ...wallWidthValues };
      tempWallWidthValues[selectedWallName] = selectedWallWidthValue;
      useAnimationStore.setState({
        wallWidthValues: tempWallWidthValues,
      });
    }
  }, [selectedWallWidthValue]);

  useEffect(() => {
    if (
      disabledWallValues &&
      selectedWallName &&
      selectedWallDisabledValue !== undefined
    ) {
      const tempDisabledWallValues = { ...disabledWallValues };
      tempDisabledWallValues[selectedWallName] = selectedWallDisabledValue;
      useAnimationStore.setState({
        disabledWallValues: tempDisabledWallValues,
      });
    }
  }, [selectedWallDisabledValue]);

  // Open Cabinet options when user selects a placed cabinet
  useEffect(() => {
    if (selectedPlacedIndex == null) return;
    const placement = placedPositions[selectedPlacedIndex];
    if (!placement) return;
    if (placement.cabinetId === SCALE_REFERENCE_ID) {
      setActiveSection("scale");
      return;
    }
    setActiveSection("items");
  }, [selectedPlacedIndex, placedPositions]);

  // Open Cabinet / Room item options when user drags a new item from the deck
  useEffect(() => {
    if (!selectedDeckItem) return;
    if (selectedDeckItem.id === SCALE_REFERENCE_ID) return;
    setActiveSection("items");
  }, [selectedDeckItem]);

  const placement =
    selectedPlacedIndex != null
      ? placedPositions[selectedPlacedIndex]
      : null;
  const isCabinet = placement && isCabinetId(placement.cabinetId);
  const is12Drawer = placement?.cabinetId === CABINET_12D_ID;
  const is17D = placement?.cabinetId === CABINET_17D_ID;
  const is24Drawer = placement?.cabinetId === 4;
  const is18Drawer = placement?.cabinetId === 5;
  const is20Drawer = placement?.cabinetId === 6;
  const is30Drawer = placement?.cabinetId === 7;
  const isLocker = placement?.cabinetId === LOCKER_ID;
  const is6Drawer = placement?.cabinetId === 9;
  const is11Drawer = placement?.cabinetId === 10;
  const isLowerCorner = placement?.cabinetId === 11;
  const isUpperCorner = placement?.cabinetId === 12;
  const isWallCabinet = placement?.cabinetId === 13;
  const is3WallCabinets = placement?.cabinetId === 14;
  const is4WallCabinets = placement?.cabinetId === 15;
  const is56Worktable = placement?.cabinetId === WORKTABLE_56_ID;
  const is56WorktablePackage = placement?.cabinetId === 16;
  const isCabinetPackageSelected = Boolean(
    placement && reverseIdMap[placement.cabinetId]?.isCabinetPackage,
  );

  const hasMiddleWorkbenchFeetOption =
    isCabinetPackageSelected &&
    MIDDLE_WORKBENCH_PACKAGE_IDS.includes(placement?.cabinetId);
  /** Locker, 6D, 11D, 12D, 17D, 24D, 18D, 20D, 30D, Lower/Upper Corner, Wall Cabinet, 3/4 Wall share the same colour options. */
  const showLockerColorPicker =
    isLocker ||
    is6Drawer ||
    is11Drawer ||
    is12Drawer ||
    is17D ||
    is24Drawer ||
    is18Drawer ||
    is20Drawer ||
    is30Drawer ||
    isLowerCorner ||
    isUpperCorner ||
    isWallCabinet ||
    is3WallCabinets ||
    is4WallCabinets ||
    isCabinetPackageSelected;
  const showBase =
    placement && baseOptionCabinetIds.includes(placement.cabinetId);
  const canRotateCabinet =
    isCabinet && reverseIdMap[placement?.cabinetId]?.itemType !== "wall";
  const selectedColor = placement?.lockerColor ?? DEFAULT_LOCKER_COLOR;

  const handleCabinetBacksplashChange = (e) => {
    if (selectedPlacedIndex == null || !placement) return;
    const next = [...placedPositions];
    next[selectedPlacedIndex] = {
      ...placement,
      backsplash: e.target.checked,
    };
    useDragNDropStore.setState({ placedPositions: next });
  };

  const handleCabinetBaseOptionChange = (e) => {
    const value = e.target.value;
    if (
      value !== "none" &&
      value !== "wheel" &&
      value !== "riser" &&
      value !== "riserLowProfile"
    )
      return;
    if (selectedPlacedIndex == null || !placement) return;
    const next = [...placedPositions];
    next[selectedPlacedIndex] = { ...placement, baseOption: value };
    useDragNDropStore.setState({ placedPositions: next });
  };

  const setCabinetRotationDeg = (deg) => {
    if (selectedPlacedIndex == null || !placement) return;
    const rotY = (deg * Math.PI) / 180;
    const next = [...placedPositions];
    next[selectedPlacedIndex] = {
      ...placement,
      dragPointNormal: {
        x: Math.sin(rotY),
        y: 0,
        z: Math.cos(rotY),
      },
    };
    useDragNDropStore.setState({ placedPositions: next });
  };

  const currentCabinetRotDeg = normalizeDegrees(
    placement?.dragPointNormal
      ? (Math.atan2(
        placement.dragPointNormal.x,
        placement.dragPointNormal.z,
      ) *
        180) /
      Math.PI
      : 0,
  );
  const rotationSliderMinDeg = 0;
  const rotationSliderMaxDeg = 360;
  const rotationSliderStepDeg = 10;
  const rotationDropdownMinDeg = 0;
  const rotationDropdownMaxDeg = 180;
  const rotationDropdownStepDeg = 15;

  // Dropdown is 0..180 only. Map any negative angle to its positive equivalent.
  const rotationDropdownDeg = Math.max(
    rotationDropdownMinDeg,
    Math.min(
      rotationDropdownMaxDeg,
      Math.round(Math.abs(currentCabinetRotDeg) / rotationDropdownStepDeg) *
      rotationDropdownStepDeg,
    ),
  );
  // Slider is 0..360 only. Convert normalized [-180..180] to [0..360).
  const currentCabinetRotDeg360 = (currentCabinetRotDeg + 360) % 360;
  const rotationSliderDeg = Math.max(
    rotationSliderMinDeg,
    Math.min(
      rotationSliderMaxDeg,
      Math.round(currentCabinetRotDeg360 / rotationSliderStepDeg) *
      rotationSliderStepDeg,
    ),
  );

  const rotationDropdownOptions = Array.from(
    {
      length:
        (rotationDropdownMaxDeg - rotationDropdownMinDeg) /
        rotationDropdownStepDeg +
        1,
    },
    (_, i) => rotationDropdownMinDeg + i * rotationDropdownStepDeg,
  );

  const handleCabinetBottomColorChange = (e) => {
    const value = e.target.value;
    if (value !== "gunmetal" && value !== "black" && value !== "glossBlack")
      return;
    if (selectedPlacedIndex == null || !placement) return;
    const next = [...placedPositions];
    next[selectedPlacedIndex] = { ...placement, bottomColor: value };
    useDragNDropStore.setState({ placedPositions: next });
  };

  const handle56WorktableLegsToggle = (e) => {
    if (selectedPlacedIndex == null || !placement || !is56Worktable) return;
    const next = [...placedPositions];
    next[selectedPlacedIndex] = {
      ...placement,
      baseOption: e.target.checked ? "smallLegs" : "none",
    };
    useDragNDropStore.setState({ placedPositions: next });
  };

  const handle56WorktablePackageLegsToggle = (e) => {
    if (selectedPlacedIndex == null || !placement || !is56WorktablePackage)
      return;
    const next = [...placedPositions];
    next[selectedPlacedIndex] = {
      ...placement,
      baseOption: e.target.checked ? "smallLegs" : "none",
    };
    useDragNDropStore.setState({ placedPositions: next });
  };

  const handleLockerColorChange = (e) => {
    const value = e.target.value;
    const valid = LOCKER_COLOR_OPTIONS.some((o) => o.value === value);
    if (!valid || selectedPlacedIndex == null || !placement) return;
    const next = [...placedPositions];
    next[selectedPlacedIndex] = { ...placement, lockerColor: value };
    useDragNDropStore.setState({ placedPositions: next });
  };

  const handleCabinetDelete = () => {
    if (selectedPlacedIndex == null) return;
    const next = placedPositions.filter((_, i) => i !== selectedPlacedIndex);
    useDragNDropStore.setState({
      placedPositions: next,
      selectedPlacedIndex: null,
      activeSceneItem: null,
    });
  };

  const handlePackageWorkbenchFeetChange = (e) => {
    const value = e.target.value;
    if (value !== "riser" && value !== "riserLowProfile") return;
    if (selectedPlacedIndex == null || !placement) return;
    const next = [...placedPositions];
    next[selectedPlacedIndex] = { ...placement, packageWorkbenchFeetOption: value };
    useDragNDropStore.setState({ placedPositions: next });
  };

  const handleZoomSelectedItem = () => {
    if (!placement) return;
    const meta = reverseIdMap[placement.cabinetId];
    if (!meta) return;
    window.dispatchEvent(
      new CustomEvent("dragonfire-tools-zoom-to-item", {
        detail: { placement, meta },
      }),
    );
  };

  const handleResetRoom = () => {
    const ok = window.confirm("Reset room? This will delete all items.");
    if (!ok) return;

    clearScaleCharacterPlacementCache();
    useDragNDropStore.setState({
      placedPositions: [],
      selectedPlacedIndex: null,
      activeSceneItem: null,
      selectedDeckItem: null,
      selectedDragItem: null,
      draggedCabinetIndex: null,
      isFloorDragEnabled: false,
      isWallDragEnabled: false,
      isOrbitControlsEnabled: true,
      floorDragPosition: { x: 0, y: 0, z: 0 },
      floorPoint: {
        x: 10000000000000,
        y: 10000000000000,
        z: 10000000000000,
      },
    });

    setActiveSection(null);
  };

  const isRoomItem =
    placement && ROOM_ITEM_IDS.includes(placement.cabinetId);
  const isRoomItemForPanel = placement
    ? isRoomItem
    : selectedDeckItem
      ? ROOM_ITEM_IDS.includes(selectedDeckItem.id)
      : false;
  const roomItemMeta = placement ? reverseIdMap[placement.cabinetId] : null;
  const roomItemDefaultBox =
    roomItemMeta?.boundingBox || { width: 1, height: 1, depth: 0.3 };
  const roomItemWidthM =
    placement?.roomItemWidth ?? roomItemDefaultBox.width;
  const roomItemHeightM =
    placement?.roomItemHeight ?? roomItemDefaultBox.height;
  const isTV = placement?.cabinetId === TV_ID;
  const isDoor = placement?.cabinetId === 101;
  const roomItemDefaultY = isDoor
    ? roomItemDefaultBox.height / 2
    : (placement?.position?.y ?? 1.2);
  const roomItemYM =
    placement?.roomItemY ?? placement?.position?.y ?? roomItemDefaultY;
  const tvSizeInches =
    placement?.tvSizeInches ??
    (isTV ? closestTvSizeInches(roomItemWidthM, roomItemHeightM) : 55);
  const roomItemWidthIn = Math.round(mToIn(roomItemWidthM) * 10) / 10;
  const roomItemHeightIn = Math.round(mToIn(roomItemHeightM) * 10) / 10;
  const roomItemHeightOnWallIn = Math.round(mToIn(roomItemYM) * 10) / 10;
  const isMetric = unitSystem === "metric";
  const dimUnit = isMetric ? "m" : "in";
  const roomItemWidthDisplay = isMetric
    ? Math.round(roomItemWidthM * 100) / 100
    : roomItemWidthIn;
  const roomItemHeightDisplay = isMetric
    ? Math.round(roomItemHeightM * 100) / 100
    : roomItemHeightIn;
  const roomItemHeightOnWallDisplay = isMetric
    ? Math.round(roomItemYM * 100) / 100
    : roomItemHeightOnWallIn;
  const widthRange = isMetric ? ROOM_ITEM_SLIDER_RANGES_M.widthM : ROOM_ITEM_SLIDER_RANGES.widthIn;
  const heightRange = isMetric ? ROOM_ITEM_SLIDER_RANGES_M.heightM : ROOM_ITEM_SLIDER_RANGES.heightIn;
  const heightOnWallRange = isMetric
    ? ROOM_ITEM_SLIDER_RANGES_M.heightOnWallM
    : ROOM_ITEM_SLIDER_RANGES.heightOnWallIn;

  const updateRoomItem = (updates) => {
    if (selectedPlacedIndex == null || !placement) return;
    const next = [...placedPositions];
    const merged = { ...placement, ...updates };
    // Keep legacy position-based readers in sync with the canonical roomItemY value.
    if (Object.prototype.hasOwnProperty.call(updates, "roomItemY")) {
      merged.position = {
        ...(placement.position || { x: 0, y: 0, z: 0 }),
        y: updates.roomItemY,
      };
    }
    next[selectedPlacedIndex] = merged;
    useDragNDropStore.setState({ placedPositions: next });
  };

  const handleRoomItemWidthSlider = (e) => {
    const val = Number(e.target.value);
    updateRoomItem({
      roomItemWidth: isMetric ? val : inToM(val),
    });
  };
  const handleRoomItemWidthInput = (e) => {
    const val = Number(e.target.value);
    if (Number.isNaN(val)) return;
    const clamped = Math.max(
      widthRange.min,
      Math.min(widthRange.max, val),
    );
    updateRoomItem({
      roomItemWidth: isMetric ? clamped : inToM(clamped),
    });
  };
  const handleRoomItemHeightSlider = (e) => {
    const val = Number(e.target.value);
    const newHeightM = isMetric ? val : inToM(val);
    const updates = { roomItemHeight: newHeightM };
    if (isDoor) updates.roomItemY = newHeightM / 2;
    updateRoomItem(updates);
  };
  const handleRoomItemHeightInput = (e) => {
    const val = Number(e.target.value);
    if (Number.isNaN(val)) return;
    const clamped = Math.max(
      heightRange.min,
      Math.min(heightRange.max, val),
    );
    const newHeightM = isMetric ? clamped : inToM(clamped);
    const next = { ...placement, roomItemHeight: newHeightM };
    if (isDoor) next.roomItemY = newHeightM / 2;
    const arr = [...placedPositions];
    arr[selectedPlacedIndex] = next;
    useDragNDropStore.setState({ placedPositions: arr });
  };
  const handleTvSizeChange = (e) => {
    const inches = Number(e.target.value);
    const { width, height } = tvDiagonalInchesToWidthHeightM(inches);
    updateRoomItem({
      roomItemWidth: width,
      roomItemHeight: height,
      tvSizeInches: inches,
    });
  };
  const handleRoomItemHeightOnWallSlider = (e) => {
    const val = Number(e.target.value);
    updateRoomItem({
      roomItemY: isMetric ? val : inToM(val),
    });
  };
  const handleRoomItemHeightOnWallInput = (e) => {
    const val = Number(e.target.value);
    if (Number.isNaN(val)) return;
    const clamped = Math.max(
      heightOnWallRange.min,
      Math.min(heightOnWallRange.max, val),
    );
    updateRoomItem({
      roomItemY: isMetric ? clamped : inToM(clamped),
    });
  };
  const handleRoomItemDelete = () => {
    if (selectedPlacedIndex == null) return;
    const next = placedPositions.filter((_, i) => i !== selectedPlacedIndex);
    useDragNDropStore.setState({
      placedPositions: next,
      selectedPlacedIndex: null,
      activeSceneItem: null,
    });
  };
  const handleShowScaleCharacterToggle = (e) => {
    const nextVisible = e.target.checked;
    useAnimationStore.setState({ showScaleCharacter: nextVisible });
    syncScaleCharacterPlacements(nextVisible);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbarWrapper}>
        <div className={styles.toolbarContainer}>
          {TOOLBAR_SECTIONS.map(({ id, label, icon: Icon }, index) => (
            <button
              key={id}
              type="button"
              className={`${styles.toolBtn} ${activeSection === id ? styles.toolBtnActive : ""}`}
              title={label}
              onClick={() =>
                setActiveSection((prev) => (prev === id ? null : id))
              }
            >
              <span className={styles.iconWrapper}>
                {typeof Icon === "string" ? (
                  <img src={Icon} alt={label} />
                ) : (
                  <Icon />
                )}
              </span>

            </button>
          ))}

          {/* Reset button */}
          <button
            type="button"
            className={`${styles.toolBtn} ${styles.resetBtn}`}
            onClick={handleResetRoom}
            title="Reset"
          >
            <FaTrash size={22} aria-hidden />
          </button>
        </div>
        {activeSection && activeSection !== "config" && (
          <div className={styles.sectionPanel}>
            <button
              type="button"
              className={styles.panelCloseButton}
              onClick={() => setActiveSection(null)}
              aria-label="Close panel"
            >
              <FaTimes size={18} aria-hidden />
            </button>
            <div className={styles.sectionPanelHeader}>
              <h2 className={styles.sectionPanelHeading}>
                {TOOLBAR_SECTIONS.find((s) => s.id === activeSection)?.label ??
                  activeSection}
              </h2>
            </div>
            <div className={styles.sidebarInner}>
              <div className={styles.panelContent}>
                {activeSection === "items" ? (
                  isRoomItemForPanel ? (
                    <div className={`${styles.roomItemOptionPanel} ${styles.panelSection}`}>

                      {isRoomItem && roomItemMeta && (
                        <p className={styles.selectionContext} aria-live="polite">
                          Editing: {roomItemMeta.label}
                        </p>
                      )}
                      <p className={styles.cabinetOptionTitle}>
                        {roomItemMeta?.label ?? "Room item"} — dimensions
                      </p>
                      {isRoomItem ? (
                        <>
                          {isTV ? (
                            <div className={styles.roomItemOptionRow}>
                              <span className={styles.cabinetOptionLabel}>
                                Size (diagonal)
                              </span>
                              <select
                                value={tvSizeInches}
                                onChange={handleTvSizeChange}
                                className={styles.cabinetOptionSelect}
                              >
                                {TV_SIZE_INCHES.map((size) => (
                                  <option key={size} value={size}>
                                    {size} inch
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <>
                              <div className={styles.roomItemOptionRow}>
                                <span className={styles.cabinetOptionLabel}>
                                  Length ({dimUnit})
                                </span>
                                <input
                                  type="number"
                                  min={widthRange.min}
                                  max={widthRange.max}
                                  value={roomItemWidthDisplay}
                                  onChange={handleRoomItemWidthInput}
                                  className={styles.roomItemNumberInput}
                                  step={isMetric ? 0.01 : 0.5}
                                />
                              </div>
                              <div className={styles.roomItemRangeControl}>
                                <div className={styles.roomItemOptionRow}>
                                  <span
                                    className={styles.cabinetOptionLabel}
                                    style={{ visibility: "hidden" }}
                                  >
                                    Length ({dimUnit})
                                  </span>
                                  <input
                                    type="range"
                                    min={widthRange.min}
                                    max={widthRange.max}
                                    step={widthRange.step}
                                    value={Math.max(
                                      widthRange.min,
                                      Math.min(
                                        widthRange.max,
                                        roomItemWidthDisplay,
                                      ),
                                    )}
                                    onChange={handleRoomItemWidthSlider}
                                    className={styles.roomItemSlider}
                                  />
                                </div>
                              </div>
                              <div className={styles.roomItemOptionRow}>
                                <span className={styles.cabinetOptionLabel}>
                                  Height ({dimUnit})
                                </span>
                                <input
                                  type="number"
                                  min={heightRange.min}
                                  max={heightRange.max}
                                  value={roomItemHeightDisplay}
                                  onChange={handleRoomItemHeightInput}
                                  className={styles.roomItemNumberInput}
                                  step={isMetric ? 0.01 : 0.5}
                                />
                              </div>
                              <div className={styles.roomItemRangeControl}>
                                <div className={styles.roomItemOptionRow}>
                                  <span
                                    className={styles.cabinetOptionLabel}
                                    style={{ visibility: "hidden" }}
                                  >
                                    Height ({dimUnit})
                                  </span>
                                  <input
                                    type="range"
                                    min={heightRange.min}
                                    max={heightRange.max}
                                    step={heightRange.step}
                                    value={Math.max(
                                      heightRange.min,
                                      Math.min(
                                        heightRange.max,
                                        roomItemHeightDisplay,
                                      ),
                                    )}
                                    onChange={handleRoomItemHeightSlider}
                                    className={styles.roomItemSlider}
                                  />
                                </div>
                              </div>
                            </>
                          )}
                          <div className={styles.roomItemOptionRow}>
                            <span className={styles.cabinetOptionLabel}>
                              Height on wall ({dimUnit})
                            </span>
                            <input
                              type="number"
                              min={heightOnWallRange.min}
                              max={heightOnWallRange.max}
                              value={roomItemHeightOnWallDisplay}
                              onChange={handleRoomItemHeightOnWallInput}
                              className={styles.roomItemNumberInput}
                              step={isMetric ? 0.01 : 0.5}
                              disabled={isDoor}
                              title={isDoor ? "Door is fixed to floor" : undefined}
                            />
                          </div>
                          <div className={styles.roomItemRangeControl}>
                            <div className={styles.roomItemOptionRow}>
                              <span
                                className={styles.cabinetOptionLabel}
                                style={{ visibility: "hidden" }}
                              >
                                Height on wall ({dimUnit})
                              </span>
                              <input
                                type="range"
                                min={heightOnWallRange.min}
                                max={heightOnWallRange.max}
                                step={heightOnWallRange.step}
                                value={Math.max(
                                  heightOnWallRange.min,
                                  Math.min(
                                    heightOnWallRange.max,
                                    roomItemHeightOnWallDisplay,
                                  ),
                                )}
                                onChange={handleRoomItemHeightOnWallSlider}
                                className={styles.roomItemSlider}
                                disabled={isDoor}
                              />
                            </div>
                          </div>
                          {isDoor && (
                            <p className={styles.roomItemHint}>
                              Door base stays on floor.
                            </p>
                          )}
                          <button
                            type="button"
                            className={styles.cabinetOptionZoomButton}
                            onClick={handleZoomSelectedItem}
                          >
                            Zoom
                          </button>
                          <button
                            type="button"
                            className={styles.cabinetOptionDeleteButton}
                            data-dragonfire-tutorial="remove-from-scene"
                            onClick={handleRoomItemDelete}
                          >
                            Remove from scene (Del)
                          </button>
                        </>
                      ) : (
                        <>
                          <p className={styles.cabinetOptionText}>
                            Select a room item (TV, Door, Window) in the room to edit
                            its dimensions.
                          </p>
                          <p className={styles.emptyStateHint}>
                            Click a TV, door, or window in the room to edit its size
                            and position.
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className={styles.cabinetOptionPanel}>
                      {placement && (
                        <p className={styles.selectionContext}>
                          Editing: {reverseIdMap[placement.cabinetId]?.label}
                        </p>
                      )}
                      {/* HEADER TABS */}
                      <div className={styles.cabinetTabs}>
                        <button
                          className={`${styles.tabBtn} ${activeTab === "cabinet" ? styles.activeTab : ""}`}
                          onClick={() => setActiveTab("cabinet")}
                        >
                          Cabinet options
                        </button>

                        <button
                          className={`${styles.tabBtn} ${activeTab === "view" ? styles.activeTab : ""}`}
                          onClick={() => setActiveTab("view")}
                        >
                          View options
                        </button>

                      </div>
                      {/* TAB CONTENT */}
                      {activeTab === "cabinet" && (
                        <>
                          {isRoomItem && roomItemMeta && (
                            <p className={styles.selectionContext} aria-live="polite">
                              Editing: {roomItemMeta.label}
                            </p>
                          )}
                          {/* PROPERTIES */}
                          <div className={styles.sectionBlock}>
                            <h4 className={styles.sectionTitle}>Properties</h4>

                            <label className={styles.toggleRow}>
                              <span>Backsplash</span>
                              <input
                                type="checkbox"
                                checked={placement?.backsplash !== false}
                                onChange={handleCabinetBacksplashChange}
                              />
                            </label>

                            {is56Worktable && (
                              <label className={styles.toggleRow}>
                                <span>Legs</span>
                                <input
                                  type="checkbox"
                                  checked={(placement?.baseOption ?? "smallLegs") !== "none"}
                                  onChange={handle56WorktableLegsToggle}
                                />
                              </label>
                            )}
                            {is56WorktablePackage && (
                              <label className={styles.toggleRow}>
                                <span>Legs</span>
                                <input
                                  type="checkbox"
                                  checked={(placement?.baseOption ?? "smallLegs") !== "none"}
                                  onChange={handle56WorktablePackageLegsToggle}
                                />
                              </label>
                            )}
                            {showBase && (
                              <div className={styles.cabinetOptionRow}>
                                <span className={styles.cabinetOptionLabel}>Base</span>
                                <select
                                  value={placement.baseOption ?? "none"}
                                  onChange={handleCabinetBaseOptionChange}
                                  className={styles.cabinetOptionSelect}
                                >
                                  <option value="none">None</option>
                                  <option value="wheel">Wheel</option>
                                  <option value="riser">Leveling feet</option>
                                  <option value="riserLowProfile">
                                    Leveling feet low profile
                                  </option>
                                </select>
                              </div>
                            )}
                          </div>
                          {hasMiddleWorkbenchFeetOption && (
                            <div
                              className={`${styles.cabinetOptionRow} ${styles.packageFeetOptionRow}`}
                            >
                              <span className={styles.cabinetOptionLabel}>
                                Middle workbench feet
                              </span>
                              <select
                                value={placement.packageWorkbenchFeetOption ?? "riser"}
                                onChange={handlePackageWorkbenchFeetChange}
                                className={styles.cabinetOptionSelect}
                              >
                                <option value="riserLowProfile">
                                  Low feet profile
                                </option>
                                <option value="riser">Standard feet</option>
                              </select>
                            </div>
                          )}
                          {/* COLORS */}
                          {showLockerColorPicker && (
                            <div className={styles.sectionBlock}>
                              <h4 className={styles.sectionTitle}>Colors</h4>

                              <div className={styles.colorRow}>
                                {LOCKER_COLOR_OPTIONS.map((color) => {
                                  const isActive = selectedColor === color.value;

                                  return (
                                    <div
                                      key={color.value}
                                      className={`${styles.colorItem} ${isActive ? styles.activeColor : ""
                                        }`}
                                      onClick={() => handleLockerColorChange({ target: { value: color.value } })}
                                    >
                                      <div className={styles.colorBox}>
                                        <span style={{ background: color.hex }} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {is56Worktable && (
                            <div className={styles.sectionBlock}>
                              <h4 className={styles.sectionTitle}>Bottom color</h4>
                              <div className={styles.colorRow}>
                                {LOCKER_COLOR_OPTIONS.map((opt) => {
                                  const current =
                                    placement.bottomColor === "black"
                                      ? "glossBlack"
                                      : placement.bottomColor ?? "gunmetal";
                                  const active = current === opt.value;
                                  return (
                                    <div
                                      key={opt.value}
                                      className={`${styles.colorItem} ${active ? styles.activeColor : ""}`}
                                      onClick={() =>
                                        handleCabinetBottomColorChange({
                                          target: { value: opt.value },
                                        })
                                      }
                                    >
                                      <div className={styles.colorBox}>
                                        <span style={{ background: opt.hex }} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {activeTab === "view" && canRotateCabinet && (
                        <div className={styles.viewOptionsPanel}>
                          {/* CUSTOM ANGLE */}
                          <div className={styles.sectionBlock}>
                            <h4>Custom Angle</h4>

                            <div className={styles.sliderRow}>
                              <input
                                type="range"
                                min={-180}
                                max={180}
                                step={1}
                                value={currentCabinetRotDeg}
                                onChange={(e) =>
                                  setCabinetRotationDeg(Number(e.target.value))
                                }
                                className={styles.customAngleSlider}
                              />

                              <input
                                type="number"
                                value={currentCabinetRotDeg}
                                onChange={(e) =>
                                  setCabinetRotationDeg(Number(e.target.value))
                                }
                                className={styles.angleInput}
                              />
                            </div>
                          </div>

                          {/* PRESENCES */}
                          <div className={styles.viewSection}>
                            <h4>Presences</h4>

                            <div className={styles.presenceButtons}>
                              {[0, 90, 180, 270].map((deg) => (
                                <button
                                  key={deg}
                                  className={`${styles.presenceBtn} ${Math.round(currentCabinetRotDeg) === deg
                                    ? styles.activePresence
                                    : ""
                                    }`}
                                  onClick={() => setCabinetRotationDeg(deg)}
                                >
                                  {deg}°
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      {placement ? (
                        <>
                          <button
                            type="button"
                            className={styles.cabinetOptionZoomButton}
                            onClick={handleZoomSelectedItem}
                          >
                            Zoom
                          </button>
                          <button
                            type="button"
                            className={styles.cabinetOptionDeleteButton}
                            data-dragonfire-tutorial="remove-from-scene"
                            onClick={handleCabinetDelete}
                          >
                            Remove from scene (Del)
                          </button>
                        </>
                      ) : (
                        <>
                          <p className={styles.cabinetOptionText}>
                            Select a cabinet in the room to edit its options
                            (backsplash, base, color).
                          </p>
                          <p className={styles.emptyStateHint}>
                            Click a cabinet in the room to select it, then options
                            appear here.
                          </p>
                        </>
                      )}
                    </div>
                  )
                ) : activeSection === "walls" ? (
                  <div className={`${styles.wallsPanel} ${styles.panelSection}`}>
                    <div className={styles.roomPresetSection}>
                      <p className={styles.roomPresetTitle}>Room size presets</p>
                      <p className={styles.roomPresetHint}>
                        Width x Length (ft)
                      </p>
                      <Select
                        options={ROOM_SIZE_PRESETS.map((preset) => ({
                          label: preset.label,
                          value: preset.id,
                        }))}
                        value={
                          ROOM_SIZE_PRESETS.find((p) => p.id === roomPresetId)
                            ? {
                              label: ROOM_SIZE_PRESETS.find((p) => p.id === roomPresetId).label,
                              value: roomPresetId,
                            }
                            : null
                        }
                        name="roomPreset"
                        setData={(name, val) => {
                          setRoomPresetId(val);
                          const preset = ROOM_SIZE_PRESETS.find((p) => p.id === val);
                          if (preset) handleApplyRoomSizePreset(preset);
                        }}
                        className={styles.select}
                      />
                    </div>
                    <CustomSidebar
                      data={sectionData.walls}
                      customStyles={`${styles.sidebarOverride} ${styles.sidebarWhiteTheme}`}
                    />
                  </div>
                ) : activeSection === "help" ? (
                  <div className={`${styles.helpPanel}`}>

                    {/* HEADER */}
                    <div className={styles.helpHeader}>
                      <h3>Need Help?</h3>
                      <p>Open a topic to play that part of thr tutorial or replay the full.</p>
                    </div>

                    {/* MAIN BUTTON */}
                    <button
                      className={styles.helpMainBtn}
                      onClick={() => {
                        openFullTutorial();
                        setActiveSection(null);
                      }}
                    >
                      Replay full tutorial
                    </button>

                    {/* TOPICS */}
                    <div className={styles.helpTopics}>
                      {TUTORIAL_STEPS.map((step, index) => (
                        <div
                          key={step.id}
                          className={styles.helpCard}
                          onClick={() => {
                            openTopicByStepId(step.id);
                            setActiveSection(null);
                          }}
                        >
                          <div className={styles.helpCardNumber}>
                            {index + 1}
                          </div>

                          <div className={styles.helpCardText}>
                            {step.title}
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>

                ) : activeSection === "scale" ? (
                  <div className={styles.scalePanel}>

                    <label className={styles.scaleRow}>

                      <span>Show scale character</span>
                      <input
                        type="checkbox"
                        checked={showScaleCharacter}
                        onChange={handleShowScaleCharacterToggle}
                      />
                    </label>

                    <p className={styles.scaleText}>
                      This reference character is shown at room center by default.
                      You can drag it in the scene to reposition.
                    </p>
                  </div>
                ) : activeSection === "quote" ? (
                  <DragonfireQuoteSidebarPanel />
                ) : (
                  sectionData[activeSection] && (
                    <CustomSidebar
                      data={sectionData[activeSection]}
                      customStyles={`${styles.sidebarOverride} ${styles.sidebarWhiteTheme}`}
                    />
                  )
                )}
              </div>
              {/* {CUSTOM_CONTENT_SECTION_IDS.includes(activeSection) && (
              <div className={styles.sectionPanelFooter}>
                Powered by{" "}
                <img
                  className={styles.sectionPanelFooterLogo}
                  alt="Spokbee"
                  src="/logos/spokbee.png"
                />
              </div>
            )} */}
            </div>
          </div>
        )}
      </div>
      <CabinetOptionsToDrag
        isOpen={activeSection === "config"}
        onClose={() => setActiveSection(null)}
      />
    </div>
  );
}
