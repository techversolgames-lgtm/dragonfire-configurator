// Placeholder character: a simple capsule-like stack (box body + sphere head)
// representing a 1.75 m tall person, used for scale reference.
const TARGET_HEIGHT_M = 1.75;

const CharacterModel = ({ isGhost = false }) => {
  const opacity = isGhost ? 0.45 : 1;
  const color = "#4a90d9";

  // Body: 0–1.45 m, Head: 1.45–1.75 m (r=0.15)
  const bodyHeight = 1.3;
  const bodyY = bodyHeight / 2;
  const headRadius = 0.15;
  const headY = bodyHeight + headRadius;

  return (
    <group>
      <mesh position={[0, bodyY, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.45, bodyHeight, 0.25]} />
        <meshStandardMaterial
          color={color}
          transparent={isGhost}
          opacity={opacity}
          depthWrite={!isGhost}
        />
      </mesh>
      <mesh position={[0, headY, 0]} castShadow receiveShadow>
        <sphereGeometry args={[headRadius, 16, 16]} />
        <meshStandardMaterial
          color={color}
          transparent={isGhost}
          opacity={opacity}
          depthWrite={!isGhost}
        />
      </mesh>
    </group>
  );
};

export default CharacterModel;
