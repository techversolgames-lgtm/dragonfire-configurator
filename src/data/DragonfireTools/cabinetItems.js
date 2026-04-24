import { roomItemsOptions } from "./roomItems.js";

/* ---------------- BASIC ITEMS ---------------- */
const items = [
  {
    id: 1,
    name: "Folding Chair",
    itemType: "floor",
    color: "rgb(0, 0, 0)",
    modelURL: "/models/chair_blue.glb",
    thumbnailURL: "/thumbnails/chair_blue.png",
    scale: 1,
  },
  {
    id: 2,
    name: "Wooden Chair",
    itemType: "floor",
    color: "rgb(0, 0, 128)",
    modelURL: "/models/cover_chair.glb",
    thumbnailURL: "/thumbnails/cover_chair.png",
    scale: 1,
  },
];

/* ---------------- WORKBENCH BASE ---------------- */
const worktableOptions = [
  {
    label: '56" Worktable',
    image: "/images/dragonfire-tools/pro-series-worktable.png",
    id: 1,
    type: "workbench",
    itemType: "floor",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: { width: 1.42, height: 0.95, depth: 0.672 },
    scale: 1,
  },
];

/* ---------------- 7FT ---------------- */
const shortCabinetOptions = [
  {
    label: "12 Drawer",
    image: "/images/dragonfire-tools/7ft_workbench/12D.png",
    id: 2,
    type: "workbench",
    itemType: "floor",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: { width: 2.14, height: 0.95, depth: 0.65 },
    scale: 1,
  },
  {
    label: "17 Drawer",
    image: "/images/dragonfire-tools/7ft_workbench/17D.png",
    id: 3,
    type: "workbench",
    itemType: "floor",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: { width: 2.14, height: 0.95, depth: 0.645 },
    scale: 1,
  },
  {
    label: "24 Drawer",
    image: "/images/dragonfire-tools/7ft_workbench/24D.png",
    id: 4,
    type: "workbench",
    itemType: "floor",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: { width: 2.15, height: 0.95, depth: 0.65 },
    scale: 1,
  },
];

/* ---------------- 9FT ---------------- */
const mediumCabinetOptions = [
  {
    label: "18 Drawer",
    image: "/images/dragonfire-tools/9ft_workbenches/18D.png",
    id: 5,
    type: "workbench",
    itemType: "floor",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: { width: 2.85, height: 0.95, depth: 0.65 },
    scale: 1,
  },
  {
    label: "20 Drawer",
    image: "/images/dragonfire-tools/9ft_workbenches/20D.png",
    id: 6,
    type: "workbench",
    itemType: "floor",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: { width: 2.85, height: 0.95, depth: 0.65 },
    scale: 1,
  },
  {
    label: "30 Drawer",
    image: "/images/dragonfire-tools/9ft_workbenches/30D.png",
    id: 7,
    type: "workbench",
    itemType: "floor",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: { width: 2.85, height: 0.95, depth: 0.63 },
    scale: 1,
  },
];
/* ---------------- WITHOUT CABINET ---------------- */
const withoutCabinetOptions = [
  {
    label: "Without Cabinet",
    image: "/images/dragonfire-tools/pro-series-worktable.png",
    id: 300,
    type: "workbench",
    itemType: "floor",
    modelURL: "/models/dragonfire-tools/work_table.glb",
    boundingBox: { width: 1.5, height: 0.95, depth: 0.7 },
    scale: 1,
  },
];

