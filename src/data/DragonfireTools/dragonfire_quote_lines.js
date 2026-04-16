import { reverseIdMap } from "@/data/DragonfireTools/cabinetItems";

/**
 * Build cabinet summary rows for quote PDF / email (grouped by cabinet + options).
 */
export function aggregateCabinetLines(placedPositions) {
  const items = Array.isArray(placedPositions) ? placedPositions : [];
  const map = new Map();

  const formatDrawerColor = (placement) => {
    const raw = String(placement?.lockerColor ?? placement?.bottomColor ?? "").trim();
    if (!raw) return "Grey";
    const normalized = raw.toLowerCase();
    if (normalized === "gunmetal" || normalized === "grey" || normalized === "gray") {
      return "Grey";
    }
    if (normalized === "black" || normalized === "glossblack") return "Black";
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  };

  const formatBacksplash = (placement) =>
    placement?.backsplash === false ? "No" : "Yes";

  const formatBase = (placement) => {
    const base = String(placement?.baseOption ?? "none").toLowerCase();
    if (base === "none") return "None";
    if (base === "wheel") return "Wheels";
    if (base === "riser") return "Leveling Feet";
    if (base === "riserlowprofile") return "Leveling Feet Low Profile";
    if (base === "legs") return "Legs";
    if (base === "smalllegs") return "Small Legs";
    return String(placement?.baseOption ?? "None");
  };

  const hasBacksplashOption = (meta, cabinetId) => {
    if (meta?.itemType === "wall") return false;
    if (cabinetId === 8 || cabinetId === 9 || cabinetId === 10) return false;
    return true;
  };

  for (const placement of items) {
    const cabinetId = placement?.cabinetId;
    const meta = cabinetId != null ? reverseIdMap[cabinetId] : null;
    const rawName = meta?.label ?? meta?.name ?? `Cabinet ${cabinetId ?? "-"}`;

    if (cabinetId === 100 || cabinetId === 101 || cabinetId === 102) {
      continue;
    }

    const typePrefix =
      meta?.itemType === "wall"
        ? "Wall Cabinet"
        : meta?.itemType === "floor"
          ? "Base Cabinet"
          : "Cabinet";

    const isPkg = Boolean(meta?.isCabinetPackage);
    const cabinetName = meta
      ? isPkg
        ? `${typePrefix} Packages\n${rawName}`
        : `${typePrefix} ${rawName}`
      : rawName;

    const backsplash = !hasBacksplashOption(meta, cabinetId)
      ? null
      : formatBacksplash(placement);
    const drawerColor = formatDrawerColor(placement);
    const base = isPkg ? null : formatBase(placement);
    const key = `${cabinetId ?? cabinetName}|${backsplash ?? "∅"}|${drawerColor}|${base ?? "∅"}`;
    const prev = map.get(key) ?? {
      cabinetName,
      quantity: 0,
      backsplash,
      drawerColor,
      base,
    };
    map.set(key, { ...prev, quantity: prev.quantity + 1 });
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.quantity !== a.quantity) return b.quantity - a.quantity;
    return String(a.cabinetName).localeCompare(String(b.cabinetName));
  });
}
