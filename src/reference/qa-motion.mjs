import assert from "node:assert/strict";
import fs from "node:fs/promises";

// Compare both sites with the same viewport, scroll trigger and RAF clock.
// A clock started after scrollIntoView can miss the first rendered frames.
await import("../../scripts/compare-motion.mjs");
const evidence = JSON.parse(await fs.readFile("reference/motion/comparison/frames.json", "utf8"));
assert.equal(evidence.original.before.opacity, "0");
assert.equal(evidence.local.before.opacity, "0");

function localAt(ms, property) {
  let previous = evidence.local.frames[0];
  for (const frame of evidence.local.frames) {
    if (frame.ms >= ms) {
      const fraction = Math.max(0, Math.min(1, (ms - previous.ms) / (frame.ms - previous.ms || 1)));
      return previous[property] + (frame[property] - previous[property]) * fraction;
    }
    previous = frame;
  }
  return previous[property];
}

const errors = evidence.original.frames.filter(frame => frame.ms > 100 && frame.ms < 2100)
  .map(frame => ({
    opacity: Math.abs(frame.opacity - localAt(frame.ms, "opacity")),
    y: Math.abs(frame.y - localAt(frame.ms, "y")),
  }));
const comparison = {
  maxOpacityDifference: Math.max(...errors.map(error => error.opacity)),
  maxPositionDifferencePx: Math.max(...errors.map(error => error.y)),
  meanPositionDifferencePx: errors.reduce((sum, error) => sum + error.y, 0) / errors.length,
};
// Allow roughly one browser frame at the steepest part of the observed curve.
assert.ok(comparison.maxOpacityDifference < 0.045, JSON.stringify(comparison));
assert.ok(comparison.maxPositionDifferencePx < 2.5, JSON.stringify(comparison));
assert.ok(comparison.meanPositionDifferencePx < 0.5, JSON.stringify(comparison));
assert.equal(evidence.local.frames.at(-1).opacity, 1);
assert.equal(evidence.local.frames.at(-1).y, 0);
await fs.writeFile("reference/validation/local-qa/motion.json", JSON.stringify({ ...evidence, comparison }, null, 2));
console.log("PASS source/local reveal trajectory", JSON.stringify(comparison));
