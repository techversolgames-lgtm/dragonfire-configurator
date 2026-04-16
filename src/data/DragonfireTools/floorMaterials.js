/**
 * Floor materials: re-export from library for backward compatibility.
 * New code should use floorMaterialLibrary (getFloorMaterialById, resolveFloorMaterial).
 */
export {
  FLOOR_MATERIALS,
  DEFAULT_FLOOR_MATERIAL_ID,
  getFloorMaterialById,
  getFloorMaterialDefaultTextureTiles,
  getDefaultFloorMaterial,
  resolveFloorMaterial,
} from "./floorMaterialLibrary.js";
