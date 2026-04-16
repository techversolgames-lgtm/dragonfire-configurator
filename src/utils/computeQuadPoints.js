import * as THREE from "three";

//NB C is opposite the angle we want to find
const getAngleFromCosineRule = (a, b, c) => {
  const numerator = a * a + b * b - c * c;
  const denominator = 2 * a * b;

  //triangle inequality check - prevent degenerate triangles
  const epsilon = 0.0001; // small tolerance for floating point comparison
  if (a + b <= c + epsilon || a + c <= b + epsilon || b + c <= a + epsilon) {
    console.warn("Degenerate triangle detected - sides are collinear");
    return 0;
  }

  //invalid cosines
  if (denominator === 0) {
    return 0;
  } else if (numerator >= denominator) {
    return 0;
  }

  const angle = Math.acos(numerator / denominator);
  return angle;
};

//gets the points of a quad given the lengths of the sides
//L1 & L2 are assumed to meet at 90 degrees,
//the remaining triangles is fixed as a result
//and easy to calculate
//p1->p2 is L1
//p2->p3 is L2
//p3->p4 is L3
//p4->p1 is L4
const computeQuadPoints = (L1, L2, L3, L4) => {
  const p1 = new THREE.Vector2();
  const p2 = new THREE.Vector2();
  const p3 = new THREE.Vector2();
  const p4 = new THREE.Vector2();

  //Triangle 1,L1 L2 L3, Right angled
  p1.x = -L1 * 0.5;
  p1.y = -L2 * 0.5;
  p2.x = L1 * 0.5;
  p2.y = -L2 * 0.5;
  p3.x = p2.x;
  p3.y = L2 * 0.5;

  const hypotenuse = Math.sqrt(L1 * L1 + L2 * L2);

  const angleOppositeL4 = getAngleFromCosineRule(hypotenuse, L3, L4);
  const l3AngleBelowXaxisToHypotenuse = Math.atan(L2 / L1);
  const l3AngleAboveXaxis = angleOppositeL4 - l3AngleBelowXaxisToHypotenuse;

  p4.x = p3.x - L3 * Math.cos(l3AngleAboveXaxis);
  p4.y = p3.y + L3 * Math.sin(l3AngleAboveXaxis);

  const points = [p1, p2, p3, p4];
  return points;
};

//simply take the min and max heights. then find the right
//corners to apply them to
//and use modulo circular arithmetic to make sure
//it's flat at two sides and slanted on the other two
const getQuadHeights = (H1, H2, H3, H4) => {
  const heights = [H1, H2, H3, H4];
  const maxVal = Math.max(...heights);
  const minVal = Math.min(...heights);

  // Find index of first max and first min
  const maxIdx = heights.indexOf(maxVal);
  const minIdx = heights.indexOf(minVal);

  // Calculate circular distance between max and min
  const getCircularDistance = (i, j) => {
    const diff = Math.abs(i - j);
    return Math.min(diff, 4 - diff);
  };

  const distance = getCircularDistance(maxIdx, minIdx);

  const result = [...heights];

  // If max and min are opposite (distance = 2), propagate to next in loop
  if (distance === 2) {
    result[maxIdx] = maxVal;
    result[(maxIdx + 1) % 4] = maxVal;
    result[minIdx] = minVal;
    result[(minIdx + 1) % 4] = minVal;
  } else if (distance === 1) {
    // Adjacent: they split the quad - each takes itself and the position on the opposite side
    // Figure out which two positions are between min and max
    // Min keeps itself and the position opposite to max
    // Max keeps itself and the position opposite to min

    // The two middle positions (not min or max)
    const allIndices = [0, 1, 2, 3];
    const middleIndices = allIndices.filter(
      (i) => i !== minIdx && i !== maxIdx
    );

    // Assign the middle values based on which is closer to min vs max
    result[minIdx] = minVal;
    result[maxIdx] = maxVal;

    // Determine which middle position goes with min and which with max
    // The one closer to min (in circular terms) gets minVal
    const dist0ToMin = getCircularDistance(middleIndices[0], minIdx);
    const dist0ToMax = getCircularDistance(middleIndices[0], maxIdx);

    if (dist0ToMin < dist0ToMax) {
      result[middleIndices[0]] = minVal;
      result[middleIndices[1]] = maxVal;
    } else {
      result[middleIndices[0]] = maxVal;
      result[middleIndices[1]] = minVal;
    }
  } else {
    // All other cases: keep original values
    return result;
  }

  return result;
};

export { computeQuadPoints as default, getQuadHeights };
