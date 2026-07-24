/* eslint-disable @typescript-eslint/no-require-imports */
require("./register-typescript.cjs");

const assert = require("node:assert/strict");
const test = require("node:test");
const { DEFAULT_DIMENSIONS } = require("../constants.ts");
const { generateRteGeometry } = require("../rte-generator.ts");

test("default RTE geometry has the expected dimensions and envelope", () => {
  const geometry = generateRteGeometry({ ...DEFAULT_DIMENSIONS });

  assert.equal(geometry.templateId, "BOX-RTE-001");
  assert.deepEqual(geometry.dimensions, {
    width: 100,
    depth: 100,
    height: 340,
  });
  assert.equal(geometry.metrics.glueFlap, 24);
  assert.equal(geometry.metrics.tuckTongue, 22);
  assert.equal(geometry.bounds.width, 424);
  assert.equal(geometry.bounds.height, 584);
});

test("RTE geometry contains deterministic CUT, CREASE, and GLUE data", () => {
  const first = generateRteGeometry({ ...DEFAULT_DIMENSIONS });
  const second = generateRteGeometry({ ...DEFAULT_DIMENSIONS });

  assert.deepEqual(first, second);
  assert.equal(first.cutLines.length, 28);
  assert.equal(first.creaseLines.length, 12);
  assert.equal(first.glueAreas.length, 1);
  assert.equal(first.glueAreas[0].id, "glue-side-flap");
  assert.equal(new Set(first.cutLines.map((line) => line.id)).size, 28);
  assert.equal(new Set(first.creaseLines.map((line) => line.id)).size, 12);
});

test("reverse tuck closure flaps are attached to opposite body panels", () => {
  const geometry = generateRteGeometry({ ...DEFAULT_DIMENSIONS });
  const topTuck = geometry.cutLines.filter((line) =>
    line.id.startsWith("cut-top-front-tuck"),
  );
  const bottomTuck = geometry.cutLines.filter((line) =>
    line.id.startsWith("cut-bottom-back-tuck"),
  );

  assert.equal(topTuck.length, 5);
  assert.equal(bottomTuck.length, 5);
  assert.ok(topTuck.every((line) => line.from.y >= 462));
  assert.ok(bottomTuck.every((line) => line.from.y <= 122));
});
