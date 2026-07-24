import {
  MAX_DECIMAL_PLACES,
  MVP_DIMENSION_LIMITS,
  MVP_WORKING_SHEET,
} from "./constants";
import { calculateRteMetrics } from "./geometry";
import type {
  BoxDimensions,
  DimensionInputs,
  DimensionKey,
  ValidationIssue,
  ValidationResult,
} from "./types";

const FIELD_NAMES: Record<DimensionKey, string> = {
  width: "Width",
  depth: "Depth",
  height: "Height",
};

const NUMBER_PATTERN = new RegExp(
  `^\\d+(?:\\.\\d{0,${MAX_DECIMAL_PLACES}})?$`,
);

function parseDimension(
  field: DimensionKey,
  value: string,
  errors: ValidationIssue[],
): number | null {
  const label = FIELD_NAMES[field];
  const normalized = value.trim();

  if (!normalized) {
    errors.push({
      code: `${field.toUpperCase()}_REQUIRED`,
      field,
      message: `${label} is required.`,
    });
    return null;
  }

  if (!NUMBER_PATTERN.test(normalized)) {
    errors.push({
      code: `${field.toUpperCase()}_INVALID_NUMBER`,
      field,
      message: `${label} must be a positive number with at most ${MAX_DECIMAL_PLACES} decimal places.`,
    });
    return null;
  }

  const numericValue = Number(normalized);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    errors.push({
      code: `${field.toUpperCase()}_NOT_POSITIVE`,
      field,
      message: `${label} must be greater than 0 mm.`,
    });
    return null;
  }

  const limit = MVP_DIMENSION_LIMITS[field];
  if (numericValue < limit.min) {
    errors.push({
      code: `${field.toUpperCase()}_BELOW_MIN`,
      field,
      message: `${label} must be at least ${limit.min} mm for this prototype.`,
    });
  } else if (numericValue > limit.max) {
    errors.push({
      code: `${field.toUpperCase()}_ABOVE_MAX`,
      field,
      message: `${label} must be no more than ${limit.max} mm for this prototype.`,
    });
  }

  return numericValue;
}

export function validateDimensions(inputs: DimensionInputs): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const width = parseDimension("width", inputs.width, errors);
  const depth = parseDimension("depth", inputs.depth, errors);
  const height = parseDimension("height", inputs.height, errors);

  if (errors.length > 0 || width === null || depth === null || height === null) {
    return { dimensions: null, errors, warnings };
  }

  const dimensions: BoxDimensions = { width, depth, height };
  const metrics = calculateRteMetrics(dimensions);

  if (
    metrics.overallWidth > MVP_WORKING_SHEET.width ||
    metrics.overallHeight > MVP_WORKING_SHEET.height
  ) {
    warnings.push({
      code: "WORKING_SHEET_EXCEEDED",
      message:
        `Generated dieline is ${metrics.overallWidth} × ${metrics.overallHeight} mm, ` +
        `which exceeds the provisional ${MVP_WORKING_SHEET.width} × ${MVP_WORKING_SHEET.height} mm working sheet. Confirm stock and CNC bed size.`,
    });
  } else if (
    metrics.overallWidth > MVP_WORKING_SHEET.width * 0.9 ||
    metrics.overallHeight > MVP_WORKING_SHEET.height * 0.9
  ) {
    warnings.push({
      code: "WORKING_SHEET_NEAR_LIMIT",
      message:
        `Generated dieline uses more than 90% of the provisional ${MVP_WORKING_SHEET.width} × ${MVP_WORKING_SHEET.height} mm working sheet.`,
    });
  }

  if (height / Math.min(width, depth) > 5) {
    warnings.push({
      code: "SLENDER_PROFILE",
      message:
        "This tall, slender carton may need stability and crease-performance review before cutting.",
    });
  }

  if (depth > width * 1.5) {
    warnings.push({
      code: "DEEP_PROFILE",
      message:
        "Depth is large relative to width; tuck and dust-flap clearances require a physical sample.",
    });
  }

  return { dimensions, errors, warnings };
}
