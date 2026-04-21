export const LOCKER_GREY_RAL7015_HEX = "#51565c";
export const LOCKER_BODY_GREY_RAL7021_HEX = "#2f3234";
export const LOCKER_WHITE_RAL7021_HEX = "#ffffff";

/**
 * Locker cabinet color options (value, label, hex).
 * Options apply to doors only; outer body and base are always Gloss Black.
 * Same options are used for 11 Drawer cabinet (drawer fronts); body remains Gloss Black.
 */
export const LOCKER_COLOR_OPTIONS = [
  { value: "gunmetal", label: "Gunmetal Gray (RAL 7015)", hex: LOCKER_GREY_RAL7015_HEX },
  { value: "glossBlack", label: "Gloss Black (RAL 9005)", hex: "#0a0a0a" },
  { value: "white", label: "White (RAL 9010)", hex: LOCKER_WHITE_RAL7021_HEX },
];

export const DEFAULT_LOCKER_COLOR = "gunmetal";

/** Outer body and base are always Gloss Black. */
export const LOCKER_BODY_GLOSS_BLACK_HEX = "#0a0a0a";

/** Get hex for a locker color value, or default. Supports legacy "black" as Gloss Black. */
export function getLockerColorHex(value) {
  const option = LOCKER_COLOR_OPTIONS.find((o) => o.value === value);
  if (option) return option.hex;
  if (value === "black") return "#0a0a0a"; // legacy
  const defaultOption = LOCKER_COLOR_OPTIONS.find(
    (o) => o.value === DEFAULT_LOCKER_COLOR,
  );
  return defaultOption?.hex ?? LOCKER_BODY_GREY_RAL7021_HEX;
}

/** Body color: black for black selection, RAL7021 for grey selection. */
export function getLockerBodyColorHex(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "black" || normalized === "glossblack") {
    return LOCKER_BODY_GLOSS_BLACK_HEX;
  }
  return LOCKER_BODY_GREY_RAL7021_HEX;
}
