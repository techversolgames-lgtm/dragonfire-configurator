/**
 * Floor material definitions and resolver (per spec §16).
 * Each material: id, name, category, type, defaultColor, PBR maps, roughness, metalness.
 */

/** @typedef {'colors'|'textures'} FloorMaterialType */
/** @typedef {string} FloorMaterialCategory */
/** @typedef {string} FloorMaterialSubcategory */

/**
 * @typedef {Object} FloorMaterialDefinition
 * @property {string} id
 * @property {string} name
 * @property {FloorMaterialCategory} category
 * @property {FloorMaterialSubcategory} [subcategory]
 * @property {FloorMaterialType} type
 * @property {string} defaultColor
 * @property {string} [albedoMap]
 * @property {string} [normalMap]
 * @property {string} [roughnessMap]
 * @property {string} [metallicMap]
 * @property {string} [aoMap]
 * @property {string} [displacementMap]
 * @property {number} [roughness]
 * @property {number} [metalness]
 * @property {string} [thumbnail]
 * @property {boolean} [useExrFallback] - use default material's EXR for normal/roughness (avoids load failures)
 * @property {number} [defaultTextureTileX] - default UV repeat X when this material is selected
 * @property {number} [defaultTextureTileY] - default UV repeat Y when this material is selected
 */

const FLOOR_MATERIAL_DEFINITIONS = [
  {
    id: "Gravel Concrete_BROWN",
    name: "Gravel Concrete (Brown)",
    category: "concrete",
    type: "textures",
    defaultColor: "#8a7a6a",
    albedoMap: "/textures/Floor/Gravel Concrete_BROWN/gravel_concrete_04_diff_1k.jpg",
    normalMap: "/textures/Floor/Gravel Concrete_BROWN/gravel_concrete_04_nor_gl_1k.exr",
    roughnessMap: "/textures/Floor/Gravel Concrete_BROWN/gravel_concrete_04_rough_1k.exr",
    roughness: 0.95,
    metalness: 0,
    defaultTextureTileX: 1,
    defaultTextureTileY: 1,
  },
  {
    id: "gravel_concrete_black",
    name: "Gravel Concrete (Black)",
    category: "concrete",
    type: "textures",
    defaultColor: "#3a3a3a",
    albedoMap: "/textures/Floor/gravel_concrete_black/textures/gravel_concrete_03_diff_1k.jpg",
    normalMap: "/textures/Floor/gravel_concrete_black/textures/gravel_concrete_03_nor_gl_1k.exr",
    roughnessMap: "/textures/Floor/gravel_concrete_black/textures/gravel_concrete_03_rough_1k.exr",
    roughness: 0.95,
    metalness: 0,
    defaultTextureTileX: 1,
    defaultTextureTileY: 1,
  },
  {
    id: "BLACK_TILES",
    name: "Black Tiles",
    category: "tiles",
    type: "textures",
    defaultColor: "#1a1a1a",
    albedoMap: "/textures/Floor/BLACK_TILES/textures/rubber_tiles_diff_1k.jpg",
    normalMap: "/textures/Floor/BLACK_TILES/textures/rubber_tiles_nor_gl_1k.exr",
    roughnessMap: "/textures/Floor/BLACK_TILES/textures/rubber_tiles_rough_1k.exr",
    roughness: 0.9,
    metalness: 0,
    defaultTextureTileX: 8,
    defaultTextureTileY: 4,
  },
  {
    id: "concrete_worn",
    name: "Concrete Worn",
    category: "concrete",
    type: "textures",
    defaultColor: "#6a6560",
    albedoMap: "/textures/Floor/concrete_worn/textures/concrete_floor_worn_001_diff_1k.jpg",
    normalMap: "/textures/Floor/concrete_worn/textures/concrete_floor_worn_001_nor_gl_1k.exr",
    roughnessMap: "/textures/Floor/concrete_worn/textures/concrete_floor_worn_001_rough_1k.exr",
    roughness: 0.95,
    metalness: 0,
  },
];

const MATERIAL_BY_ID = new Map(
  FLOOR_MATERIAL_DEFINITIONS.map((m) => [m.id, m])
);

export const DEFAULT_FLOOR_MATERIAL_ID = "concrete_worn";

/**
 * Resolve floor material by id (spec §16.3).
 * @param {string|null|undefined} id
 * @returns {FloorMaterialDefinition|null}
 */
export function getFloorMaterialById(id) {
  if (!id) return null;
  return MATERIAL_BY_ID.get(id) ?? null;
}

/**
 * Default UV tiling for a floor material when selected (sidebar / store sync).
 * @param {string|null|undefined} materialId
 * @returns {{ x: number, y: number } | null}
 */
export function getFloorMaterialDefaultTextureTiles(materialId) {
  const m = getFloorMaterialById(materialId);
  if (
    !m ||
    typeof m.defaultTextureTileX !== "number" ||
    typeof m.defaultTextureTileY !== "number"
  ) {
    return null;
  }
  return { x: m.defaultTextureTileX, y: m.defaultTextureTileY };
}

/**
 * Default floor material when none selected or id missing (spec §16.3).
 * @returns {FloorMaterialDefinition}
 */
export function getDefaultFloorMaterial() {
  const def =
    getFloorMaterialById(DEFAULT_FLOOR_MATERIAL_ID) ?? FLOOR_MATERIAL_DEFINITIONS[0];
  return def;
}

/**
 * Get the floor material to use (selected or default).
 * @param {string|null|undefined} selectedFloorMaterialId
 * @returns {FloorMaterialDefinition}
 */
export function resolveFloorMaterial(selectedFloorMaterialId) {
  return (
    getFloorMaterialById(selectedFloorMaterialId) ?? getDefaultFloorMaterial()
  );
}

/** Backward compat: map id -> definition for dropdown options. */
export const FLOOR_MATERIALS = Object.fromEntries(
  FLOOR_MATERIAL_DEFINITIONS.map((m) => [m.id, { label: m.name, ...m }])
);
