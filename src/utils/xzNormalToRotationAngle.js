const xzNormalToRotationAngle = (normal) => {
  // atan2 gives you the angle from the positive Z-axis
  // We use atan2(x, z) to get the angle in the XZ plane
  const yRotation = Math.atan2(normal.x, normal.z);
  return yRotation;
};

export default xzNormalToRotationAngle;
