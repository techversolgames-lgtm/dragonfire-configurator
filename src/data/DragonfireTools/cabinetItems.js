import { roomItemsOptions } from "./roomItems.js";

// Predefined items available for drag and drop
//lengths in metres
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
  {
    id: 3,
    name: "Counter",
    itemType: "wall",
    color: "rgb(0, 0, 255)",
    modelURL: "/models/counter1.glb",
    thumbnailURL: "/thumbnails/counter1.png",
    scale: 1,
  },
  {
    id: 4,
    name: "Cabinet",
    itemType: "floor",
    color: "rgb(0, 128, 0)",
    modelURL: "/models/cabinet1.glb",
    thumbnailURL: "/thumbnails/cabinet1.png",
    scale: 0.9,
  },
];

const tabs = [
  "Room items",
  '56" Worktable',
  "7 Ft Cabinets",
  "9 Ft Cabinets",
  "Cabinets",
  "Workbench & Cabinet Packages",
];

const worktableOptions = [
  {
    label: '56" Worktable',
    image: "/images/dragonfire-tools/pro-series-worktable.png",
    id: 1,
    itemType: "floor",
    color: "rgb(0, 0, 0)",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      //bounds excludes splash and feet
      width: 1.42,
      height: 0.95,
      depth: 0.672,
    },
    scale: 1,
  },
];
const shortCabinetOptions = [
  {
    label: "12 Drawer",
    image: "/images/dragonfire-tools/7ft_workbench/12D.png",
    id: 2,
    itemType: "floor",
    color: "rgb(0, 128, 255)",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      width: 2.14,
      height: 0.95,
      depth: 0.65, //0.65 without the top
    },
    scale: 1,
  },
  {
    label: "17 Drawer",
    image: "/images/dragonfire-tools/7ft_workbench/17D.png",
    id: 3,
    itemType: "floor",
    color: "rgb(0, 255, 0)",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      width: 2.14,
      height: 0.95,
      depth: 0.645
      , //0.65 without the top
    },
    scale: 1,
  },
  {
    label: "24 Drawer",
    image: "/images/dragonfire-tools/7ft_workbench/24D.png",
    id: 4,
    itemType: "floor",
    color: "rgb(0, 255, 128)",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      width: 2.15,
      height: 0.95,
      depth: 0.65, //0.65 without the top
    },
    scale: 1,
  },
];

const mediumCabinetOptions = [
  {
    label: "18 Drawer",
    image: "/images/dragonfire-tools/9ft_workbenches/18D.png",
    id: 5,
    itemType: "floor",
    color: "rgb(0, 255, 255)",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      width: 2.85,
      height: 0.95,
      depth: 0.65, //0.65 without the top
    },
    scale: 1,
  },
  {
    label: "20 Drawer",
    image: "/images/dragonfire-tools/9ft_workbenches/20D.png",
    id: 6,
    itemType: "floor",
    color: "rgb(128, 0, 0)",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      width: 2.85,
      height: 0.95,
      depth: 0.65, //0.65 without the top
    },
    scale: 1,
  },
  {
    label: "30 Drawer",
    image: "/images/dragonfire-tools/9ft_workbenches/30D.png",
    id: 7,
    itemType: "floor",
    color: "rgb(128, 0, 128)",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      width: 2.85,
      height: 0.95,
      depth: 0.63, //0.65 without the top
    },
    scale: 1,
  },
];

