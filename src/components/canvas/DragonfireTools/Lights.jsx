/**
 * Room lighting: four directional lights from front, back, left, right
 * with 4-way shadows on all cabinets.
 */
import { useRef, useEffect } from "react";

const LIGHT_DISTANCE = 4;
const LIGHT_HEIGHT = 8
const DIRECTIONAL_INTENSITY = 0.2;
const AMBIENT_INTENSITY = 0.25;

/** Shadow coverage (room area). Tweak to match your room size. */
const SHADOW_SIZE = 20;
const SHADOW_MAP_SIZE = 1024;
const SHADOW_BIAS = -0.0001;

const Lights = () => {
  const frontRef = useRef();
  const backRef = useRef();
  const leftRef = useRef();
  const rightRef = useRef();

  useEffect(() => {
    const refs = [frontRef, backRef, leftRef, rightRef];
    refs.forEach((ref) => {
      if (!ref.current) return;
      const light = ref.current;
      light.castShadow = true;
      light.shadow.mapSize.width = SHADOW_MAP_SIZE;
      light.shadow.mapSize.height = SHADOW_MAP_SIZE;
      light.shadow.bias = SHADOW_BIAS;
      light.shadow.camera.near = 1;
      light.shadow.camera.far = 50;
      light.shadow.camera.left = -SHADOW_SIZE;
      light.shadow.camera.right = SHADOW_SIZE;
      light.shadow.camera.top = SHADOW_SIZE;
      light.shadow.camera.bottom = -SHADOW_SIZE;
      light.shadow.camera.updateProjectionMatrix();
    });
  }, []);

  return (
    <>
      {/* Front (+Z) — target defaults to (0,0,0) so shadows cast toward room center */}
      <directionalLight
        ref={frontRef}
        position={[0, LIGHT_HEIGHT, LIGHT_DISTANCE]}
        intensity={DIRECTIONAL_INTENSITY}
        castShadow
      />
      {/* Back (-Z) */}
      <directionalLight
        ref={backRef}
        position={[0, LIGHT_HEIGHT, -LIGHT_DISTANCE]}
        intensity={DIRECTIONAL_INTENSITY}
        castShadow
      />
      {/* Left (-X) */}
      <directionalLight
        ref={leftRef}
        position={[-LIGHT_DISTANCE, LIGHT_HEIGHT, 0]}
        intensity={DIRECTIONAL_INTENSITY}
        castShadow
      />
      {/* Right (+X) */}
      <directionalLight
        ref={rightRef}
        position={[LIGHT_DISTANCE, LIGHT_HEIGHT, 0]}
        intensity={DIRECTIONAL_INTENSITY}
        castShadow
      />
      <ambientLight intensity={AMBIENT_INTENSITY} />
    </>
  );
};

export default Lights;
