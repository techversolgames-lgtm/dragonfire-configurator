/**
 * Playable tutorial: `interaction` drives gating (see DragonfireTutorialInteractionBridge).
 * `highlightTarget` / `highlightTargets` match `[data-dragonfire-tutorial="…"]`.
 * `visual` adds optional motion in the tutorial card only.
 */
export const ONBOARDING_STORAGE_KEY = "dragonfire-tools-onboarding-complete-v1";

/** @typedef {'none' | 'manual' | 'navigate' | 'place' | 'select' | 'rotate' | 'delete'} TutorialInteraction */
/** @typedef {'none' | 'handDrag'} TutorialVisual */

export const TUTORIAL_STEPS = [
  {
    id: "welcome",
    title: "Welcome",
    body: "This tour walks through the 3D room, placing and editing objects, then each tool on the left. Complete actions where asked—Next unlocks when you do—or use Skip. The glowing ring shows where to look.",
    interaction: "none",
    highlightTarget: null,
    visual: "none",
  },
  {
    id: "navigate",
    title: "Rotate, pan, and zoom",
    body: "Rotate: hold the left mouse button and drag (left/right turns the view). Pan: hold the right button and drag to slide. Zoom: scroll the wheel up and down. Move the camera to finish this step.",
    interaction: "navigate",
    highlightTarget: null,
    visual: "none",
  },
  {
    id: "place",
    title: "Place an object (drag from library)",
    body: "Use the Items library on the right: pick a category, click an item, then click the floor or wall to place—or drag from the list into the scene. The animation below shows motion from Library (right) toward the Scene (where you drop).",
    interaction: "place",
    highlightTarget: "items-library",
    visual: "handDrag",
  },
  {
    id: "select",
    title: "Select an object",
    body: "Click something in the room to select it. A highlight appears and the Cabinet / Room item panel can open on the left.",
    interaction: "select",
    highlightTarget: null,
    visual: "none",
  },
  {
    id: "rotate",
    title: "Rotate a cabinet",
    body: "With a floor cabinet selected, use the Rotation number, slider, or preset in the left panel (highlighted). The step completes when rotation updates.",
    interaction: "rotate",
    highlightTarget: null,
    highlightTargets: ["items", "rotation-controls"],
    visual: "none",
  },
  {
    id: "delete",
    title: "Remove an object",
    body: "Select an item in the 3D view, then use Remove from scene (Del) in the left panel—or press the Delete key. The room stays fully visible on this step. Avoid Reset room unless you want to clear everything.",
    interaction: "delete",
    highlightTarget: null,
    highlightTargets: ["items", "remove-from-scene"],
    visual: "none",
  },
  {
    id: "panel-units",
    title: "Units & measurement",
    body: "Open the ruler icon: set imperial/metric and measurement units for dimensions and labels.",
    interaction: "manual",
    highlightTarget: "units",
    visual: "none",
  },
  {
    id: "panel-walls",
    title: "Walls — height & width",
    body: "Open the walls icon: adjust height and width per wall, disable a wall, or apply settings to all walls.",
    interaction: "manual",
    highlightTarget: "walls",
    visual: "none",
  },
  {
    id: "panel-grid",
    title: "Grid & dimension lines",
    body: "Open the grid icon: toggle the floor grid, dimension lines, and label size so measurements read clearly.",
    interaction: "manual",
    highlightTarget: "grid",
    visual: "none",
  },
  {
    id: "panel-floor",
    title: "Floor material",
    body: "Open the layers icon: pick a floor material and tiling for the room floor.",
    interaction: "manual",
    highlightTarget: "floor",
    visual: "none",
  },
  {
    id: "panel-scale",
    title: "Human scale character",
    body: "Open the person icon: show or hide the scale figure and move it in the scene for reference.",
    interaction: "manual",
    highlightTarget: "scale",
    visual: "none",
  },
  {
    id: "panel-items",
    title: "Cabinet & room item options",
    body: "Open the toolbox icon when an item is selected: backsplash, base, colors, rotation, and more.",
    interaction: "manual",
    highlightTarget: "items",
    visual: "none",
  },
  {
    id: "panel-quote",
    title: "Quote",
    body: "Open the document icon to build a quote from the current layout.",
    interaction: "manual",
    highlightTarget: "quote",
    visual: "none",
  },
  {
    id: "panel-help",
    title: "Help & topics",
    body: "Open the question icon anytime to replay the full tour or jump to a single topic.",
    interaction: "manual",
    highlightTarget: "help",
    visual: "none",
  },
];

export const GATED_INTERACTIONS = [
  "navigate",
  "place",
  "select",
  "rotate",
  "delete",
];

export function isGatedInteraction(interaction) {
  return GATED_INTERACTIONS.includes(interaction);
}
