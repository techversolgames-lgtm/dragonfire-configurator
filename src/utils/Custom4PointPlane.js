import * as THREE from "three";

class Custom4PointPlane extends THREE.BufferGeometry {
  /**for some reason it does an envelope
   * triangle instead of a quad so I'm swapping this
   */
  // constructor(point0, point1, point2, point3, reverse = false) {
  constructor(point0, point1, point3, point2, reverse = false) {
    super();

    const positions = new Float32Array([
      point0.x,
      point0.y,
      point0.z,
      point1.x,
      point1.y,
      point1.z,
      point2.x,
      point2.y,
      point2.z,
      point3.x,
      point3.y,
      point3.z,
    ]);

    const center = new THREE.Vector3(
      (point0.x + point1.x + point2.x + point3.x) / 4,
      (point0.y + point1.y + point2.y + point3.y) / 4,
      (point0.z + point1.z + point2.z + point3.z) / 4
    );

    const edge1 = new THREE.Vector3().subVectors(point1, point0);
    const edge2 = new THREE.Vector3().subVectors(point2, point0);
    const computedNormal = new THREE.Vector3()
      .crossVectors(edge1, edge2)
      .normalize();

    const toOrigin = new THREE.Vector3().subVectors(
      new THREE.Vector3(0, 0, 0),
      center
    );

    const distanceToOrigin = toOrigin.length();
    const epsilon = 0.0001;

    let shouldReverse;
    if (distanceToOrigin < epsilon) {
      const upDirection = new THREE.Vector3(0, 1, 0);
      shouldReverse = computedNormal.dot(upDirection) < 0;
    } else {
      const referenceDirection = toOrigin.normalize();
      shouldReverse = computedNormal.dot(referenceDirection) < 0;
    }

    const finalReverse = reverse ? !shouldReverse : shouldReverse;

    const indices = finalReverse
      ? new Uint16Array([0, 2, 1, 1, 2, 3])
      : new Uint16Array([0, 1, 2, 1, 3, 2]);

    const uvs = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);

    this.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.setIndex(new THREE.BufferAttribute(indices, 1));
    this.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));

    this.computeVertexNormals();
  }

  updatePoints(point0, point1, point2, point3, reverse = false) {
    const positions = this.attributes.position.array;

    positions[0] = point0.x;
    positions[1] = point0.y;
    positions[2] = point0.z;

    positions[3] = point1.x;
    positions[4] = point1.y;
    positions[5] = point1.z;

    positions[6] = point2.x;
    positions[7] = point2.y;
    positions[8] = point2.z;

    positions[9] = point3.x;
    positions[10] = point3.y;
    positions[11] = point3.z;

    this.attributes.position.needsUpdate = true;

    const center = new THREE.Vector3(
      (point0.x + point1.x + point2.x + point3.x) / 4,
      (point0.y + point1.y + point2.y + point3.y) / 4,
      (point0.z + point1.z + point2.z + point3.z) / 4
    );

    const edge1 = new THREE.Vector3().subVectors(point1, point0);
    const edge2 = new THREE.Vector3().subVectors(point2, point0);
    const computedNormal = new THREE.Vector3()
      .crossVectors(edge1, edge2)
      .normalize();

    const toOrigin = new THREE.Vector3().subVectors(
      new THREE.Vector3(0, 0, 0),
      center
    );

    const distanceToOrigin = toOrigin.length();
    const epsilon = 0.0001;

    let shouldReverse;
    if (distanceToOrigin < epsilon) {
      const upDirection = new THREE.Vector3(0, 1, 0);
      shouldReverse = computedNormal.dot(upDirection) < 0;
    } else {
      const referenceDirection = toOrigin.normalize();
      shouldReverse = computedNormal.dot(referenceDirection) < 0;
    }

    const finalReverse = reverse ? !shouldReverse : shouldReverse;

    const indices = finalReverse
      ? new Uint16Array([0, 2, 1, 1, 2, 3])
      : new Uint16Array([0, 1, 2, 1, 3, 2]);

    this.setIndex(new THREE.BufferAttribute(indices, 1));

    this.computeVertexNormals();
  }
}

export default Custom4PointPlane;
