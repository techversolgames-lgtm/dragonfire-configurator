/**
 * Material schemes for DragonfireTools cabinets (e.g. 17D).
 * Two schemes: Matte (Gunmetal-style) vs Gloss (Gloss Black-style).
 * Per-part roughness, metalness, and envMapIntensity override the GLB materials.
 */

/** Node names in the GLB hierarchy that identify parts (case-insensitive, spaces/underscores normalized). */
export const PART_NAMES = [
  "Tool_Box",
  "ToolBox",
  "Drawer",
  "Handle",
  "Lock",
  "Riser",
  "Wheel_Frame",
  "WheelFrame",
  "Top",
];

/**
 * Normalize a node name for matching: lowercase, collapse spaces/underscores.
 * @param {string} name
 * @returns {string}
 */
function normalizeName(name) {
  return (name || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "");
}

/** Map normalized node name -> part key used in SCHEMES. */
const NAME_TO_PART_KEY = {
  toolbox: "toolBox",
  drawer: "drawer",
  handle: "handle",
  lock: "lock",
  riser: "riser",
  wheelframe: "wheelFrame",
  top: "top",
};

/**
 * Get the part key for a node name (e.g. "Tool_Box" -> "toolBox").
 * @param {string} nodeName
 * @returns {string | null}
 */
export function getPartKeyFromName(nodeName) {
  const key = normalizeName(nodeName);
  return NAME_TO_PART_KEY[key] ?? null;
}

/**
 * Walk up the parent chain from an Object3D and return the first part key found.
 * @param {import("three").Object3D} object
 * @returns {string | null}
 */
export function getPartKeyFromObject(object) {
  let node = object;
  while (node) {
    const partKey = getPartKeyFromName(node.name);
    if (partKey) return partKey;
    node = node.parent;
  }
  return null;
}

/**
 * Per-part material overrides: roughness, metalness, envMapIntensity.
 * @typedef {{ roughness: number; metalness: number; envMapIntensity?: number }} PartOverrides
 */

/** Matte (Gunmetal-style): matte cabinet/drawers, reflective handles, brushed top. */
const MATTE = {
  toolBox: { roughness: 0.8, metalness: 0.3, envMapIntensity: 0.2 },
  drawer: { roughness: 0.8, metalness: 0.3, envMapIntensity: 0.2 },
  handle: { roughness: 0.35, metalness: 0.9, envMapIntensity: 0.6 },
  lock: { roughness: 0.35, metalness: 0.9, envMapIntensity: 0.6 },
  riser: { roughness: 0.8, metalness: 0.3, envMapIntensity: 0.2 },
  wheelFrame: { roughness: 0.8, metalness: 0.3, envMapIntensity: 0.2 },
  top: { roughness: 0.5, metalness: 0.55, envMapIntensity: 0.4 },
};

/** Gloss (Gloss Black-style): glossy cabinet, shiny handles, brushed top. */
const GLOSS = {
  toolBox: { roughness: 0.25, metalness: 0.4, envMapIntensity: 0.7 },
  drawer: { roughness: 0.25, metalness: 0.4, envMapIntensity: 0.7 },
  handle: { roughness: 0.1, metalness: 1, envMapIntensity: 1 },
  lock: { roughness: 0.1, metalness: 1, envMapIntensity: 1 },
  riser: { roughness: 0.25, metalness: 0.4, envMapIntensity: 0.7 },
  wheelFrame: { roughness: 0.25, metalness: 0.4, envMapIntensity: 0.7 },
  top: { roughness: 0.5, metalness: 0.55, envMapIntensity: 0.4 },
};

/** Scheme key -> per-part overrides. */
export const SCHEMES = {
  matte: MATTE,
  gloss: GLOSS,
};
