/**
 * Shared ref for the cabinet group currently being dragged.
 * Updated by GenerateAllCabinetsInScene on each render so the outline
 * always targets the live group (avoids stale ref when position updates during drag).
 */
export const draggedCabinetGroupRef = { current: null };

/**
 * Refs to placed cabinet groups by index (for overlap outline).
 * GenerateAllCabinetsInScene sets cabinetGroupRefsRef.current[i] = group for each placed item.
 */
export const cabinetGroupRefsRef = { current: [] };

/**
 * True when pointer down was on a placed cabinet. Used so we don't clear selection
 * when the user releases over the floor/wall after clicking a cabinet (outline stays).
 */
export const pointerDownOnPlacedItemRef = { current: false };

/**
 * Latest snap result for the currently dragged floor cabinet (written each frame by RayReceiverFloorPlane).
 * Used so the visual rotation/position updates in the same frame, before React state has flushed.
 * Shape: { position: {x,y,z}, dragPointNormal: {x,z}, rotationY: number, snappedWallId?: string } | null
 */
export const draggedFloorSnapResultRef = { current: null };

/**
 * Pointer handlers for library floor placement (RayReceiverFloorPlane).
 * RoomModel wall meshes call these on pointer up/move/down so release over a wall
 * still commits when the invisible floor receiver is not the hit target.
 * Shape: { onPointerMove, onPointerUp, onPointerDown } | null
 */
export const libraryFloorPointerHandlersRef = { current: null };
