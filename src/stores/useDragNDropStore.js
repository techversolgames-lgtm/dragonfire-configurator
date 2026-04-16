import { create } from "zustand";
// import { buttonActions } from "@/utils/buttonActions";
import * as THREE from "three";

const useDragNDropStore = create((set) => ({
  /***********/
  /***********************
   * DUMMY STATE VALUES***
   ***********************/
  __dummyState__: "fgdjk56#89()*/.,/_)9#2@!097j0e56jt0",
  __sampleSetter__: (newState) => set({ __dummyState__: newState }),

  /**
   * RAW VALUES
   */

  // Deck Item Selection
  selectedDeckItem: null,
  selectedDragItem: null,

  //mouse events
  isCanvasPointerDown: false,
  isCanvasPointerUp: false,
  isCanvasPointerMoving: false,
  pointerMoveTimestamp: null,
  placedPositions: [],

  dragPointNormal: { x: 0, y: 1, z: 0 },
  floorDragPosition: { x: 0, y: 0, z: 0 },

  //drag movement system
  itemIgnoreList: [],
  rotationRequest: null,
  activeSceneItem: null,
  selectedObject: null,

  isOrbitControlsEnabled: true,
  isFloorDragEnabled: false,
  isWallDragEnabled: false,
  floorDragVector: new THREE.Vector3(),
  draggedCabinetIndex: null,

  /***********
   * GETTERS *
   ***********/
  getIsItemSelected: (item) => {
    const currentState = useDragNDropStore.getState();
    return currentState.selectedDeckItem?.id === item.id;
  },

  /***********
   * SETTERS *
   ***********/
  setSelectedDeckItem: (item) =>
    set((state) => {
      if (state.selectedDeckItem !== item) {
        return {
          selectedDeckItem: item,
        };
      }
      return {};
    }),
  setIsCanvasPointerDown: (value) => set({ isCanvasPointerDown: value }),
  setIsCanvasPointerUp: (value) => set({ isCanvasPointerUp: value }),
  setIsCanvasPointerMoving: (value) => set({ isCanvasPointerMoving: value }),
  setRaycastData: (data) => set({ raycastData: data }),
  requestRotation: (angle) => set({ rotationRequest: { angle } }),
  clearRotationRequest: () => set({ rotationRequest: null }),
  setIsOrbitControlsEnabled: (value) => set({ isOrbitControlsEnabled: value }),
  setActiveSceneItem: (item) => set({ activeSceneItem: item }),
  setSelectedObject: (object) => set({ selectedObject: object }),
  setItemIgnoreList: (list) => set({ itemIgnoreList: list }),
}));
export default useDragNDropStore;
