import * as THREE from "three";

/**
 * Matches Blender-style logo empties / meshes: "Logo", "Logo.001", etc.
 * @param {string} name
 */
export function isLogoHierarchyNodeName(name) {
  return /^logo(\.\d+)?$/i.test(String(name ?? "").trim());
}

/**
 * True for logo geometry: mesh named Logo, or any mesh under a parent named Logo
 * (e.g. Logo → Plane).
 * @param {import("three").Mesh} mesh
 */
export function isCabinetLogoBrandingMesh(mesh) {
  if (!mesh?.isMesh) return false;
  if (isLogoHierarchyNodeName(mesh.name)) return true;
  let p = mesh.parent;
  while (p) {
    if (isLogoHierarchyNodeName(p.name)) return true;
    p = p.parent;
  }
  return false;
}

function disposeMaterial(m) {
  if (m == null) return;
  if (Array.isArray(m)) {
    m.forEach(disposeMaterial);
    return;
  }
  if (typeof m.dispose === "function") m.dispose();
}

/**
 * Unlit "decal" style so the mark reads like branding: same apparent white in shadow or highlight,
 * not painted metal. Preserve original logo texture alpha so PNG-like cutouts stay crisp.
 *
 * @param {boolean} isGhost
 * @param {import("three").Material | null | undefined} sourceMaterial
 */
function createWhiteLogoMaterial(isGhost, sourceMaterial) {
  const src = sourceMaterial && !Array.isArray(sourceMaterial) ? sourceMaterial : null;
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    name: "DragonfireCabinetLogoWhite",
    // Ignore vertex colors from the GLB so the logo is uniformly white.
    vertexColors: false,
    transparent: true,
    alphaTest: 0.05,
  });
  // Keep alpha behavior from the original logo material (PNG alpha / cutout).
  // Use map as fallback alpha source when alphaMap is not provided.
  mat.map = src?.map ?? null;
  mat.alphaMap = src?.alphaMap ?? src?.map ?? null;
  mat.opacity = isGhost ? 0.5 : 1;
  mat.depthTest = !isGhost;
  mat.depthWrite = !isGhost;
  mat.side = src?.side ?? THREE.DoubleSide;
  mat.toneMapped = false;
  mat.needsUpdate = true;
  return mat;
}

/**
 * Lit stainless/metallic logo to match cabinet stainless parts.
 *
 * @param {boolean} isGhost
 * @param {import("three").Material | null | undefined} sourceMaterial
 */
function createStainlessLogoMaterial(isGhost, sourceMaterial) {
  const src = sourceMaterial && !Array.isArray(sourceMaterial) ? sourceMaterial : null;
  const mat = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    name: "DragonfireCabinetLogoStainless",
    vertexColors: false,
    transparent: true,
    alphaTest: 0,
    roughness: 0,
    metalness: 0,
    envMapIntensity: 0,
  });
  // Keep alpha behavior from the original logo material (PNG alpha / cutout).
  mat.map = src?.map ?? null;
  mat.alphaMap = src?.alphaMap ?? src?.map ?? null;
  mat.opacity = isGhost ? 0.5 : 1;
  mat.depthTest = !isGhost;
  mat.depthWrite = !isGhost;
  mat.side = src?.side ?? THREE.DoubleSide;
  mat.needsUpdate = true;
  return mat;
}

/**
 * After other cabinet material setup, force logo-only meshes to a dedicated unlit white material.
 * Uses per-mesh material instances so shared GLB materials are not mutated.
 *
 * @param {import("three").Object3D} root
 * @param {{ isGhost?: boolean }} [options]
 */
export function applyWhiteLogoMaterialToCabinetRoot(root, { isGhost = false } = {}) {
  if (!root) return;
  root.traverse((child) => {
    if (!isCabinetLogoBrandingMesh(child)) return;
    const prev = child.material;
    if (Array.isArray(prev)) {
      const next = prev.map((m) => createWhiteLogoMaterial(isGhost, m));
      disposeMaterial(prev);
      child.material = next;
    } else {
      const next = createWhiteLogoMaterial(isGhost, prev);
      disposeMaterial(prev);
      child.material = next;
    }
  });
}

/**
 * After other cabinet material setup, force logo-only meshes to stainless metallic material.
 *
 * @param {import("three").Object3D} root
 * @param {{ isGhost?: boolean }} [options]
 */
export function applyStainlessLogoMaterialToCabinetRoot(root, { isGhost = false } = {}) {
  if (!root) return;
  root.traverse((child) => {
    if (!isCabinetLogoBrandingMesh(child)) return;
    const prev = child.material;
    if (Array.isArray(prev)) {
      const next = prev.map((m) => createStainlessLogoMaterial(isGhost, m));
      disposeMaterial(prev);
      child.material = next;
    } else {
      const next = createStainlessLogoMaterial(isGhost, prev);
      disposeMaterial(prev);
      child.material = next;
    }
  });
}
