summary goes here: Wall dragging implementation details including normal rotation and yellow highlight behavior.

## Cabinet Dragging System

### Architecture

- **Floor cabinets** (itemType === "floor"): Dragged via `RayReceiverFloorPlane.jsx`
- **Wall cabinets** (itemType === "wall"): Dragged via `RoomModel.jsx`

### Key State Variables (useDragNDropStore)

- `draggedCabinetIndex`: Index in `placedPositions` array of the cabinet being dragged
- `isFloorDragEnabled`: Flag for floor cabinet dragging
- `isWallDragEnabled`: Flag for wall cabinet dragging
- `isOrbitControlsEnabled`: Controls camera orbit (disabled during drag)
- `dragPointNormal`: Normal vector of the wall surface (used for wall cabinet rotation)
- `placedPositions`: Array of placed cabinets with structure: `{ cabinetId, position: {x,y,z}, dragPointNormal }`

### Drag Flow

1. **PointerDown on cabinet** (`GenerateAllCabinetsInScene.jsx`):
   - Get `itemType` from `reverseIdMap[onePosition.cabinetId]`
   - Store `draggedCabinetIndex`
   - Enable `isFloorDragEnabled` if itemType === "floor"
   - Enable `isWallDragEnabled` if itemType === "wall"
   - Disable orbit controls

2. **PointerMove** (RayReceiverFloorPlane or RoomModel):
   - Store original cabinet position on first move (in `originalCabinetPositionRef`)
   - Calculate displacement vector from drag start point
   - **For walls only**: Update `dragPointNormal` when surface normal changes (rotates cabinet to match wall)
   - Update `placedPositions[draggedCabinetIndex].position = originalPosition + displacement`
   - **For walls only**: Also update `dragPointNormal` in the placed position

3. **PointerUp** (`GenerateAllCabinetsInScene.jsx`):
   - Clear `draggedCabinetIndex`
   - Disable both `isFloorDragEnabled` and `isWallDragEnabled`
   - Re-enable orbit controls
   - Reset refs for next drag (done in RayReceiverFloorPlane/RoomModel)

### Critical Pattern

Always add displacement to the **original** position stored in a ref, not the continuously updated state position, to avoid exponential movement.

### Wall Normal Rotation

