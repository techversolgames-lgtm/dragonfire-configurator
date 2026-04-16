/**
 * Shared ref so GenerateAllCabinetsInScene knows when the rotation gizmo is
 * driving the mesh. During drag we update rotation in real time (no store updates);
 * store is written only on release.
 */
export const isRotationGizmoDraggingRef = { current: false };
