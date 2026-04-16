import LevelingFeet from "./LevelingFeet";
import LevelingFeetLowProfile from "./LevelingFeetLowProfile";
import LegsFeet from "./LegsFeet";
import SmallLegs from "./SmallLegs";
import CasterWheel from "./CasterWheel";

const FOOT_Z_OFFSET = 0.0545;

/** Cabinet ids that use 6 feet/wheels (7ft/9ft workbenches). Others use 4. Number of feet and wheels is the same per model. */
export const SIX_FEET_CABINET_IDS = [2, 3, 4, 5, 6, 7];

/** World Y of the room floor (must match RoomModel floor plane). Cabinets are positioned so their base/feet sit on this level. */
export const FLOOR_Y = -0.1;

/** Y offset: none = flush to floor; riser/wheel/legs/smallLegs = cabinet sits on top of feet. */
export const FLOOR_OFFSET_NONE = 0;
export const FLOOR_OFFSET_RISER = 0.07;
/** Leveling feet low profile: 2 in. lower than standard riser. */
export const FLOOR_OFFSET_RISER_LOWPROFILE = 0.07 - 0.0508;
export const FLOOR_OFFSET_WHEEL = 0.166;

/** Tunable: Locker & 11 Drawer (legs) – cabinet offset above floor and leg placement. */
export const FLOOR_OFFSET_LEGS = 0.07;

/** Tunable: 56" Worktable (small legs) – cabinet offset above floor and leg placement. */
export const FLOOR_OFFSET_SMALLLEGS = 0.07;

/** Inset from left/right so wheels sit inside cabinet geometry (not protruding). Used when front/back X not specified. */
const WHEEL_INSET_X = 0.12;
/** Workbench (7ft/9ft) wheels: X inset for front row and back row. */
export const WHEEL_INSET_X_FRONT = 0.12;
export const WHEEL_INSET_X_BACK = 0.12;

/** Inset Z: move wheels in from front edge. */
const WHEEL_INSET_Z_FRONT = 0.05;
/** Inset Z: move wheels in from back edge. */
const WHEEL_INSET_Z_BACK = 0.07;

/** Inset from left/right for leveling feet (riser). Used when front/back X not specified. */
const RISER_INSET_X = 0.1;
/** Workbench (7ft/9ft) leveling feet: X inset for front row and back row. */
export const RISER_INSET_X_FRONT = 0.1;
export const RISER_INSET_X_BACK = 0.1;
/** Inset Z: move leveling feet in from front edge. */
const RISER_INSET_Z_FRONT = 0.04;
/** Inset Z: move leveling feet in from back edge. */
const RISER_INSET_Z_BACK = 0.08;

/** Inset for legs (level_feet_only_old.glb) – Locker etc. */
const LEGS_INSET_X = -0.002;
const LEGS_INSET_Z_FRONT = -0.04;
const LEGS_INSET_Z_BACK = 0.01;

/** 11 Drawer (cabinetId 10) legs: tune X and Z position (inset from cabinet edges). */
export const LEGS_11D_INSET_X = 0.01;
export const LEGS_11D_INSET_Z_FRONT = -0.12;
export const LEGS_11D_INSET_Z_BACK = 0.01;

/** 11 Drawer legs height: floorY (cabinet base) and lift (so foot bottom sits on floor). */
export const LEGS_11D_FLOOR_Y = -0.094;
export const LEGS_11D_LIFT = 0.00;

/** Inset for small legs (small_legs.glb). Used when individual insets not specified. */
const SMALLLEGS_INSET_X = 0.08;
/** 56" Worktable: X inset for front row and back row (used if SMALLLEGS_INSET_X_BY_INDEX not used). */
export const SMALLLEGS_INSET_X_FRONT = 0.03;
export const SMALLLEGS_INSET_X_BACK = 0.03;
const SMALLLEGS_INSET_Z_FRONT = 0.04;
const SMALLLEGS_INSET_Z_BACK = 0.06;

/**
 * 56" Worktable small legs: individual X and Z inset per leg.
 * Order: [front-right, back-right, back-left, front-left].
 * X = inset from side (right for 0,1; left for 2,3). Z = inset from front (0,3) or back (1,2).
 */