- Wall cabinets use `dragPointNormal` (from raycaster's `e.normal`) to determine rotation
- During drag, if the normal changes (cabinet crosses to different wall), update both:
  - Global `dragPointNormal` in store
  - Local `dragPointNormal` in the cabinet's `placedPositions` entry
- Rotation is calculated in `GenerateAllCabinetsInScene.jsx` using `xzNormalToRotationAngle(dragPointNormal)`

### Visual Feedback

- Yellow highlight planes appear on walls when:
  - `selectedDeckItem?.itemType === "wall"` (placing new cabinet), OR
  - `isWallDragEnabled === true` (dragging existing cabinet)
- Condition: `(!selectedDeckItem && !isWallDragEnabled) || (selectedDeckItem?.itemType !== "wall" && !isWallDragEnabled)` shows hidden material, otherwise shows yellow

### Displacement Vectors

- **Floor**: `floorDragDisplacementVector` (in RayReceiverFloorPlane.jsx)
- **Wall**: `wallDragDisplacementVector` (in RoomModel.jsx)
- These are separate to prevent cross-contamination between floor and wall dragging

## Overlapping Cabinet Pointer Event Fix (Feb 2026)

### Problem

When cabinets overlap in the scene, R3F's `onPointerDown` fires for each intersected cabinet (closest to furthest, synchronously). Each call overwrote `draggedCabinetIndex` in the store, so the **furthest** cabinet ended up selected instead of the closest.

### Fix

Added `if (isPointerDownRef.current) return;` as the first line of `handlePointerDown` in `GenerateAllCabinetsInScene.jsx`. Since R3F dispatches events synchronously closest-first, the first (closest) cabinet sets the ref to `true`, and all subsequent (further) cabinets bail out.

### Why not `e.stopPropagation()`?

`stopPropagation()` would prevent the ray from reaching `RayReceiverFloorPlane`, which needs `onPointerMove` events to track drag position. The ref guard is scoped to the cabinet component only and doesn't interfere with the floor plane's event handlers.

## Cabinet Orange Outline via activeSceneItem (Feb 2026)

### Overview

Cabinets now get an orange outline (same as wall selection) when hovered/dragged. The outline persists until the floor is clicked.

### Implementation

`OutlinesManager.jsx` subscribes to `activeSceneItem` from `useDragNDropStore`. Because the `Outline` effect from react-postprocessing only enables the selection layer on the **exact objects** passed (not their children), we must **traverse** the `activeSceneItem` group and collect all child meshes (`child.isMesh`) into the selection array. This ensures every mesh in the cabinet subtree gets the outline layer.

### Data Flow

1. **Hover cabinet** → `handlePointerEnter` in `GenerateAllCabinetsInScene.jsx` sets `activeSceneItem` to position group
2. **Pointer down (redundant)** → `handlePointerDown` also sets `activeSceneItem` to position group via `e.eventObject.children[0]`
3. **OutlinesManager.jsx** reads `activeSceneItem` → traverses tree → collects all meshes → feeds to `selectionArray` memo
4. **Outline effect** enables selection layer on each mesh → renders orange outline
5. **Click floor** → `RoomModel.jsx` `handleClick` clears `activeSceneItem` to `null` → outline disappears

### Critical Detail: Why Traverse is Required

The postprocessing `OutlineEffect` uses `object.layers.enable(selectionLayer)` on each object in the selection set. This only sets the layer on the **specific object**, not its descendants. Passing a Group directly means the Group gets the layer but none of its child meshes do — so nothing renders in the outline mask. Walls work because `selectedWall` refs point directly to `<mesh>` elements.

### Click Propagation Fix

The cabinet group in `GenerateAllCabinetsInScene.jsx` has `onClick={(e) => e.stopPropagation()}`. Without this, clicking on a cabinet sends the click ray through to the RoomModel's floor mesh, whose `handleClick` clears `activeSceneItem` to `null` — killing the outline immediately. `stopPropagation` on `onClick` only blocks click events; `onPointerMove`/`onPointerDown`/`onPointerUp` still propagate through to `RayReceiverFloorPlane` for drag tracking.

## Cabinet Package Templates - Leveling Feet & Positioning (Feb 2026)

### Changes Applied to All Package Templates

All cabinet package templates in `cabinetPackages/` directory (except `56WorktablePTemplate.jsx`) now include:

1. **LevelingFeet Import**: Added `import LevelingFeet from "../LevelingFeet"`

2. **Leveling Feet Transforms Array**:
   - Four leveling feet positioned at corners of base drawer dimensions
   - Front feet: Z position adjusted by `-0.0175` to move slightly back
   - Rotations: 0°, 90°, 180°, -90° for each corner

3. **Cabinet Lift**:
   - Base drawer templates wrapped in `<group position={[0, 0.165, -0.0175]}>`
   - Wall cabinets wrapped in `<group position={[0, 0.165, 0]}>`
   - Y-axis lift of `0.165` raises cabinets off ground
   - Z-axis offset of `-0.0175` moves base drawers back slightly

4. **Wall Cabinet Z Position**:
   - Modified calculation to multiply by 0: `(0 * wallCabinetDimensions.depth) / 2`
   - Temporarily disables wall cabinet depth addition, moving them forward

5. **Leveling Feet Rendering**:
   - Rendered using `.map()` over `levelingFeetTransforms` array
   - Positioned and rotated according to transform data

### Files Modified

- `12DrawerPTemplate.jsx` (original reference)
- `17DrawerPTemplate.jsx`
- `18DrawerPTemplate.jsx`
- `20DrawerPTemplate.jsx`
- `24DrawerPTemplate.jsx`
- `30DrawerPTemplate.jsx`

### Not Modified

- `56WorktablePTemplate.jsx` (excluded per requirements)

## RotationGizmo Integration (Feb 2026)

### Overview

`RotationGizmo.jsx` renders a blue torus above the active scene item. Dragging the torus rotates the item around the world Y-axis with 5° snap increments. A green arc indicator shows the rotation delta during drag.

### Wiring

1. **Store** (`useDragNDropStore.js`):
   - `activeSceneItem`: Holds a reference to the Three.js position group of the hovered cabinet
   - `setIsOrbitControlsEnabled`: Added as a named setter (was previously only set via `setState`)

2. **GenerateAllCabinetsInScene.jsx**:
   - `handlePointerEnter`: Sets `activeSceneItem` to `e.eventObject.children[0]` (the position group `<group position={[x,y,z]}>`)
   - The position group now has `userData={{ itemType }}` so gizmo/other systems can read it
   - `activeSceneItem` persists on pointer leave — it stays until the floor/ceiling is clicked

3. **RoomModel.jsx**:
   - `handleClick` for floor/ceiling: Clears `activeSceneItem` to `null` (alongside clearing `selectedWall`)

4. **BaseCanvas.jsx**:
   - `<RotationGizmo />` rendered inside the Canvas after `<DragMovementManager />`

### Why the Position Group?

The cabinet render structure is:

```
<group key={_} onPointerEnter={...}>       ← outer group (no position/rotation)
  <group position={[x, y, z]} userData>    ← POSITION GROUP (activeSceneItem target)
    <group rotation={[0, yRotation, 0]}>   ← rotation group (declarative rotation)
      <ModelComponent />
    </group>
  </group>
</group>
```

- RotationGizmo reads `.position` from the position group → correct world coords
- RotationGizmo writes `.quaternion` on the position group → no conflict with the declarative `rotation` prop on the child rotation group
- `Box3.setFromObject()` includes all children → correct bounding box for gizmo sizing

### RotationGizmo.jsx Fixes Applied

- Import path fixed: `@/store/` → `@/stores/`
- Removed `activeSceneItem.userData.itemType === "floor"` restriction — gizmo now shows for any hovered item
- **World-space raycasting refactor (latest)**: Replaced the entire screen-space angle approach with world-space raycasting. The old approach used `getAngleFromPointer` (screen-space `atan2(dy, dx)` from projected object center) which broke at non-top-down camera angles — CCW drag would rotate CW at some angles because screen-space angular motion doesn't map consistently to world-Y rotation across camera orientations. The `cameraFlip` hack only handled the below-gizmo case, not general tilt.
  - **New approach**: On pointer down, the initial world angle is computed from `event.point` (R3F intersection). On each pointer move, a `THREE.Raycaster` casts the pointer onto a `THREE.Plane(normal=(0,1,0), constant=-gizmoY)` (horizontal plane at gizmo height). The world-space intersection gives a true XZ angle via `atan2(dz, dx)` relative to gizmo center. Delta is accumulated with negation (`-= delta`, no cameraFlip) because `atan2(dz, dx)` in the XZ plane increases in the opposite winding to Three.js positive-Y rotation when viewed from above.
  - **Removed**: `objectScreenPos` ref, `rotationSpeed` variable (was 0.995, then 1 — no longer needed), `cameraFlip` logic, `updateObjectScreenPos()` function, `getAngleFromPointer()` function
  - **Edge case**: If the ray is parallel to the plane (camera looking perfectly horizontal), `intersectPlane` returns false and the frame is skipped gracefully
- **Gizmo Y position fix**: Uses `userData.boundingBoxHeight` (from `reverseIdMap` bounding box `height`) instead of `Box3` half-height. The `boundingBoxHeight` is passed via the position group's `userData` in `GenerateAllCabinetsInScene.jsx`, placing the torus at the **top** of the cabinet instead of the middle. Falls back to `Box3.y` if `boundingBoxHeight` is not set.

## Bounding Box Corner Detection for Floor Items (Feb 2026)

### Purpose

Groundwork for wall-snapping: compute the 4 bottom-plane corners of a floor cabinet's bounding box in world space while the item is being moved.

### Where the Corners are Logged

Both console.logs are in `GenerateAllCabinetsInScene.jsx`:

1. **Ghost (new placement)** — lines ~120-134: Fires when `GhostModelComponent` is truthy AND `selectedDeckItem.itemType !== "wall"`. Uses `ghostPosition` (x/z), `ghostWidth`, `ghostDepth`, and `yRotationGhost`.

2. **Dragged placed item** — lines ~175-187: Fires inside `placedPositions.map()` when the loop index `_` matches `draggedCabinetIndex` AND `itemType !== "wall"`. Uses the item's `{x, z}` position, `width`, `depth` from `reverseIdMap`, and `yRotation` from `dragPointNormal`.

### Corner Math

Local-space bottom corners (bounding box centered at origin):

- FL: `(-w/2, 0, -d/2)`, FR: `(+w/2, 0, -d/2)`, BL: `(-w/2, 0, +d/2)`, BR: `(+w/2, 0, +d/2)`

Transformed to world space via Three.js Y-rotation matrix then translation:

- `worldX = posX + lx*cos(θ) + lz*sin(θ)`
- `worldZ = posZ - lx*sin(θ) + lz*cos(θ)`

### Key Data Sources

- **Bounding box dimensions**: `reverseIdMap[cabinetId].boundingBox` — built from all cabinet option arrays in `cabinetItems.js`
- **Position**: Ghost uses `ghostPosition` (derived from `floorPoint` or `airDragPoint`). Placed items use `placedPositions[index].position`.
- **Rotation**: `yRotation` from `dragPointNormal` via `xzNormalToRotationAngle()`. For floor items without a `dragPointNormal`, this is 0. Note: RotationGizmo imperative quaternion is NOT yet accounted for in corner math.

### Store Additions in This Component

- `draggedCabinetIndex` — now subscribed reactively (was only set/cleared before, never read as state in this component)

## Floor-Level Wall Planes for Wall Snapping (Feb 2026)

### Purpose

Visual indicator planes at floor level to assist with wall-snapping functionality. These cyan planes mark where floor cabinets can snap to walls.

### Implementation in RoomModel.jsx

Added 4 cyan floor-level wall planes (one for each wall: front, back, left, right):

- **Position**: `[0, 0.05, 0]` — Y=0.05 to sit just above the floor
- **Scale**: `[1, 0.005, 1]` — Y-scale of 0.005 makes them thin vertical planes (same technique as yellow upper wall planes)
- **Color**: `cyan` (matching RotationGizmo blue theme)
- **Material**: `meshBasicMaterial` with `transparent={true}`, `depthTest={false}`, `depthWrite={false}` (same as yellow planes)
- **Geometry**: `<custom4PointPlane>` using the same wall args as their corresponding walls (`frontWallArgs`, `backWallArgs`, `leftWallArgs`, `rightWallArgs`)

### Location in Code

Lines added after each yellow wall plane block:

- Front wall floor plane: ~lines 402-415
- Back wall floor plane: ~lines 461-474
- Left wall floor plane: ~lines 520-533
- Right wall floor plane: ~lines 579-592

### Current State

Always visible (no conditional toggling yet). Next step will be to add conditional visibility based on floor cabinet drag state, similar to how yellow planes toggle based on `selectedDeckItem?.itemType === "wall"` and `isWallDragEnabled`.

## Wall Plane Equations & Corner-to-Wall Distances (Feb 2026)

### Purpose

Compute the mathematical plane equation for each of the 4 room walls, then measure signed distances from each bounding box corner to each wall. This is the core math needed for wall-snapping.

### Wall Plane Computation (GenerateAllCabinetsInScene.jsx, lines ~84-122)

Uses `computeQuadPoints` (same util as `RoomModel.jsx`) to derive the floor corner positions from `wallWidthValues`, then computes a plane equation per wall.

**Floor corners in world XZ** (from `computeQuadPoints`, z-inverted):

- P0: `(p1.x, -p1.y)`, P1: `(p2.x, -p2.y)`, P2: `(p3.x, -p3.y)`, P3: `(p4.x, -p4.y)`

**Wall edges** (matching `RoomModel.jsx` wall args order):

- Front: P0 → P1, Right: P1 → P2, Back: P2 → P3, Left: P3 → P0

**Plane equation** (simplified for vertical walls — only XZ matters):

- `nx * x + nz * z + d = 0`
- Normal `(nx, nz)` is perpendicular to wall direction, normalized to unit length
- `d = -(nx * wallPointX + nz * wallPointZ)`
- Normal is flipped if needed so it points **inward** (origin at room center gives positive distance)

**Signed distance** from point `(px, pz)` to wall: `nx * px + nz * pz + d`

- Positive = inside room (between wall and center)
- Negative = outside room (past the wall)

### Console Log Output

Each log entry per corner contains:

- `label`: Corner name (FL, FR, BL, BR)
- `x, z`: World position of the corner
- `dists`: Object with `{ front, right, back, left }` signed distances
- `closestWall`: `{ name, dist }` of the wall with smallest distance

### Dependencies Added to GenerateAllCabinetsInScene

- `useMemo` (from react)
- `useAnimationStore` (for `wallWidthValues`)
- `computeQuadPoints` (from `@/utils/computeQuadPoints`)
- `wallPlanes` is memoized, only recomputes when `wallWidthValues` changes

## Snap Distance Threshold & Cyan Plane Toggling (Feb 2026)

### Overview

Cyan floor-level wall planes now toggle on/off per-wall based on whether any bounding box corner of the moving floor cabinet is within `SNAP_DISTANCE_THRESHOLD` (0.2m) of that wall.

### Data Flow

1. **GenerateAllCabinetsInScene.jsx** computes which walls are "near":
   - `SNAP_DISTANCE_THRESHOLD = 0.2` (constant, line ~20)
   - `snapNearWallsRef` (useRef) reset to all-false each render
   - In ghost and dragged blocks, after computing `cornerDistances`, checks if any corner's signed distance to each wall is below threshold
   - `useEffect` (no deps, runs every render) compares ref to current store value and only pushes `snapNearWalls: { front, right, back, left }` when changed

2. **RoomModel.jsx** reads `snapNearWalls` from store:
   - `const snapNearWalls = useDragNDropStore((state) => state.snapNearWalls)`
   - Each cyan plane conditionally renders `#007bff` material or `hiddenWallMaterial` based on `snapNearWalls?.wallName`

### Store Shape

`useDragNDropStore.snapNearWalls`: `{ front: boolean, right: boolean, back: boolean, left: boolean }` — which walls have a cabinet corner within snap threshold

## Wall Snapping Logic (Feb 2026)

### Overview

When a floor cabinet's bounding box corner gets within `SNAP_DISTANCE_THRESHOLD / 2` of a wall, the cabinet is visually and physically snapped flush against that wall. Supports corner snapping (2 walls simultaneously).

### Math: `computeSnapOffset(corners, wallPlanes, threshold)`

Located in `GenerateAllCabinetsInScene.jsx` (line ~22). Pure function, no side effects.

For each wall plane:

1. Compute signed distances from all 4 bounding box corners to the wall
2. Find `minDist = Math.min(...dists)` (closest corner)
3. If `minDist < threshold / 2`: offset the position by `-minDist * wallNormal`
   - Positive minDist (near wall, inside room): pulls cabinet toward wall
   - Negative minDist (past wall): pushes cabinet back inside
   - Zero (on wall): no adjustment

Returns `{ x: offsetX, z: offsetZ }` — the total snap correction. Multiple walls can contribute (e.g., corner snap) since perpendicular normals produce independent offsets.

### Application Points

**Ghost item (new placement):**

- `ghostSnapOffsetRef` computed in ghost block, used for render position
- Synced to store as `ghostSnapOffset` via useEffect (for cross-component access)
- `RayReceiverFloorPlane.jsx` reads `ghostSnapOffset` from store on placement and applies it to `e.point`

**Dragged item (existing):**

- `dragSnapOffX/Z` local variables in map callback, used for render position
- `dragSnapOffsetRef` stores the offset for persistence
- `handlePointerUp` applies snap offset to stored `placedPositions` entry, then clears ref

### Parallel-to-wall dragging

The snap only adjusts the normal-to-wall component of position. The parallel component comes from the raw drag position, which the drag handler updates freely. So the cabinet can slide along a wall while staying flush.

### Store Additions

- `useDragNDropStore.ghostSnapOffset`: `{ x: number, z: number }` — current ghost snap offset, used by RayReceiverFloorPlane on placement
