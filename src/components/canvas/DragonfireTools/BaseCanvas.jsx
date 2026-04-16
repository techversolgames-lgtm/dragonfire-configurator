//package imports
import { Canvas } from "@react-three/fiber";
import { useRef, useEffect, useState } from "react";
import { OrbitControls, Environment } from "@react-three/drei";
import { CameraControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

//local imports
import styles from "@/styles/canvas/BaseCanvas.module.scss";
import Lights from "./Lights";
import { NavCube } from "../NavCube";
import FloorGrid from "./FloorGrid";
import RoomModel from "./RoomModel";
import useAnimationStore from "@/stores/useAnimationStore";
import OutlinesManager from "./OutlinesManager";
import OverlapBoundingBoxes from "./OverlapBoundingBoxes";
import OverlapDebugBounds from "./OverlapDebugBounds";
import DragPlacementManager from "./DragPlacementManager";
import useDragNDropStore from "@/stores/useDragNDropStore";
import DeleteCabinetKeyboardHandler from "./DeleteCabinetKeyboardHandler";
// import InitialDummyCube from "./InitialDummyCube";
import RayReceiverFloorPlane from "./RayReceiverFloorPlane";
import RayReceiverVerticalDragPlane from "./RayReceiverVerticalDragPlane";
import CameraManager from "./CameraManager";
import GenerateAllCabinetsInScene from "./GenerateAllCabinetsInScene";
import DragMovementManager from "./DragMovementManager";
import RotationGizmo from "./RotationGizmo";
import OverlapWarningOverlay from "./OverlapWarningOverlay";
import CornerSnapPointsDebug from "./CornerSnapPointsDebug";
import SelectedItemBoundingBox from "./SelectedItemBoundingBox";
import { SelectedItemBoundsProvider } from "./SelectedItemBoundsContext";
import PlacementBlockedOverlay from "./PlacementBlockedOverlay";
import CameraZoomAnimation from "./CameraZoomAnimation";
import DragonfireScreenshotCapture from "./DragonfireScreenshotCapture";
import DragonfireToolsCameraTargetOverride from "./DragonfireToolsCameraTargetOverride";

const ENABLE_ROTATION_GIZMO = false;

const CameraTracker = () => {
  return null;
};

const BaseCanvas = () => {
  const controlsRef = useRef();

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [navCubeOrbitRadius, setNavCubeOrbitRadius] = useState(5);
  const [navCubeLeftOffsetOverride, setNavCubeLeftOffsetOverride] =
    useState(null);

  useEffect(() => {
    const handler = (e) => {
      const open = Boolean(e?.detail?.open);
      setIsPanelOpen(open);
    };

    window.addEventListener("dragonfire-tools-panel-open", handler);
    return () => {
      window.removeEventListener("dragonfire-tools-panel-open", handler);
    };
  }, []);

  useEffect(() => {
    const onSetLeftOffset = (e) => {
      const next = e?.detail?.leftOffset;
      const n = Number(next);
      if (!Number.isFinite(n)) return;
      setNavCubeLeftOffsetOverride(n);
    };

    const onResetLeftOffset = () => {
      setNavCubeLeftOffsetOverride(null);
    };

    window.addEventListener(
      "dragonfire-tools-set-navcube-leftoffset",
      onSetLeftOffset,
    );
    window.addEventListener(
      "dragonfire-tools-reset-navcube-leftoffset",
      onResetLeftOffset,
    );

    return () => {
      window.removeEventListener(
        "dragonfire-tools-set-navcube-leftoffset",
        onSetLeftOffset,
      );
      window.removeEventListener(
        "dragonfire-tools-reset-navcube-leftoffset",
        onResetLeftOffset,
      );
    };
  }, []);

  useEffect(() => {
    const onSetOrbitRadius = (e) => {
      const orbitRadius = e?.detail?.orbitRadius;
      const n = Number(orbitRadius);
      if (!Number.isFinite(n)) return;
      setNavCubeOrbitRadius(n);
    };

    const onReset = () => {
      setNavCubeOrbitRadius(5);
    };

    window.addEventListener(
      "dragonfire-tools-set-navcube-orbit-radius",
      onSetOrbitRadius,
    );
    window.addEventListener("dragonfire-tools-reset-navcube-orbit-radius", onReset);

    return () => {
      window.removeEventListener(
        "dragonfire-tools-set-navcube-orbit-radius",
        onSetOrbitRadius,
      );
      window.removeEventListener(
        "dragonfire-tools-reset-navcube-orbit-radius",
        onReset,
      );
    };
  }, []);

  const NAV_CUBE_LEFT_OFFSET_CLOSED = -30;
  const NAV_CUBE_LEFT_OFFSET_OPEN_MIN_DELTA = -280; // always shift right at least this much
  const NAV_CUBE_OPEN_PANEL_TOTAL_WIDTH_PX = 384; // toolbar(52) + content panel(332)
  const NAV_CUBE_OPEN_MARGIN_PX = 20;

  const NavCubeWithPanelOffset = ({ orbitRadius, renderPriority }) => {
    const { size } = useThree();

    const computedOpenLeftOffset =
      NAV_CUBE_OPEN_PANEL_TOTAL_WIDTH_PX + NAV_CUBE_OPEN_MARGIN_PX - (size.width / 2 - 100);

    // Keep behavior stable: cube should never shift left when panel opens.
    const computedLeftOffset = isPanelOpen
      ? Math.max(
          NAV_CUBE_LEFT_OFFSET_CLOSED + NAV_CUBE_LEFT_OFFSET_OPEN_MIN_DELTA,
          computedOpenLeftOffset,
        )
      : NAV_CUBE_LEFT_OFFSET_CLOSED;

    const leftOffset =
      navCubeLeftOffsetOverride != null
        ? navCubeLeftOffsetOverride
        : computedLeftOffset;

    return (
      <NavCube
        controlsRef={controlsRef}
        orbitRadius={orbitRadius}
        renderPriority={renderPriority}
        leftOffset={leftOffset}
      />
    );
  };

  //possibly listen to passive state in callback instead to prevent flickering
  const setSelectedDeckItem = useDragNDropStore(
    (state) => state.setSelectedDeckItem,
  );

  //#region pointer events
  const handlePointerDown = () => {
    useDragNDropStore.setState({
      isCanvasPointerDown: true,
      isCanvasPointerUp: false,
    });
  };

  const handlePointerUp = () => {
    setSelectedDeckItem(null);
    useDragNDropStore.setState({
      isCanvasPointerUp: true,
      isCanvasPointerDown: false,
      isCanvasPointerMoving: false,
      hasPointerLeftCanvas: false,
      pointerMoveTimestamp: null,
      floorPoint: { x: 10000000000000, y: 10000000000000, z: 10000000000000 },
      isOrbitControlsEnabled: true,
      isFloorDragEnabled: false,
      isWallDragEnabled: false,
    });
  };

  const handlePointerMove = () => {
    useDragNDropStore.setState({
      isCanvasPointerMoving: true,
      pointerMoveTimestamp: Date.now(),
    });
  };

  const handlePointerLeave = () => {
    useDragNDropStore.setState({
      hasPointerLeftCanvas: true,
      pointerMoveTimestamp: null,
    });
  };
  const handlePointerEnter = () => {
    useDragNDropStore.setState({
      hasPointerLeftCanvas: false,
      pointerMoveTimestamp: Date.now(),
      isCanvasPointerMoving: true,
    });
  };
  //#endregion

  return (
    <div className={styles.container}>
      <DeleteCabinetKeyboardHandler />
      <OverlapWarningOverlay />
      <PlacementBlockedOverlay />
      <Canvas
        shadows
        gl={{ stencil: true }}
        camera={{
          position: [0, 0.05 * 30, 0.1 * 30],
          // Three.js default is 50; we set it explicitly so screenshots/PDF
          // capture is stable and matches the actual camera projection.
          fov: 50,
        }}
        onPointerDown={(e) => handlePointerDown()}
        onPointerUp={(e) => handlePointerUp()}
        onPointerMove={(e) => handlePointerMove()}
        onPointerLeave={(e) => handlePointerLeave()}
        onPointerEnter={(e) => handlePointerEnter()}
      >
        <SelectedItemBoundsProvider>
          <Environment preset={"city"}></Environment>

          <CameraTracker />
          <NavCubeWithPanelOffset orbitRadius={navCubeOrbitRadius} renderPriority={3} />
          <DragonfireScreenshotCapture />
          <DragonfireToolsCameraTargetOverride controlsRef={controlsRef} />
          <Lights />
          {/* <InitialDummyCube /> */}
          <GenerateAllCabinetsInScene />
          <RayReceiverVerticalDragPlane />
          <RoomModel />
          <RayReceiverFloorPlane />
          <FloorGrid />
          <OutlinesManager />
          <SelectedItemBoundingBox />
          <OverlapBoundingBoxes />
          <OverlapDebugBounds />
          <CornerSnapPointsDebug />
          {/* <DragMovementManager /> */}
          {ENABLE_ROTATION_GIZMO ? <RotationGizmo /> : null}
          <DragPlacementManager />
          <CameraManager controlsRef={controlsRef} />
          <CameraZoomAnimation controlsRef={controlsRef} />
        </SelectedItemBoundsProvider>
      </Canvas>
    </div>
  );
};

export default BaseCanvas;
