function average(...values) {
  const valid = values.filter((value) => typeof value === "number");
  if (!valid.length) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

export function inferExpression(shape) {
  const smile = average(shape.mouthSmileLeft, shape.mouthSmileRight);
  const frown = average(shape.mouthFrownLeft, shape.mouthFrownRight);
  const jawOpen = shape.jawOpen ?? 0;
  const browUp = shape.browInnerUp ?? 0;
  const browDown = average(shape.browDownLeft, shape.browDownRight);
  const eyeWide = average(shape.eyeWideLeft, shape.eyeWideRight);
  const eyeSquint = average(shape.eyeSquintLeft, shape.eyeSquintRight);
  const mouthPress = average(shape.mouthPressLeft, shape.mouthPressRight);
  const noseSneer = average(shape.noseSneerLeft, shape.noseSneerRight);
  const mouthStretch = average(shape.mouthStretchLeft, shape.mouthStretchRight);

  const scores = {
    Happy: clamp01(
      smile * 1.35 + eyeSquint * 0.25 - frown * 0.7 - mouthPress * 0.2
    ),
    Sad: clamp01(
      frown * 1.25 + browUp * 0.5 + mouthPress * 0.55 - smile * 0.45
    ),
    Surprised: clamp01(
      jawOpen * 0.8 +
        eyeWide * 0.75 +
        browUp * 0.45 -
        mouthPress * 0.2 -
        frown * 0.2
    ),
    Angry: clamp01(
      browDown * 0.95 +
        mouthPress * 0.55 +
        noseSneer * 0.45 +
        mouthStretch * 0.25 -
        smile * 0.5
    ),
  };

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [bestLabel, bestScore] = sorted[0];
  const secondScore = sorted[1]?.[1] ?? 0;

  if (bestLabel === "Sad" && bestScore >= 0.28) return "Sad";
  if (bestScore < 0.38) return "Neutral";
  if (bestScore - secondScore < 0.08) return "Neutral";
  if (bestLabel === "Angry") return "Neutral";
  return bestLabel;
}

export function getMostFrequentLabel(labels) {
  const counts = new Map();

  for (const label of labels) {
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  let winner = "Neutral";
  let winnerCount = -1;

  for (const [label, count] of counts.entries()) {
    if (count > winnerCount) {
      winner = label;
      winnerCount = count;
    }
  }

  return winner;
}
