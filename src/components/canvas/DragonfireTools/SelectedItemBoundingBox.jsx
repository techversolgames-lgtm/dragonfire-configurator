import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import useDragNDropStore from "@/stores/useDragNDropStore";

const GREEN = 0x00ff00;

const unitBoxEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));

/**
 * Draws a green wireframe bounding box around the currently selected item (activeSceneItem).
 * Uses an oriented bounding box (OBB): same position/rotation as the object with fixed
 * width/height/depth from userData, so the box rotates with the object and does not grow.
 */
const SelectedItemBoundingBox = () => {
  const activeSceneItem = useDragNDropStore((state) => state.activeSceneItem);
  const groupRef = useRef(null);
  const position = useRef(new THREE.Vector3());
  const quaternion = useRef(new THREE.Quaternion());
  const offsetVec = useRef(new THREE.Vector3());

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const item = activeSceneItem;
    if (
      !item ||
      (!item.userData?.isCabinet && !item.userData?.isRoomItem)
    ) {
      group.visible = false;
      return;
    }
    item.getWorldPosition(position.current);
    const rotationSource =
      item.children && item.children.length > 0 ? item.children[0] : item;
    rotationSource.getWorldQuaternion(quaternion.current);
    const w = item.userData.boundingBoxWidth ?? 1;
    const h = item.userData.boundingBoxHeight ?? 1;
    const d = item.userData.boundingBoxDepth ?? 1;
    const localOffset = item.userData.boundingBoxLocalOffset;
    if (localOffset) {
      offsetVec.current.set(
        localOffset.x,
        localOffset.y,
        localOffset.z,
      ).applyQuaternion(quaternion.current);
      position.current.add(offsetVec.current);
      // Box is drawn with bottom at origin; offset gave us door center → move to door bottom
      position.current.y -= h / 2;
    }
    group.position.copy(position.current);
    group.quaternion.copy(quaternion.current);
    group.scale.set(w, h, d);
    group.visible = true;
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Unit box -0.5..0.5; Y offset 0.5 so box bottom is at origin (cabinet base) */}
      <group position={[0, 0.5, 0]}>
        <lineSegments geometry={unitBoxEdges}>
          <lineBasicMaterial color={GREEN} depthTest={true} />
        </lineSegments>
      </group>
    </group>
  );
};

export default SelectedItemBoundingBox;
