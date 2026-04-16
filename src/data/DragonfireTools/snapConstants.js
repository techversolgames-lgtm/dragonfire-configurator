/**
 * Centralized snap thresholds and options for DragonfireTools (reference-aligned).
 * See IMPLEMENTATION_GUIDE_WALL_SNAP_SELECTION.md for the portable spec.
 */

/** Wall-to-wall cabinet snap distance (m). */
export const SNAP_DISTANCE_THRESHOLD_WALL = 0.5;

/** Distance within which a floor item auto-rotates to face the wall (m). Alias for NEAREST_WALL_MAX_DISTANCE when used as "near wall" threshold. */
export const SNAP_DISTANCE_THRESHOLD_FLOOR_NEAR_WALL = 0.5;

/** Floor corner-to-wall snap distance (m). */
export const SNAP_DISTANCE_THRESHOLD_FLOOR = 0.5;

/** Item-to-item edge snap: max distance for left/right edge alignment (m). Spec: SNAP_THRESHOLD 0.2 m. */
export const SNAP_THRESHOLD_ITEM_EDGE = 0.1;

/** When dragging, use green-box edges only if desired position is within this distance (XZ) of current position. Beyond this, use logical edges so the user can drag away from a snap. */
export const DRAG_RELEASE_SNAP_DISTANCE_XZ = 0.35;

/**
 * Drag trace: max dot(ray.direction, wallNormal) to accept a wall hit as front-face.
 * Room wall normals point inward. Front-face = ray hits interior side → dot < 0.
 */
export const DRAG_WALL_FRONTFACE_DOT_MAX = 0;

/** When true, log drag trace wall hits for debugging outside-room drag. */
export const DEBUG_DRAG_TRACE_WALL_HITS = false;

/** Optional floor grid step (m). 0 = no grid; 0.05 = 5 cm grid. */
export const FLOOR_GRID_STEP = 0;

/** Optional gap when snapping to wall (m). Reference gapMm 0. */
export const WALL_SNAP_GAP = 0;

// --- Spec-aligned constants (IMPLEMENTATION_GUIDE_WALL_SNAP_SELECTION.md) ---

/** Max distance to consider "nearest wall" for snap candidate filtering (m). Spec: NEAREST_WALL_MAX_DISTANCE 0.6. */
export const NEAREST_WALL_MAX_DISTANCE = 0.6;

/** When cabinet back face is within this distance of a wall, treat as collision and change rotation to face that wall (m). */
export const WALL_COLLISION_ROTATE_THRESHOLD = 0.02;

/** Pointer move > this (px) → treat as drag, not click. Spec: DRAG_THRESHOLD_PX 5. */
export const DRAG_THRESHOLD_PX = .2;

/** Face is "vertical" if |normal.y| ≤ this. For wall-mesh raycast filtering. Spec: WALL_VERTICAL_THRESHOLD 0.5. */
export const WALL_VERTICAL_THRESHOLD = 0.5;

/** Round position by (x * PRECISION_ROUND) / PRECISION_ROUND to avoid float noise. Spec: PRECISION_ROUND 1e10. */
export const PRECISION_ROUND = 1e10;

/** Shrink AABBs by this (m) to allow touching without overlap. For AABB separation / wall clamping. Spec: TOUCH_EPSILON 0.001. */
export const TOUCH_EPSILON = 0.001;

/** Minimum gap (m) between floor items; treat as overlap if closer. Used so side-by-side snap leaves this gap and passes overlap check. */
export const MIN_FLOOR_ITEM_GAP = 0.000;

/** When true, log active wall and rotation during floor cabinet drag (for debugging continuous wall rotation). */
export const DEBUG_WALL_DRAG_ROTATION = false;

// --- Corner cabinet snap (room corners only) ---
// Change these values to tune snap behaviour and debug visuals.

/** Max distance (m) from cabinet corner anchor to a room corner snap point to trigger snap. */
export const CORNER_SNAP_THRESHOLD_DISTANCE = 0.5;

/** When true, corner snap points are drawn in the scene (only visible while dragging a corner cabinet). */
export const DEBUG_CORNER_SNAP_POINTS_VISIBLE = true;

