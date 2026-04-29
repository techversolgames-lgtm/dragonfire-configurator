import { roomItemsOptions } from "./roomItems.js";

// --- CATEGORY CONSTANTS ---
const CATEGORY = {
  WORKBENCH: "workbench",
  CABINET: "cabinet",
  PACKAGES: "packages",
  ROOM: "room",
};

const SUBCATEGORY = {
  WORKTABLE: "worktable",
  SHORT: "7ft-workbench",
  MEDIUM: "9ft-workbench",
  DRAWER: "drawer",
  WALL: "wall",
  CORNER: "corner",
  LOCKER: "locker",
};

// --- MAIN CATEGORIES ---
const mainCategories = [
  {
    label: "Cabinets",
    type: CATEGORY.CABINET,
    image: "/images/dragonfire-tools/tool_cabinets/webp/Locker-cabinet.webp",
  },
  {
    label: "Workbench",
    type: CATEGORY.WORKBENCH,
    image: "/images/dragonfire-tools/pro-series-worktable.png",
  },
  {
    label: "Room Items",
    type: CATEGORY.ROOM,
    image: "/images/dragonfire-tools/room_items/TV.png",
  },
  {
    label: "Packages",
    type: CATEGORY.PACKAGES,
    image: "/images/dragonfire-tools/combo/12DP.png",
  },
];