/* ---------------- STANDING CABINET OPTIONS ---------------- */
const standingCabinetOptions = [
  // Drawer cabinets
  {
    label: "6 Drawer Cabinet",
    image: "/images/dragonfire-tools/tool_cabinets/webp/6-drawer-cabinet.webp",
    id: 9,
    type: "cabinet",
    itemType: "floor",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: { width: 1.18, height: 1.02, depth: 0.66 },
    scale: 1,
  },
  {
    label: "22 Drawer Cabinet",
    image: "/images/dragonfire-tools/tool_cabinets/webp/22-drawer.webp",
    id: 10,
    type: "cabinet",
    itemType: "floor",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: { width: 1.18, height: 1.02, depth: 0.66 },
    scale: 1,
  },
  // Wall cabinets
  {
    label: "Wall Cabinet",
    image: "/images/dragonfire-tools/tool_cabinets/webp/wall-cabinet.webp",
    id: 13,
    type: "cabinet",
    itemType: "wall",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: { width: 0.9, height: 0.6, depth: 0.35 },
    scale: 1,
  },
  {
    label: "3 Set Wall Cabinet",
    image: "/images/dragonfire-tools/tool_cabinets/3_set_wall.png",
    id: 14,
    type: "cabinet",
    itemType: "wall",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: { width: 2.7, height: 0.6, depth: 0.35 },
    scale: 1,
  },
  {
    label: "4 Set Wall Cabinet",
    image: "/images/dragonfire-tools/tool_cabinets/4_set_wall.png",
    id: 15,
    type: "cabinet",
    itemType: "wall",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: { width: 3.6, height: 0.6, depth: 0.35 },
    scale: 1,
  },
  // Corner cabinets

  {
    label: "Lower Corner Cabinet",
    image: "/images/dragonfire-tools/tool_cabinets/webp/lower-corner-cabinet.webp",
    id: 11,
    type: "cabinet",
    itemType: "floor",
    bIsCornerCabinet: true,
    boundingBox: {
      width: 1.031,
      height: 0.95,
      depth: 1.102,
    },
    centerOffsetPosition: {
      x: 0.031,
      z: -0.035,
    },
    modelURL: "/models/dragonfire-tools/chair_blue.glb",

    scale: 1,
  },
  {
    label: "Upper Corner Cabinet",
    image: "/images/dragonfire-tools/tool_cabinets/webp/upper-corner-cabinet.webp",
    id: 12,
    type: "cabinet",
    itemType: "wall",
    bIsCornerCabinet: true,
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: { width: 0.9, height: 0.6, depth: 0.9 },
    scale: 1,
  },
  {
    label: "Locker Cabinet",
    image: "/images/dragonfire-tools/tool_cabinets/locker_cabinet.png",
    id: 16,
    type: "cabinet",
    itemType: "floor",
    modelURL: "/models/dragonfire-tools/locker_full.glb",
    boundingBox: { width: 0.9, height: 1.8, depth: 0.6 },
    scale: 1,
  }
];

/* ---------------- PACKAGES ---------------- */
const cabinetPackageOptions = [
  {
    label: "12 Drawer Package",
    image: "/images/dragonfire-tools/combo/12DP.png",
    id: 17,
    type: "workbench",
    itemType: "floor",
    isCabinetPackage: true,
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      width:
        shortCabinetOptions[0].boundingBox.width +
        2 * standingCabinetOptions[0].boundingBox.width,
      height: standingCabinetOptions[0].boundingBox.height,
      depth: shortCabinetOptions[0].boundingBox.depth,
    },
    scale: 1,
  },
];

/* ---------------- CABINET SUB-CATEGORIES ---------------- */
const cabinetSubCategories = [

  {
    label: "Drawer Cabinets",
    type: "drawer",
    image: "/images/dragonfire-tools/tool_cabinets/webp/6-drawer-cabinet.webp",
  },
  {
    label: "Wall Cabinets",
    type: "wall",
    image: "/images/dragonfire-tools/tool_cabinets/webp/wall-cabinet.webp",
  },
  {
    label: "Corner Cabinets",
    type: "corner",
    image: "/images/dragonfire-tools/tool_cabinets/webp/lower-corner-cabinet.webp",
  },
  {
    label: "Locker Cabinets",
    type: "locker",
    image: "/images/dragonfire-tools/tool_cabinets/locker_cabinet.png",
  },
];

/* ---------------- 🔥 ALL WORKBENCH (FINAL FIX) ---------------- */
const workbenchAllOptions = [
  ...worktableOptions,
  ...shortCabinetOptions,
  ...mediumCabinetOptions,
  ...cabinetPackageOptions,
    withoutCabinetOptions,
];

/* ---------------- CATEGORIES ---------------- */
const mainCategories = [
  {
    label: "Cabinets",
    type: "cabinet",
    image: "/images/dragonfire-tools/tool_cabinets/webp/Locker-cabinet.webp",
  },
  {
    label: "Workbench",
    type: "workbench",
    image: "/images/dragonfire-tools/pro-series-worktable.png",
  },
  {
    label: "Room Items",
    type: "room",
    image: "/images/dragonfire-tools/room_items/TV.png",
  },
];

/* ---------------- REVERSE MAP ---------------- */
const reverseIdMap = {};

[
  workbenchAllOptions,
  standingCabinetOptions,
  withoutCabinetOptions,
  roomItemsOptions,
].forEach((list) => {
  list.forEach((item) => {
    reverseIdMap[item.id] = item;
  });
});

/* hidden helper */
reverseIdMap[103] = {
  id: 103,
  label: "Scale Character",
  itemType: "floor",
  
  boundingBox: { width: 0.6, height: 1.75, depth: 0.45 },
  scale: 1,
};

/* ---------------- EXPORT ---------------- */
export {
  items,
  workbenchAllOptions,
  shortCabinetOptions,
  mediumCabinetOptions,
  cabinetPackageOptions,
  standingCabinetOptions,
  cabinetSubCategories,
  roomItemsOptions,
  mainCategories,
  reverseIdMap,
  withoutCabinetOptions,
  
};