/** Debug marker: sphere radius (m) at each corner point. */
export const CORNER_DEBUG_SPHERE_RADIUS = .1;

/** Debug marker: height (m) above floor so spheres sit on top of floor plane. */
export const CORNER_DEBUG_MARKER_HEIGHT = 0.1;

/** Debug marker: ring inner/outer offset (m) around CORNER_SNAP_THRESHOLD_DISTANCE for the snap-radius circle. */
export const CORNER_DEBUG_RING_OFFSET = 0.03;

/** Debug marker: number of segments for sphere and ring (higher = smoother). */
export const CORNER_DEBUG_SPHERE_SEGMENTS = 20;
export const CORNER_DEBUG_RING_SEGMENTS = 40;

/** Debug marker: hex colors (inactive corner, active/highlighted corner). */
export const CORNER_DEBUG_COLOR_INACTIVE = "#dd22aa";
export const CORNER_DEBUG_COLOR_ACTIVE = "#ff6600";

/** Debug marker: opacity for sphere and ring (0–1). */
export const CORNER_DEBUG_SPHERE_OPACITY = 0.9;
export const CORNER_DEBUG_RING_OPACITY = 0.5;

/**
 * Per-wall inset offsets (m) to shift corner snap points.
 *
 * Each corner snap point is computed as an intersection of two wall planes
 * shifted inward by their respective inset amounts (positive = into the room).
 *
 * You can manually tweak these values in code to align lower corner cabinets
 * with your room/wall geometry.
 */
export const CORNER_WALL_INSET_OFFSETS = {
  front: 0,
  right: 0,
  back: 0,
  left: 0,
};

/**
 * Per-corner manual snap-point offsets.
 *
 * Index order matches the corner-to-walls order in `cornerSnapPoints.js`:
 * 0: front-left, 1: front-right, 2: back-right, 3: back-left
 */
export const CORNER_SNAP_POSITION_OFFSETS = [
  { x: -0.2, y: 0, z: .2},
  { x: 0, y: 0, z: .2 },
  { x: 0.2,y: 0, z:  -0.2},
  { x: 0, y: 0, z: -0.2},
];

/**
 * Per-corner rotation offsets in degrees.
 *
 * Note: floor cabinet rendering currently applies only Y rotation.
 * We still expose x/z here so you can tune values in one place,
 * but only `y` is applied to `rotationY` for now.
 */
export const CORNER_SNAP_ROTATION_OFFSETS_DEG = [
  { x: 90, y: -45, z: 90 },
  { x: 0, y: -45, z: 0 },
  { x: 0, y:-45, z: 0 },
  { x: 0, y: -45, z: 0 },
];

/**
 * Separate per-corner offsets for lower/upper corner cabinets.
 * Edit these for independent tuning.
 * Index order: [0] front-left, [1] front-right, [2] back-right, [3] back-left.
 */
export const CORNER_SNAP_POSITION_OFFSETS_LOWER = CORNER_SNAP_POSITION_OFFSETS;
export const CORNER_SNAP_ROTATION_OFFSETS_DEG_LOWER =
  CORNER_SNAP_ROTATION_OFFSETS_DEG;

export const CORNER_SNAP_POSITION_OFFSETS_UPPER = [
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 0, z: 0 },
];
export const CORNER_SNAP_ROTATION_OFFSETS_DEG_UPPER = [
  { x: 0, y: 45, z: 0 },
  { x: 0, y: 45, z: 0 },
  { x: 0, y: 45, z: 0 },
  { x: 0, y: 45, z: 0 },
];

// --- Per-corner cabinet rotation (degrees) ---
// When the cabinet snaps to a corner, it uses this rotation. Set to null to use auto (bisector of the two walls).
// Order: [0] front-left, [1] front-right, [2] back-right, [3] back-left.
// Example: 45 = face 45° from +Z; -90 = face left; 0 = face +Z (forward).
export const CORNER_ROTATION_DEGREES = [
    [180, 0, 0, -0], // 0: front-left  (null = auto)
    [0, 2, 0, -0], // 1: front-right
    [0, 0, 0, -0], // 2: back-right
    [0, 0, 0, -0], // 3: back-left
];
