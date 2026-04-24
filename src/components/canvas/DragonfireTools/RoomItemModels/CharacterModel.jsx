import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

const MODEL_URL = "/models/dragonfire-tools/Character.glb";
const TARGET_HEIGHT_M = 1.75;
const MIN_HEIGHT = 0.001;

const CharacterModel = ({ isGhost = false }) => {
  const gltf = useGLTF(MODEL_URL);

  const characterScene = useMemo(() => {
    if (!gltf?.scene) return null;

    const scene = clone(gltf.scene);
    const initialBox = new THREE.Box3().setFromObject(scene);
    const initialSize = new THREE.Vector3();
    initialBox.getSize(initialSize);
    const sourceHeight = Math.max(initialSize.y, MIN_HEIGHT);
    const uniformScale = TARGET_HEIGHT_M / sourceHeight;

    scene.scale.setScalar(uniformScale);

    const scaledBox = new THREE.Box3().setFromObject(scene);
    // Shift up so model's lowest point sits on floor Y.
    scene.position.y -= scaledBox.min.y;

    scene.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
      if (isGhost && obj.material) {
        const ghostMaterial = obj.material.clone();
        ghostMaterial.transparent = true;
        ghostMaterial.opacity = 0.45;
        ghostMaterial.depthWrite = false;
        obj.material = ghostMaterial;
      }
    });

    return scene;
  }, [gltf, isGhost]);

  if (!characterScene) return null;
  return <primitive object={characterScene} />;
};

useGLTF.preload(MODEL_URL);

export default CharacterModel;