// --- WORKBENCH ---
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
    category: CATEGORY.WORKBENCH,
    subCategory: SUBCATEGORY.WORKTABLE,
    group: "worktable",
  },
];

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
    category: CATEGORY.WORKBENCH,
    subCategory: SUBCATEGORY.SHORT,
    group: "drawer",
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
    category: CATEGORY.WORKBENCH,
    subCategory: SUBCATEGORY.SHORT,
    group: "drawer",
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
    category: CATEGORY.WORKBENCH,
    subCategory: SUBCATEGORY.SHORT,
    group: "drawer",
  },
];

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
    category: CATEGORY.WORKBENCH,
    subCategory: SUBCATEGORY.MEDIUM,
    group: "drawer",
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
    category: CATEGORY.WORKBENCH,
    subCategory: SUBCATEGORY.MEDIUM,
    group: "drawer",
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
    category: CATEGORY.WORKBENCH,
    subCategory: SUBCATEGORY.MEDIUM,
    group: "drawer",
  },
];
const withoutCabinetOptions = [
  // {
  //   label: "Without Cabinet",
  //   image: "/images/dragonfire-tools/pro-series-worktable.png",
  //   id: 300,
  //   type: "workbench",
  //   itemType: "floor",
  //   modelURL: "/models/dragonfire-tools/work_table.glb",
  //   boundingBox: { width: 1.5, height: 0.95, depth: 0.7 },
  //   scale: 1,
  //   category: CATEGORY.WORKBENCH,
  //   subCategory: SUBCATEGORY.WORKTABLE,
  //   group: "worktable",
  // },
];

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
    category: CATEGORY.CABINET,
    subCategory: SUBCATEGORY.DRAWER,
    group: "drawer",
  },
  {
    label: "11 Drawer Cabinet",
    image: "/images/dragonfire-tools/tool_cabinets/webp/11drawer.png",
    id: 10,
    type: "cabinet",
    itemType: "floor",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: { width: 1.1, height: 1.96, depth: .6 },
    scale: 1,
    category: CATEGORY.CABINET,
    subCategory: SUBCATEGORY.DRAWER,
    group: "drawer",
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
    category: CATEGORY.CABINET,
    subCategory: SUBCATEGORY.WALL,
    group: "wall",
  },
  {
    label: "3 Set Wall Cabinet",
    image: "/images/dragonfire-tools/tool_cabinets/3_set_wall.png",
    id: 14,
    type: "cabinet",
    itemType: "wall",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      width: 0.71 * 3,
      height: 0.65,
      depth: 0.35,
    },
    scale: 1,
    category: CATEGORY.CABINET,
    subCategory: SUBCATEGORY.WALL,
    group: "wall",
  },
  {
    label: "4 Set Wall Cabinet",
    image: "/images/dragonfire-tools/tool_cabinets/4_set_wall.png",
    id: 15,
    type: "cabinet",
    itemType: "wall",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      width: (0.71 * 4) + 0.001, //-0.15 to account for the gap between the cabinets
      height: 0.65,
      depth: 0.35,
    },
    scale: 1,
    category: CATEGORY.CABINET,
    subCategory: SUBCATEGORY.WALL,
    group: "wall",
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
    category: CATEGORY.CABINET,
    subCategory: SUBCATEGORY.CORNER,
    group: "corner",
  },
  {
    label: "Upper Corner Cabinet",
    image: "/images/dragonfire-tools/tool_cabinets/webp/upper-corner-cabinet.webp",
    id: 12,
    type: "cabinet",
    itemType: "wall",
    bIsCornerCabinet: true,
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      width: 1.06,
      height: 0.65,
      depth: 1.06,
    },
    scale: 1,
    category: CATEGORY.CABINET,
    subCategory: SUBCATEGORY.CORNER,
    group: "corner",
  },
  {
    label: "Locker Cabinet",
    image: "/images/dragonfire-tools/tool_cabinets/locker_cabinet.png",
    id: 8,
    type: "cabinet",
    itemType: "floor",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      width: 0.9,
      height: 2.14,
      depth: 0.7,
    },
    scale: 1,
    category: CATEGORY.CABINET,
    subCategory: SUBCATEGORY.LOCKER,
    group: "locker",
  },
];

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
    category: CATEGORY.PACKAGES,
    subCategory: SUBCATEGORY.DRAWER,
    group: "drawer",
  },
  {
    label: '56" Worktable',
    image: "/images/dragonfire-tools/combo/worktable_package.png",
    id: 16,
    isCabinetPackage: true,
    itemType: "floor",
    color: "rgb(255, 0, 128)",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      width: worktableOptions[0].boundingBox.width,
      height: standingCabinetOptions[0].boundingBox.height, //packages are all locker height
      depth: worktableOptions[0].boundingBox.depth,
    },
    scale: 1,
    category: CATEGORY.PACKAGES,
    subCategory: SUBCATEGORY.WORKTABLE,
    group: "worktable",
  },
  {
    label: "12 Drawer",
    image: "/images/dragonfire-tools/combo/12DP.png",
    id: 17,
    isCabinetPackage: true,
    itemType: "floor",
    color: "rgb(255, 0, 128)",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      width:
        shortCabinetOptions[0].boundingBox.width +
        2 * standingCabinetOptions[0].boundingBox.width,
      height: standingCabinetOptions[0].boundingBox.height,
      depth: shortCabinetOptions[0].boundingBox.depth,
    },
    scale: 1,
    category: CATEGORY.PACKAGES,
    subCategory: SUBCATEGORY.DRAWER,
    group: "drawer",
  },
  {
    label: "17 Drawer",
    image: "/images/dragonfire-tools/combo/17DP.png",
    id: 18,
    isCabinetPackage: true,
    itemType: "floor",
    color: "rgb(255, 128, 0)",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      width:
        shortCabinetOptions[1].boundingBox.width +
        2 * standingCabinetOptions[0].boundingBox.width,
      height: standingCabinetOptions[0].boundingBox.height,
      depth: shortCabinetOptions[1].boundingBox.depth,
    },
    scale: 1,
    category: CATEGORY.PACKAGES,
    subCategory: SUBCATEGORY.DRAWER,
    group: "drawer",
  },
  {
    label: "18 Drawer",
    image: "/images/dragonfire-tools/combo/18DP.png",
    id: 19,
    isCabinetPackage: true,
    itemType: "floor",
    color: "rgb(255, 128, 128)",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      width:
        mediumCabinetOptions[0].boundingBox.width +
        2 * standingCabinetOptions[0].boundingBox.width,
      height: standingCabinetOptions[0].boundingBox.height,
      depth: mediumCabinetOptions[0].boundingBox.depth,
    },
    scale: 1,
    category: CATEGORY.PACKAGES,
    subCategory: SUBCATEGORY.DRAWER,
    group: "drawer",
  },
  {
    label: "20 Drawer",
    image: "/images/dragonfire-tools/combo/20DP.png",
    id: 20,
    isCabinetPackage: true,
    itemType: "floor",
    color: "rgb(255, 128, 255)",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      width:
        mediumCabinetOptions[1].boundingBox.width +
        2 * standingCabinetOptions[0].boundingBox.width,
      height: standingCabinetOptions[0].boundingBox.height,
      depth: mediumCabinetOptions[1].boundingBox.depth,
    },
    scale: 1,
    category: CATEGORY.PACKAGES,
    subCategory: SUBCATEGORY.DRAWER,
    group: "drawer",
  },
  {
    label: "24 Drawer",
    image: "/images/dragonfire-tools/combo/24DP.png",
    id: 21,
    isCabinetPackage: true,
    itemType: "floor",
    color: "rgb(255, 255, 0)",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      width:
        shortCabinetOptions[2].boundingBox.width +
        2 * standingCabinetOptions[0].boundingBox.width,
      height: standingCabinetOptions[0].boundingBox.height,
      depth: shortCabinetOptions[2].boundingBox.depth,
    },
    scale: 1,
    category: CATEGORY.PACKAGES,
    subCategory: SUBCATEGORY.DRAWER,
    group: "drawer",
  },
  {
    label: "30 Drawer",
    image: "/images/dragonfire-tools/combo/30DP.png",
    id: 22,
    isCabinetPackage: true,
    itemType: "floor",
    color: "rgb(255, 255, 128)",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      width:
        mediumCabinetOptions[2].boundingBox.width +
        2 * standingCabinetOptions[0].boundingBox.width,
      height: standingCabinetOptions[0].boundingBox.height,
      depth: mediumCabinetOptions[2].boundingBox.depth,
    },
    scale: 1,
    category: CATEGORY.PACKAGES,
    subCategory: SUBCATEGORY.DRAWER,
    group: "drawer",
  },
  {
    label: "11 Drawer",
    image: "/images/dragonfire-tools/tool_cabinets/webp/11drawer.png",
    id: 23,
    isCabinetPackage: true,
    itemType: "floor",
    color: "rgb(255, 64, 64)",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      // Two 11-drawer cabinets side by side
      width: standingCabinetOptions[2].boundingBox.width * 2, // 2 × 1.1 = 2.2
      height: standingCabinetOptions[2].boundingBox.height,    // 1.96
      depth: standingCabinetOptions[2].boundingBox.depth,      // 0.6
    },
    scale: 1,
    category: CATEGORY.PACKAGES,
    subCategory: SUBCATEGORY.DRAWER,
    group: "drawer",
  },

];