const standingCabinetOptions = [
  {
    label: "Locker",
    image: "/images/dragonfire-tools/tool_cabinets/webp/Locker-cabinet.webp",
    id: 8,
    itemType: "floor",
    color: "rgb(128, 0, 255)",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      width: 0.9,
      height: 2.12,
      depth: 0.7,
    },
    scale: 1,
  },
  {
    label: "6 Drawer",
    image: "/images/dragonfire-tools/tool_cabinets/webp/6-drawer-cabinet.webp",
    id: 9,
    itemType: "floor",
    color: "rgb(128, 128, 0)",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      width: 1.18,
      height: 1.02,
      depth: 0.66,
    },
    centerOffsetPosition: {
      x: 0,
      z:0,
    },
    scale: 1,
  },
  {
    label: "11 Drawer",
    image: "/images/dragonfire-tools/tool_cabinets/webp/11drawer.png",
    id: 10,
    itemType: "floor",
    color: "rgb(128, 128, 128)",
    modelURL: "/models/dragonfire-tools/11D.glb",
    boundingBox: {
      width: 1.1,  // 3872 mm
      height: 1.96,
      depth: .6,  // 1354 mm
    },
    scale: 1,
  },
  {
    label: "Lower Corner",
    image: "/images/dragonfire-tools/tool_cabinets/webp/lower-corner-cabinet.webp",
    id: 11,
    itemType: "floor",
    bIsCornerCabinet: true,
    color: "rgb(128, 128, 255)",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      //1.25m flat face to corner
      width: 1.031,
      height: 0.95,
      depth: 1.102,
    },
    centerOffsetPosition: {
      x: 0.031,
      z:-0.035,
    },
    scale: 1,
  },
  {
    label: "Upper Corner",
    image: "/images/dragonfire-tools/tool_cabinets/webp/upper-corner-cabinet.webp",
    id: 12,
    itemType: "wall",
    bIsCornerCabinet: true,
    color: "rgb(128, 255, 0)",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      //1m flat face to corner
      width: 1.06,
      height: 0.65,
      depth: 1.06,
    },
    scale: 1,
  },
  {
    label: "Wall Cabinet",
    image: "/images/dragonfire-tools/tool_cabinets/webp/wall-cabinet.webp",
    id: 13,
    itemType: "wall",
    color: "rgb(128, 255, 128)",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      //1m flat face to corner
      width: 0.71,
      height: 0.65,
      depth: 0.35,
    },
    scale: 1,
  },

  {
    label: "3 Wall Cabinets",
    image: "/images/dragonfire-tools/tool_cabinets/webp/wall-cabinet.webp",
    id: 14,
    itemType: "wall",
    color: "rgb(128, 255, 255)",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      //1m flat face to corner
      width: 0.71 * 3,
      height: 0.65,
      depth: 0.35,
    },
    scale: 1,
  },
  {
    label: "4 Wall Cabinets",
    image: "/images/dragonfire-tools/tool_cabinets/webp/wall-cabinet.webp",
    id: 15,
    itemType: "wall",
    color: "rgb(255, 0, 0)",
    modelURL: "/models/dragonfire-tools/chair_blue.glb",
    boundingBox: {
      //1m flat face to corner
      width: (0.71 * 4)+0.001, //-0.15 to account for the gap between the cabinets
      height: 0.65,
      depth: 0.35,
    },
    scale: 1,
  },
];

const cabinetPackageOptions = [
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
  },
];

const tabsDataMap = {
  "Room items": roomItemsOptions,
  '56" Worktable': worktableOptions,
  "7 Ft Cabinets": shortCabinetOptions,
  "9 Ft Cabinets": mediumCabinetOptions,
  Cabinets: standingCabinetOptions,
  "Workbench & Cabinet Packages": cabinetPackageOptions,
};
const reverseIdMap = {};
//loop through tabsDataMap
Object.values(tabsDataMap).forEach((tabItems) => {
  //each item is an array. loop through it
  tabItems.forEach((item) => {
    reverseIdMap[item.id] = item;
  });
});

// Hidden scene helper (not shown in any category) used as movable scale reference.
reverseIdMap[103] = {
  id: 103,
  label: "Scale Character",
  itemType: "floor",
  color: "rgb(90, 90, 90)",
  boundingBox: {
    width: 0.6,
    height: 1.75,
    depth: 0.45,
  },
  scale: 1,
};

export { items, tabs, tabsDataMap, worktableOptions, reverseIdMap };
