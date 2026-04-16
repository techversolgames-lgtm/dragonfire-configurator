import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

const useAnimationStore = create(
  subscribeWithSelector((set, get) => {
    return {
      doNotUseThisStateOrYouWillGetFired:
        "jUI8&9)OOjK5%$gVbN_loi(8&86&Tmk>/><l<LiH3&tGG6Yh^89O_-_=+L:iJHY",
      /************* */

      //bounding box min state
      wheelOffset: null,

      //box states
      boxWidth: 1,
      boxLength: 1,
      boxHeight: 1,
      boxColor: "#ff0000",
      //nav cube states
      mainCameraRotation: null,
      mainCameraPosition: null,
      navCubeMeshNameSelect: null,

      //storloc cabinet states
      drawers: [],
      drawerCount: 0,
      columns: [],
      columnCount: 0,
      layoutValues: {},
      overflowDrawers: [], // Store overflow drawers globally
      disableRiser: () => {
        const state = get();
        return !(
          state.top === "Maple" || state.top === "Stainless Steel Capped Maple"
        );
      },
      disableRiserAccessories: () => {
        const state = get();
        const hasTopMaple =
          state.top === "Maple" || state.top === "Stainless Steel Capped Maple";
        const hasRiser = state.riser !== "None";
        return !(hasTopMaple && hasRiser);
      },
      disableLayouts: () => {
        const state = get();
        return state.HMIModel === "None";
      },

      disablePresets: () => {
        const state = get();
        return state.boxType === "None";
      },

      //?
      refreshSidebar: false,
      price: 0,
      presetColumns: [],
      presetDrawers: [],
      showPresetsSidebar: false,
      showLayoutsSidebar: false,

      //Camtech box states
      HMIModelOptions: {},
      camTechButtonCount: () => {
        const state = get();
        return state.camTechOptions.length;
      },

      //Welding Tables states
      width: "4",
      depth: "3",
      frameColor: "#808080",
      tabletop: '1/2" Plate Steel',

      /********************************* */
    };
  })
);

export default useAnimationStore;