// --- CABINET SUB-CATEGORIES ---
const cabinetSubCategories = [
  {
    label: "Drawer",
    type: SUBCATEGORY.DRAWER,
    image: "/images/dragonfire-tools/tool_cabinets/webp/6-drawer-cabinet.webp",
  },
  {
    label: "Wall",
    type: SUBCATEGORY.WALL,
    image: "/images/dragonfire-tools/tool_cabinets/webp/wall-cabinet.webp",
  },
  {
    label: "Corner",
    type: SUBCATEGORY.CORNER,
    image: "/images/dragonfire-tools/tool_cabinets/webp/lower-corner-cabinet.webp",
  },
  {
    label: "Locker",
    type: SUBCATEGORY.LOCKER,
    image: "/images/dragonfire-tools/tool_cabinets/locker_cabinet.png",
  },
];

// --- NESTED CATEGORY TREE ---
const categoryTree = {
  [CATEGORY.WORKBENCH]: {
    [SUBCATEGORY.WORKTABLE]: worktableOptions,
    [SUBCATEGORY.SHORT]: [
      shortCabinetOptions[0],
      shortCabinetOptions[1],
      { ...mediumCabinetOptions[0], subCategory: SUBCATEGORY.SHORT },
    ],
    [SUBCATEGORY.MEDIUM]: mediumCabinetOptions,
  },
  [CATEGORY.CABINET]: {
    [SUBCATEGORY.DRAWER]: standingCabinetOptions.filter((i) => i.subCategory === SUBCATEGORY.DRAWER),
    [SUBCATEGORY.WALL]: standingCabinetOptions.filter((i) => i.subCategory === SUBCATEGORY.WALL),
    [SUBCATEGORY.CORNER]: standingCabinetOptions.filter((i) => i.subCategory === SUBCATEGORY.CORNER),
    [SUBCATEGORY.LOCKER]: standingCabinetOptions.filter((i) => i.subCategory === SUBCATEGORY.LOCKER),
  },
  [CATEGORY.PACKAGES]: {
    [SUBCATEGORY.WORKTABLE]: cabinetPackageOptions.filter((i) => i.group === "worktable"),
    [SUBCATEGORY.DRAWER]: cabinetPackageOptions.filter((i) => i.group === "drawer"),
  },
  [CATEGORY.ROOM]: roomItemsOptions.map((item) => ({
    ...item,
    category: CATEGORY.ROOM,
    subCategory: "room-items",
    group: "room",
  })),
};

