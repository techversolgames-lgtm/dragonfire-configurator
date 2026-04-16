/**
 * Quote PDF room screenshots: NavCube “upper corner” directions (around TOP).
 * Default orbit distance (same units as NavCube `orbitRadius`). Tune here or at
 * runtime: `window.__DRAGONFIRE_QUOTE_ORBIT_DISTANCE = 8` (corners) or
 * `window.__DRAGONFIRE_QUOTE_TOP_ORBIT_DISTANCE = 12` (final top view).
 */
export const DRAGONFIRE_QUOTE_SCREENSHOT_ORBIT_DISTANCE = 15;

/** @returns {number} Orbit radius for the four upper-corner quote shots (optional window override). */
export function getDragonfireQuoteScreenshotOrbitDistance() {
  if (
    typeof window !== "undefined" &&
    typeof window.__DRAGONFIRE_QUOTE_ORBIT_DISTANCE === "number" &&
    Number.isFinite(window.__DRAGONFIRE_QUOTE_ORBIT_DISTANCE)
  ) {
    return window.__DRAGONFIRE_QUOTE_ORBIT_DISTANCE;
  }
  return DRAGONFIRE_QUOTE_SCREENSHOT_ORBIT_DISTANCE;
}

/** Orbit radius for the final straight-down “top” quote shot (usually larger than corners). */
export const DRAGONFIRE_QUOTE_TOP_VIEW_ORBIT_DISTANCE = 11;

/** @returns {number} Orbit radius for top view (optional `window.__DRAGONFIRE_QUOTE_TOP_ORBIT_DISTANCE`). */
export function getDragonfireQuoteTopViewOrbitDistance() {
  if (
    typeof window !== "undefined" &&
    typeof window.__DRAGONFIRE_QUOTE_TOP_ORBIT_DISTANCE === "number" &&
    Number.isFinite(window.__DRAGONFIRE_QUOTE_TOP_ORBIT_DISTANCE)
  ) {
    return window.__DRAGONFIRE_QUOTE_TOP_ORBIT_DISTANCE;
  }
  return DRAGONFIRE_QUOTE_TOP_VIEW_ORBIT_DISTANCE;
}

/** Milliseconds to wait after each NavCube camera transition before capturing. */
export const DRAGONFIRE_QUOTE_SCREENSHOT_SETTLE_MS = 2700;

export const DRAGONFIRE_QUOTE_UPPER_CORNER_SHOTS = [
  { navCubeKey: "top_front_left", label: "Upper front-left" },
  { navCubeKey: "top_front_right", label: "Upper front-right" },
  { navCubeKey: "top_back_left", label: "Upper back-left" },
  { navCubeKey: "top_back_right", label: "Upper back-right" },
];
