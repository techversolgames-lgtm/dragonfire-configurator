// Room decorative items (TV, Door, Window) — place first, then cabinets
// IDs 100–102 to avoid clashing with cabinet ids 1–22
// lengths in metres
// Thumbnails: public/images/dragonfire-tools/room_items/

const ROOM_ITEMS_IMAGE_BASE = "/images/dragonfire-tools/room_items";

// TV sizes: diagonal in inches (16:9 aspect). Default 55" → width/height in metres.
const TV_SIZE_INCHES = [43, 50, 55, 60, 65, 75];
const INCH_TO_M = 0.0254;
const TV_16_9_WIDTH_RATIO = 16 / Math.sqrt(16 * 16 + 9 * 9);
const TV_16_9_HEIGHT_RATIO = 9 / Math.sqrt(16 * 16 + 9 * 9);

function tvDiagonalInchesToWidthHeightM(diagonalInches) {
  const diagM = diagonalInches * INCH_TO_M;
  return {
    width: diagM * TV_16_9_WIDTH_RATIO,
    height: diagM * TV_16_9_HEIGHT_RATIO,
  };
}

const TV_DEFAULT_INCHES = 55;
const tvDefaultBox = tvDiagonalInchesToWidthHeightM(TV_DEFAULT_INCHES);

const roomItemsOptions = [
  {
    id: 100,
    label: "TV",
    itemType: "wall",
    color: "rgb(40, 40, 45)",
    image: `${ROOM_ITEMS_IMAGE_BASE}/TV.png`,
    boundingBox: {
      width: tvDefaultBox.width,
      height: tvDefaultBox.height,
      depth: 0.03,
    },
    scale: 1,
  },
  {
    id: 101,
    label: "Door",
    itemType: "wall",
    color: "rgb(139, 90, 43)",
    image: `${ROOM_ITEMS_IMAGE_BASE}/Door.png`,
    boundingBox: {
      width: 0.9,
      height: 2.1,
      depth: 0.05,
    },
    /** Y offset of door mesh center from placement position (metres). Must match DoorModel DOOR_BOUNDING_BOX_OFFSET.y. */
    meshCenterOffsetY: 0,
    scale: 1,
  },
  {
    id: 102,
    label: "Window",
    itemType: "wall",
    color: "rgb(200, 220, 240)",
    image: `${ROOM_ITEMS_IMAGE_BASE}/Window.png`,
    boundingBox: {
      width: 1.2,
      height: 1.0,
      depth: 0.1,
    },
    scale: 1,
  },
];

export { roomItemsOptions, TV_SIZE_INCHES, tvDiagonalInchesToWidthHeightM };
