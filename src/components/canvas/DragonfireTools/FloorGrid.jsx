import useAnimationStore from "@/stores/useAnimationStore";
import * as THREE from "three";
import { useMemo } from "react";
import Custom4PointPlane from "@/utils/Custom4PointPlane.js";
import computeQuadPoints from "@/utils/computeQuadPoints.js";
import { extend } from "@react-three/fiber";

extend({ Custom4PointPlane });

const gridVertexShader = `
  varying vec3 vPosition;
  void main() {
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const gridFragmentShader = `
  varying vec3 vPosition;
  uniform vec3 cellColor;
  uniform vec3 sectionColor;
  uniform float cellSize;
  uniform float sectionSize;
  uniform float cellThickness;
  uniform float sectionThickness;
  
  float getGrid(float size, float thickness) {
    vec2 coord = vPosition.xz / size;
    vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
    float line = min(grid.x, grid.y) + 1.0 - thickness;
    return 1.0 - min(line, 1.0);
  }
  
  void main() {
    float g1 = getGrid(cellSize, cellThickness);
    float g2 = getGrid(sectionSize, sectionThickness);
    
    vec3 color = mix(cellColor, sectionColor, min(1.0, sectionThickness * g2));
    float alpha = (g1 + g2) * 0.75;
    
    if (alpha <= 0.0) discard;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

const FloorGrid = () => {
  const wallWidthValues = useAnimationStore((state) => state.wallWidthValues);
  const showFloorGrid = useAnimationStore((state) => state.showFloorGrid);

  const wallWidthMap = {
    left: wallWidthValues?.left || 10,
    right: wallWidthValues?.right || 12,
    front: wallWidthValues?.front || 14,
    back: wallWidthValues?.back || 16,
  };

  const floorPlaneArgs = useMemo(() => {
    const floorPoints = computeQuadPoints(
      wallWidthMap.front,
      wallWidthMap.right,
      wallWidthMap.back,
      wallWidthMap.left
    );

    const [p1xy, p2xy, p3xy, p4xy] = floorPoints;

    const floorP1 = new THREE.Vector3(p1xy.x, 0.01, -p1xy.y);
    const floorP2 = new THREE.Vector3(p2xy.x, 0.01, -p2xy.y);
    const floorP3 = new THREE.Vector3(p3xy.x, 0.01, -p3xy.y);
    const floorP4 = new THREE.Vector3(p4xy.x, 0.01, -p4xy.y);

    return [floorP1, floorP2, floorP3, floorP4, false];
  }, [wallWidthValues]);

  const gridMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: gridVertexShader,
        fragmentShader: gridFragmentShader,
        uniforms: {
          cellColor: { value: new THREE.Color("#6f6f6f") },
          sectionColor: { value: new THREE.Color("#9d4b4b") },
          cellSize: { value: 0.1 },
          sectionSize: { value: 1.0 },
          cellThickness: { value: 1.0 },
          sectionThickness: { value: 1.5 },
        },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    []
  );

  if (showFloorGrid === false) return null;

  return (
    <>
      <mesh material={gridMaterial} receiveShadow>
        <custom4PointPlane args={floorPlaneArgs} />
      </mesh>
    </>
  );
};

export default FloorGrid;
