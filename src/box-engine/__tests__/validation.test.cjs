/* eslint-disable @typescript-eslint/no-require-imports */
require("./register-typescript.cjs");

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  DEFAULT_DIMENSION_INPUTS,
  MVP_DIMENSION_LIMITS,
} = require("../constants.ts");
const { validateDimensions } = require("../validation.ts");

test("default 100 × 100 × 340 dimensions are valid", () => {
  const result = validateDimensions({ ...DEFAULT_DIMENSION_INPUTS });

  assert.deepEqual(result.dimensions, {
    width: 100,
    depth: 100,
    height: 340,
  });
  assert.deepEqual(result.errors, []);
});

test("validation rejects empty, non-positive, and malformed values", () => {
  const empty = validateDimensions({
    width: "",
    depth: "100",
    height: "340",
  });
  const zero = validateDimensions({
    width: "0",
    depth: "100",
    height: "340",
  });
  const malformed = validateDimensions({
    width: "100mm",
    depth: "100",
    height: "340",
  });

  assert.equal(empty.errors[0].code, "WIDTH_REQUIRED");
  assert.equal(zero.errors[0].code, "WIDTH_NOT_POSITIVE");
  assert.equal(malformed.errors[0].code, "WIDTH_INVALID_NUMBER");
});

test("temporary minimum and maximum limits are enforced", () => {
  const below = validateDimensions({
    width: String(MVP_DIMENSION_LIMITS.width.min - 1),
    depth: "100",
    height: "340",
  });
  const above = validateDimensions({
    width: "100",
    depth: "100",
    height: String(MVP_DIMENSION_LIMITS.height.max + 1),
  });

  assert.equal(below.errors[0].code, "WIDTH_BELOW_MIN");
  assert.equal(above.errors[0].code, "HEIGHT_ABOVE_MAX");
  assert.equal(below.dimensions, null);
  assert.equal(above.dimensions, null);
});

test("valid large dimensions warn when the provisional sheet is exceeded", () => {
  const result = validateDimensions({
    width: String(MVP_DIMENSION_LIMITS.width.max),
    depth: String(MVP_DIMENSION_LIMITS.depth.max),
    height: String(MVP_DIMENSION_LIMITS.height.max),
  });

  assert.deepEqual(result.errors, []);
  assert.ok(
    result.warnings.some((issue) => issue.code === "WORKING_SHEET_EXCEEDED"),
  );
});