export const SMALLLEGS_INSET_X_BY_INDEX = [0.04, 0.08, 0.04, 0.08];
export const SMALLLEGS_INSET_Z_BY_INDEX = [0.04, 0.06, 0.1, 0.04];

/** Y offset so leveling-feet model origin is placed relative to cabinet base. */
const LEVELING_FEET_FLOOR_Y = -0.098;
/** Lift so leveling-feet model bottom sits on floor (model origin is above bottom in level_feet_only.glb). */
const LEVELING_FEET_LIFT = 0.17;

/** Leveling feet low profile (2 in. lower): cabinet base Y so foot bottom sits on floor. */
const LEVELING_FEET_LOWPROFILE_FLOOR_Y = -0.0972;
/** Lift so level_feet_lowprofile.glb bottom sits on floor. */
const LEVELING_FEET_LOWPROFILE_LIFT = 0.17 - 0.0508;

/** Y offset so caster-wheel model bottom sits on floor (lift wheel so it doesn't sink into floor). */
const WHEEL_FLOOR_Y = 0.168;

/**
 * Tunable: Locker & 11 Drawer – legs (level_feet_only_old.glb).
 * floorY: foot model origin Y relative to cabinet base; lift: add to Y so foot bottom sits on floor.
 */
export const LEGS_FLOOR_Y = 0.073;
export const LEGS_LIFT = 0.0;

/**
 * Tunable: 56" Worktable – small legs (small_legs.glb).
 * floorY: foot model origin Y relative to cabinet base; lift: add to Y so foot bottom sits on floor.
 */
export const SMALLLEGS_FLOOR_Y = 0.03;
export const SMALLLEGS_LIFT = 0.04;

export function getFloorOffsetY(baseOption) {
  if (baseOption === "riser") return FLOOR_OFFSET_RISER;
  if (baseOption === "riserLowProfile") return FLOOR_OFFSET_RISER_LOWPROFILE;
  if (baseOption === "wheel") return FLOOR_OFFSET_WHEEL;
  if (baseOption === "legs") return FLOOR_OFFSET_LEGS;
  if (baseOption === "smallLegs") return FLOOR_OFFSET_SMALLLEGS;
  return FLOOR_OFFSET_NONE;
}

/**
 * World Y position for the cabinet group so the cabinet (none), leveling feet (riser), legs, small legs, or wheels sit on the floor.
 * Use this when positioning floor cabinets in the scene.
 * @param {string} baseOption
 * @param {{ legFloorYOverride?: number }?} placement - optional; legFloorYOverride used for "legs" when set
 */
export function getFloorCabinetBaseY(baseOption, placement = null) {
  if (baseOption === "riser") return FLOOR_Y - LEVELING_FEET_FLOOR_Y;
  if (baseOption === "riserLowProfile")
    return FLOOR_Y - LEVELING_FEET_LOWPROFILE_FLOOR_Y;
  if (baseOption === "legs") {
    const floorY =
      placement?.legFloorYOverride ??
      (placement?.cabinetId === 10 ? LEGS_11D_FLOOR_Y : LEGS_FLOOR_Y);
    return FLOOR_Y - floorY;
  }
  if (baseOption === "smallLegs") return FLOOR_Y - SMALLLEGS_FLOOR_Y;
  return FLOOR_Y; // none and wheel: cabinet base / wheel bottom on floor
}

/** Cabinet ids for workbench & cabinet packages (56" worktable pkg, 12/17/18/20/24/30 drawer packages). No feet options; base Y is fixed per package type. */
export const PACKAGE_CABINET_IDS = [16, 17, 18, 19, 20, 21, 22];

/**
 * Base option used for floor cabinet Y and feet when placing. Packages ignore user option: 16 = smallLegs, 17–22 = legs.
 * @param {number} cabinetId
 * @param {string|undefined} baseOption
 */
export function getBaseOptionForFloorCabinet(cabinetId, baseOption) {
  if (cabinetId === 16) {
    if (baseOption === "none") return "none";
    return "smallLegs";
  }
  if (PACKAGE_CABINET_IDS.includes(cabinetId)) return "legs";
  return baseOption ?? "none";
}

/** Y position of the workbench subgroup inside a drawer package so workbench base aligns with riser floor; lockers stay at package base (legs). */
export const WORKBENCH_GROUP_Y_IN_PACKAGE =
  (FLOOR_Y - LEVELING_FEET_FLOOR_Y) - (FLOOR_Y - LEGS_FLOOR_Y);

