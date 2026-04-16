import { createContext, useContext, useState, useCallback } from "react";

/**
 * World-space AABB of the currently selected item (activeSceneItem).
 * Used so dimension lines, rotation gizmo, and bounding box all share the same pivot/reference.
 */
export const SelectedItemBoundsContext = createContext({
  bounds: null,
  setBounds: () => {},
});

export function useSelectedItemBounds() {
  return useContext(SelectedItemBoundsContext);
}

export function SelectedItemBoundsProvider({ children }) {
  const [bounds, setBounds] = useState(null);
  return (
    <SelectedItemBoundsContext.Provider value={{ bounds, setBounds }}>
      {children}
    </SelectedItemBoundsContext.Provider>
  );
}