const subCategoriesByCategory = {
  [CATEGORY.CABINET]: cabinetSubCategories,
  [CATEGORY.WORKBENCH]: [
    {
      label: "7ft Workbench",
      type: SUBCATEGORY.SHORT,
      image: "/images/dragonfire-tools/7ft_workbench/12D.png",
    },
    {
      label: "9ft Workbench",
      type: SUBCATEGORY.MEDIUM,
      image: "/images/dragonfire-tools/9ft_workbenches/18D.png",
    },
  ],
  [CATEGORY.PACKAGES]: [
    {
      label: "Worktable",
      type: SUBCATEGORY.WORKTABLE,
      image: "/images/dragonfire-tools/combo/worktable_package.png",
    },
    {
      label: "Drawer",
      type: SUBCATEGORY.DRAWER,
      image: "/images/dragonfire-tools/combo/12DP.png",
    },
  ],
  [CATEGORY.ROOM]: [],
};

// --- GET ITEMS HELPER ---
function getItems(category, subCategory) {
  if (!category) return [];
  if (category === CATEGORY.ROOM) return Array.isArray(categoryTree[category]) ? categoryTree[category] : [];
  if (!subCategory) return Object.values(categoryTree[category] || {}).flat();
  return categoryTree[category]?.[subCategory] || [];
}

// --- REVERSE MAP ---
const reverseIdMap = {};
[
  ...Object.values(categoryTree["workbench"]).flat(),
  ...Object.values(categoryTree["cabinet"]).flat(),
  ...Object.values(categoryTree["packages"]).flat(),
  ...(Array.isArray(categoryTree["room"]) ? categoryTree["room"] : []),
].forEach((item) => {
  if (item && item.id !== undefined) reverseIdMap[item.id] = item;
});
// hidden helper
reverseIdMap[103] = {
  id: 103,
  label: "Scale Character",
  itemType: "floor",
  boundingBox: { width: 0.6, height: 1.75, depth: 0.45 },
  scale: 1,
};

// --- EXPORTS ---
export {
  mainCategories,
  subCategoriesByCategory,
  cabinetSubCategories,
  worktableOptions,
  shortCabinetOptions,
  mediumCabinetOptions,
  cabinetPackageOptions,
  standingCabinetOptions,
  withoutCabinetOptions,
  roomItemsOptions,
  categoryTree,
  reverseIdMap,
  getItems,
};