/**
 * Returns 4 corner transforms (position + rotation) for placing feet at cabinet base.
 * Same layout: front-right, back-right, back-left, front-left.
 * @param {number} width - cabinet width (X)
 * @param {number} depth - cabinet depth (Z)
 * @param {{ insetX?: number, insetXFront?: number, insetXBack?: number, insetZFront?: number, insetZBack?: number }} options - optional insets
 */
export function getFeetTransforms(width, depth, options = {}) {
  const insetX = options.insetX ?? 0;
  const insetXFront = options.insetXFront ?? insetX;
  const insetXBack = options.insetXBack ?? insetX;
  const insetZFront = options.insetZFront ?? 0;
  const insetZBack = options.insetZBack ?? 0;
  const hwFront = Math.max(0, width / 2 - insetXFront);
  const hwBack = Math.max(0, width / 2 - insetXBack);
  const zFront = Math.max(0, depth / 2 - FOOT_Z_OFFSET - insetZFront);
  const zBack = Math.min(0, -depth / 2 + insetZBack);
  return [
    { position: [hwFront, 0, zFront], rotation: [0, 0, 0] },
    { position: [hwBack, 0, zBack], rotation: [0, Math.PI / 2, 0] },
    { position: [-hwBack, 0, zBack], rotation: [0, Math.PI, 0] },
    { position: [-hwFront, 0, zFront], rotation: [0, -Math.PI / 2, 0] },
  ];
}

/**
 * Returns 4 corner transforms with individual X and Z inset per leg.
 * Order: front-right (0), back-right (1), back-left (2), front-left (3).
 * @param {number} width - cabinet width (X)
 * @param {number} depth - cabinet depth (Z)
 * @param {{ insetXByIndex: number[], insetZByIndex: number[] }} options - length-4 arrays; X = inset from side, Z = inset from front (0,3) or back (1,2)
 */
export function getFeetTransforms4FromIndividual(width, depth, options = {}) {
  const { insetXByIndex = [0, 0, 0, 0], insetZByIndex = [0, 0, 0, 0] } = options;
  return [
    {
      position: [
        Math.max(0, width / 2 - (insetXByIndex[0] ?? 0)),
        0,
        Math.max(0, depth / 2 - FOOT_Z_OFFSET - (insetZByIndex[0] ?? 0)),
      ],
      rotation: [0, 0, 0],
    },
    {
      position: [
        Math.max(0, width / 2 - (insetXByIndex[1] ?? 0)),
        0,
        Math.min(0, -depth / 2 + (insetZByIndex[1] ?? 0)),
      ],
      rotation: [0, Math.PI / 2, 0],
    },
    {
      position: [
        -Math.max(0, width / 2 - (insetXByIndex[2] ?? 0)),
        0,
        Math.min(0, -depth / 2 + (insetZByIndex[2] ?? 0)),
      ],
      rotation: [0, Math.PI, 0],
    },
    {
      position: [
        -Math.max(0, width / 2 - (insetXByIndex[3] ?? 0)),
        0,
        Math.max(0, depth / 2 - FOOT_Z_OFFSET - (insetZByIndex[3] ?? 0)),
      ],
      rotation: [0, -Math.PI / 2, 0],
    },
  ];
}

/**
 * Returns 6 transforms for workbench layout: 3 along front, 3 along back.
 * Order: front-right, front-center, front-left, back-right, back-center, back-left.
 * Uses insetXFront for front row X, insetXBack for back row X when provided.
 */
export function getFeetTransforms6(width, depth, options = {}) {
  const insetX = options.insetX ?? 0;
  const insetXFront = options.insetXFront ?? insetX;
  const insetXBack = options.insetXBack ?? insetX;
  const insetZFront = options.insetZFront ?? 0;
  const insetZBack = options.insetZBack ?? 0;
  const hwFront = Math.max(0, width / 2 - insetXFront);
  const hwBack = Math.max(0, width / 2 - insetXBack);
  const zFront = Math.max(0, depth / 2 - FOOT_Z_OFFSET - insetZFront);
  const zBack = Math.min(0, -depth / 2 + insetZBack);
  return [
    { position: [hwFront, 0, zFront], rotation: [0, 0, 0] },
    { position: [0, 0, zFront], rotation: [0, 0, 0] },
    { position: [-hwFront, 0, zFront], rotation: [0, -Math.PI / 2, 0] },
    { position: [hwBack, 0, zBack], rotation: [0, Math.PI / 2, 0] },
    { position: [0, 0, zBack], rotation: [0, Math.PI / 2, 0] },
    { position: [-hwBack, 0, zBack], rotation: [0, Math.PI, 0] },
  ];
}

