/** Stainless steel appearance (matches worktable top / backsplash). */
export const STAINLESS_COLOR = "#c0c5d3";
export const STAINLESS_ROUGHNESS = 0.08;
export const STAINLESS_METALNESS = 1;
export const STAINLESS_ENV_MAP_INTENSITY = 0.3;

/** GLB work surface: mesh name `top` (case-insensitive) and/or material name `Top`. */
export function isTopNodeName(name) {
  return /^top$/i.test((name || "").trim());
}

export function isUnderTopNode(node) {
  let n = node;
  while (n) {
    if (isTopNodeName(n.name)) return true;
    n = n.parent;
  }
  return false;
}

export function applyStainlessSteelToMaterial(mat) {
  if (!mat || (!mat.isMeshStandardMaterial && !mat.isMeshPhysicalMaterial))
    return;
  mat.color.set(STAINLESS_COLOR);
  mat.roughness = STAINLESS_ROUGHNESS;
  mat.metalness = STAINLESS_METALNESS;
  mat.envMapIntensity = STAINLESS_ENV_MAP_INTENSITY;
  mat.needsUpdate = true;
}

/**
 * Clone mesh materials (array-safe), apply ghost preview, apply stainless to
 * mesh named `top` and/or material named `Top`.
 * @returns {boolean} skipCabinetBodyStyling — when true, skip gunmetal/drawer body pass for this mesh
 */
export function prepareCabinetMeshMaterialsForTopSteel(child, isGhost) {
  if (!child.isMesh || !child.material) return false;

  if (Array.isArray(child.material)) {
    child.material = child.material.map((m) => m.clone());
  } else {
    child.material = child.material.clone();
  }
  const mats = Array.isArray(child.material)
    ? child.material
    : [child.material];
  mats.forEach((mat) => {
    mat.transparent = isGhost;
    mat.opacity = isGhost ? 0.5 : 1;
    mat.depthTest = !isGhost;
    mat.depthWrite = !isGhost;
  });

  const meshTopHierarchy =
    isTopNodeName(child.name) || isUnderTopNode(child);
  if (!isGhost) {
    mats.forEach((mat) => {
      const matNamedTop = String(mat.name || "").trim() === "Top";
      if (meshTopHierarchy || matNamedTop) {
        applyStainlessSteelToMaterial(mat);
      }
    });
  }

  return (
    meshTopHierarchy ||
    (!Array.isArray(child.material) &&
      String(child.material.name || "").trim() === "Top")
  );
}
