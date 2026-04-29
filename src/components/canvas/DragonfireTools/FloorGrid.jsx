import useAnimationStore from "@/stores/useAnimationStore";
import * as THREE from "three";
import { useMemo, useEffect } from "react";
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

// Section lines are fully visible; minor lines are subtle
float sectionMask = min(1.0, sectionThickness * g2);
vec3 color = mix(cellColor, sectionColor, sectionMask);
float alpha = max(g1 * 0.55, g2 * 0.95);

if (alpha < 0.01) discard;
gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
}
`;

const FOOT = 0.3048;
const INCH = 0.0254;
const MM = 0.001;

/**
 * Grid spacing follows selected dimension units exactly:
 * - in: minor cell = 1 inch, major section = 12 inches (1 foot)
 * - ft: minor cell = 1 foot, major section = 10 feet
 * - mm: minor cell = 1 mm, major section = 1000 mm (1 meter)
 */
function getUnitLockedGridSpacing(dimensionUnits) {
  if (dimensionUnits === "in") {
    return { cellSize: INCH, sectionSize: 12 * INCH };
  }
  if (dimensionUnits === "ft") {
    return { cellSize: FOOT, sectionSize: 10 * FOOT };
  }
  return { cellSize: MM, sectionSize: 1000 * MM };
}

const FloorGrid = () => {
  const wallWidthValues = useAnimationStore((state) => state.wallWidthValues);
  const showFloorGrid = useAnimationStore((state) => state.showFloorGrid);
  const dimensionUnits = useAnimationStore((state) => state.dimensionUnits) ?? "in";

  const floorPlaneArgs = useMemo(() => {
    const front = wallWidthValues?.front || 14;
    const right = wallWidthValues?.right || 12;
    const back = wallWidthValues?.back || 16;
    const left = wallWidthValues?.left || 10;

    const floorPoints = computeQuadPoints(front, right, back, left);
    const [p1xy, p2xy, p3xy, p4xy] = floorPoints;

    const floorP1 = new THREE.Vector3(p1xy.x, 0.01, -p1xy.y);
    const floorP2 = new THREE.Vector3(p2xy.x, 0.01, -p2xy.y);
    const floorP3 = new THREE.Vector3(p3xy.x, 0.01, -p3xy.y);
    const floorP4 = new THREE.Vector3(p4xy.x, 0.01, -p4xy.y);

    return [floorP1, floorP2, floorP3, floorP4, false];
  }, [wallWidthValues]);

  const { cellSize, sectionSize } = useMemo(
    () => getUnitLockedGridSpacing(dimensionUnits),
    [dimensionUnits],
  );

  // Create the material once; update uniforms when spacing changes (avoids recompiling the shader)
  const gridMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: gridVertexShader,
        fragmentShader: gridFragmentShader,
        uniforms: {
          cellColor: { value: new THREE.Color("#6F6F6F") },
          sectionColor: { value: new THREE.Color("#9D4B4B") },
          cellSize: { value: cellSize },
          sectionSize: { value: sectionSize },
          cellThickness: { value: 1.0 },
          sectionThickness: { value: 1.5 },
        },
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
        side: THREE.DoubleSide,
      }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Imperatively update uniforms so the shader is never recompiled on resize
  useEffect(() => {
    gridMaterial.uniforms.cellSize.value = cellSize;
    gridMaterial.uniforms.sectionSize.value = sectionSize;
  }, [gridMaterial, cellSize, sectionSize]);

  useEffect(() => {
    return () => gridMaterial.dispose();
  }, [gridMaterial]);

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