/**
 * Renders wheel, leveling feet, legs, or small legs at 4 or 6 positions, or nothing if baseOption is "none".
 * Uses level_feet_only.glb (riser), level_feet_only_old.glb (legs), small_legs.glb (smallLegs), caster_wheel_w_rigids_2.glb (wheel).
 */
/**
 * Optional per-foot inset from front (only front feet: index 0 = front-right, 3 = front-left).
 * E.g. { 0: 0.18 } moves only the front-right foot further back.
 * footInsetXOverrideByIndex: extra inset from side (0,1 = move right foot left; 2,3 = move left foot right).
 */
const CabinetFeet = ({
  width,
  depth,
  placement,
  isGhost = false,
  insetZFrontOverride,
  insetZBackOverride,
  footInsetZFrontOverrideByIndex = {},
  footInsetXOverrideByIndex = {},
}) => {
  if (!placement) return null; // sub-component (e.g. locker inside package) has no own feet
  const baseOption = placement.baseOption ?? "none";
  if (baseOption === "none") return null;

  /** 7ft/9ft workbenches use 6 positions for both leveling feet and wheels; others use 4. */
  const useSixPositions =
    placement.cabinetId != null &&
    SIX_FEET_CABINET_IDS.includes(placement.cabinetId) &&
    (baseOption === "riser" ||
      baseOption === "riserLowProfile" ||
      baseOption === "wheel");

  const is11DLegs = baseOption === "legs" && placement.cabinetId === 10;
  const defaultInsetFront =
    baseOption === "wheel"
      ? insetZFrontOverride ?? WHEEL_INSET_Z_FRONT
      : baseOption === "riser" || baseOption === "riserLowProfile"
        ? insetZFrontOverride ?? RISER_INSET_Z_FRONT
        : baseOption === "legs"
          ? insetZFrontOverride ?? (is11DLegs ? LEGS_11D_INSET_Z_FRONT : LEGS_INSET_Z_FRONT)
          : baseOption === "smallLegs"
            ? insetZFrontOverride ?? SMALLLEGS_INSET_Z_FRONT
            : 0;
  const defaultInsetBack =
    baseOption === "wheel"
      ? insetZBackOverride ?? WHEEL_INSET_Z_BACK
      : baseOption === "riser" || baseOption === "riserLowProfile"
        ? insetZBackOverride ?? RISER_INSET_Z_BACK
        : baseOption === "legs"
          ? insetZBackOverride ?? (is11DLegs ? LEGS_11D_INSET_Z_BACK : LEGS_INSET_Z_BACK)
          : baseOption === "smallLegs"
            ? insetZBackOverride ?? SMALLLEGS_INSET_Z_BACK
            : 0;

  const transforms =
    baseOption === "wheel" && useSixPositions
      ? getFeetTransforms6(width, depth, {
          insetX: WHEEL_INSET_X,
          insetXFront: WHEEL_INSET_X_FRONT,
          insetXBack: WHEEL_INSET_X_BACK,
          insetZFront: defaultInsetFront,
          insetZBack: defaultInsetBack,
        })
      : baseOption === "wheel"
        ? getFeetTransforms(width, depth, {
            insetX: WHEEL_INSET_X,
            insetZFront: defaultInsetFront,
            insetZBack: defaultInsetBack,
          })
        : (baseOption === "riser" || baseOption === "riserLowProfile") &&
            useSixPositions
          ? getFeetTransforms6(width, depth, {
              insetX: RISER_INSET_X,
              insetXFront: RISER_INSET_X_FRONT,
              insetXBack: RISER_INSET_X_BACK,
              insetZFront: defaultInsetFront,
              insetZBack: defaultInsetBack,
            })
          : baseOption === "riser" || baseOption === "riserLowProfile"
            ? getFeetTransforms(width, depth, {
                insetX: RISER_INSET_X,
                insetZFront: defaultInsetFront,
                insetZBack: defaultInsetBack,
              })
            : baseOption === "legs"
              ? getFeetTransforms(width, depth, {
                  insetX: is11DLegs ? LEGS_11D_INSET_X : LEGS_INSET_X,
                  insetZFront: defaultInsetFront,
                  insetZBack: defaultInsetBack,
                })
              : baseOption === "smallLegs"
                ? getFeetTransforms4FromIndividual(width, depth, {
                    insetXByIndex: SMALLLEGS_INSET_X_BY_INDEX,
                    insetZByIndex: SMALLLEGS_INSET_Z_BY_INDEX,
                  })
                : getFeetTransforms(width, depth);

  // Apply per-foot front inset (only front feet: 4-foot = indices 0,3; 6-foot = 0,1,2)
  const frontFootIndices = useSixPositions ? [0, 1, 2] : [0, 3];
  frontFootIndices.forEach((i) => {
    const override = footInsetZFrontOverrideByIndex[i];
    if (override != null && transforms[i]) {
      const zFront = Math.max(
        0,
        depth / 2 - FOOT_Z_OFFSET - override
      );
      transforms[i].position[2] = zFront;
    }
  });

  // Apply per-foot X inset (4-foot: 0,1 = right feet move left; 2,3 = left feet move right. 6-foot: 0,3 right; 2,5 left.)
  const numFeet = transforms.length;
  [0, 1, 2, 3, 4, 5].slice(0, numFeet).forEach((i) => {
    const override = footInsetXOverrideByIndex[i];
    if (override != null && transforms[i]) {
      if (useSixPositions) {
        if (i === 0 || i === 3) transforms[i].position[0] -= override;
        else if (i === 2 || i === 5) transforms[i].position[0] += override;
      } else {
        if (i <= 1) transforms[i].position[0] -= override;
        else transforms[i].position[0] += override;
      }
    }
  });

  const Component =
    baseOption === "wheel"
      ? CasterWheel
      : baseOption === "legs"
        ? LegsFeet
        : baseOption === "smallLegs"
          ? SmallLegs
          : baseOption === "riserLowProfile"
            ? LevelingFeetLowProfile
            : LevelingFeet;

  const isLevelingFeet = baseOption === "riser";
  const isLevelingFeetLowProfile = baseOption === "riserLowProfile";
  const isLegs = baseOption === "legs";
  const isSmallLegs = baseOption === "smallLegs";
  const isWheel = baseOption === "wheel";

  const getPosition = (t) => {
    if (isLevelingFeet)
      return [
        t.position[0],
        t.position[1] + LEVELING_FEET_FLOOR_Y + LEVELING_FEET_LIFT,
        t.position[2],
      ];
    if (isLevelingFeetLowProfile)
      return [
        t.position[0],
        t.position[1] +
          LEVELING_FEET_LOWPROFILE_FLOOR_Y +
          LEVELING_FEET_LOWPROFILE_LIFT,
        t.position[2],
      ];
    if (isLegs) {
      const floorY =
        placement.legFloorYOverride ??
        (placement.cabinetId === 10 ? LEGS_11D_FLOOR_Y : LEGS_FLOOR_Y);
      const lift =
        placement.legLiftOverride ??
        (placement.cabinetId === 10 ? LEGS_11D_LIFT : LEGS_LIFT);
      return [
        t.position[0],
        t.position[1] + floorY + lift,
        t.position[2],
      ];
    }
    if (isSmallLegs)
      return [
        t.position[0],
        t.position[1] + SMALLLEGS_FLOOR_Y + SMALLLEGS_LIFT,
        t.position[2],
      ];
    if (isWheel)
      return [t.position[0], t.position[1] + WHEEL_FLOOR_Y, t.position[2]];
    return t.position;
  };

  return (
    <>
      {transforms.map((t, index) => (
        <Component
          key={index}
          position={getPosition(t)}
          rotation={isWheel ? [0, 0, 0] : t.rotation}
          {...(isLegs ? { isGhost } : {})}
        />
      ))}
    </>
  );
};

export default CabinetFeet;
