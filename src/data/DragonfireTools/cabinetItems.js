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
    itemType: "floor",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: { width: 2.14, height: 0.95, depth: 0.65 },
    scale: 1,
  },
  {
    label: "17 Drawer",
    image: "/images/dragonfire-tools/7ft_workbench/17D.png",
    id: 3,
    itemType: "floor",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: { width: 2.14, height: 0.95, depth: 0.645 },
    scale: 1,
  },
  {
    label: "24 Drawer",
    image: "/images/dragonfire-tools/7ft_workbench/24D.png",
    id: 4,
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
    itemType: "floor",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: { width: 2.85, height: 0.95, depth: 0.65 },
    scale: 1,
  },
  {
    label: "20 Drawer",
    image: "/images/dragonfire-tools/9ft_workbenches/20D.png",
    id: 6,
    itemType: "floor",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: { width: 2.85, height: 0.95, depth: 0.65 },
    scale: 1,
  },
  {
    label: "30 Drawer",
    image: "/images/dragonfire-tools/9ft_workbenches/30D.png",
    id: 7,
    itemType: "floor",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: { width: 2.85, height: 0.95, depth: 0.63 },
    scale: 1,
  },
];

/* ---------------- PACKAGES ---------------- */
const cabinetPackageOptions = [
  {
    label: "12 Drawer Package",
    image: "/images/dragonfire-tools/combo/12DP.png",
    id: 17,
    itemType: "floor",
    isCabinetPackage: true,
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      width: 2.14 + 2 * 0.9,
      height: 2.12,
      depth: 0.65,
    },
    scale: 1,
  },
];

/* ---------------- CABINET SUB-CATEGORIES ---------------- */
const cabinetSubCategories = [
  {
    label: "7ft Workbench",
    type: "7ft",
    image: "/images/dragonfire-tools/7ft_workbench/12D.png",
  },
  {
    label: "9ft Workbench",
    type: "9ft",
    image: "/images/dragonfire-tools/9ft_workbenches/18D.png",
  },
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
];

/* ---------------- STANDING CABINET OPTIONS ---------------- */
const standingCabinetOptions = [
  // Drawer cabinets
  {
    label: "6 Drawer Cabinet",
    image: "/images/dragonfire-tools/tool_cabinets/webp/6-drawer-cabinet.webp",
    id: 201,
    itemType: "floor",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: { width: 0.9, height: 1.8, depth: 0.5 },
    scale: 1,
  },
  {
    label: "22 Drawer Cabinet",
    image: "/images/dragonfire-tools/tool_cabinets/webp/22-drawer.webp",
    id: 202,
    itemType: "floor",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: { width: 0.9, height: 1.8, depth: 0.5 },
    scale: 1,
  },
  {
    label: "Locker Cabinet",
    image: "/images/dragonfire-tools/tool_cabinets/webp/Locker-cabinet.webp",
    id: 203,
    itemType: "floor",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: { width: 0.9, height: 1.8, depth: 0.5 },
    scale: 1,
  },
  // Wall cabinets
  {
    label: "Wall Cabinet",
    image: "/images/dragonfire-tools/tool_cabinets/webp/wall-cabinet.webp",
    id: 204,
    itemType: "wall",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: { width: 0.9, height: 0.6, depth: 0.35 },
    scale: 1,
  },
  {
    label: "3 Set Wall Cabinet",
    image: "/images/dragonfire-tools/tool_cabinets/3_set_wall.png",
    id: 205,
    itemType: "wall",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: { width: 2.7, height: 0.6, depth: 0.35 },
    scale: 1,
  },
  {
    label: "4 Set Wall Cabinet",
    image: "/images/dragonfire-tools/tool_cabinets/4_set_wall.png",
    id: 206,
    itemType: "wall",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: { width: 3.6, height: 0.6, depth: 0.35 },
    scale: 1,
  },
  // Corner cabinets
  {
    label: "Lower Corner Cabinet",
    image: "/images/dragonfire-tools/tool_cabinets/webp/lower-corner-cabinet.webp",
    id: 207,
    itemType: "floor",
    bIsCornerCabinet: true,
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: { width: 0.9, height: 0.95, depth: 0.9 },
    scale: 1,
  },
  {
    label: "Upper Corner Cabinet",
    image: "/images/dragonfire-tools/tool_cabinets/webp/upper-corner-cabinet.webp",
    id: 208,
    itemType: "wall",
    bIsCornerCabinet: true,
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: { width: 0.9, height: 0.6, depth: 0.9 },
    scale: 1,
  },
];

/* ---------------- 🔥 ALL WORKBENCH (FINAL FIX) ---------------- */
const workbenchAllOptions = [
  ...worktableOptions,
  ...shortCabinetOptions,
  ...mediumCabinetOptions,
  ...cabinetPackageOptions,
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
};