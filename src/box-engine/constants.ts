import type {
  BoxDimensions,
  DimensionInputs,
  DimensionLimits,
} from "./types";

export const TEMPLATE_ID = "BOX-RTE-001" as const;
export const TEMPLATE_NAME = "Reverse Tuck End";
export const MATERIAL_NAME = "Ivory board 400 gsm";
export const GLUE_METHOD = "One side glue flap · standard paper adhesive";
export const PRINTING_SPEC = "Unprinted · no artwork · no bleed · no coating";

export const DEFAULT_DIMENSIONS: Readonly<BoxDimensions> = {
  width: 100,
  depth: 100,
  height: 340,
};

export const DEFAULT_DIMENSION_INPUTS: Readonly<DimensionInputs> = {
  width: "100",
  depth: "100",
  height: "340",
};

/**
 * Temporary software guardrails for the internal prototype.
 * These are not manufacturing limits and must be replaced after CNC trials.
 */
export const MVP_DIMENSION_LIMITS: Readonly<DimensionLimits> = {
  width: { min: 40, max: 300 },
  depth: { min: 30, max: 200 },
  height: { min: 80, max: 500 },
};

/**
 * Provisional planning envelope used only to produce a warning. The actual
 * stock sheet and CNC bed must be confirmed by the factory.
 */
export const MVP_WORKING_SHEET = {
  width: 700,
  height: 1000,
} as const;

export const EXPORT_MARGIN_MM = 5;
export const MAX_DECIMAL_PLACES = 2;

export const GEOMETRY_ASSUMPTIONS = {
  glueFlapWidthRatio: 0.24,
  glueFlapMin: 20,
  glueFlapMax: 35,
  tuckTongueRatio: 0.22,
  tuckTongueMin: 16,
  tuckTongueMax: 28,
  dustFlapDepthRatio: 0.48,
  dustFlapWidthRatio: 0.45,
  dustFlapMin: 16,
  dustFlapMax: 72,
  flapTaperRatio: 0.08,
  flapTaperMin: 5,
  flapTaperMax: 14,
  dustInsetRatio: 0.08,
  dustInsetMin: 4,
  dustInsetMax: 10,
} as const;

export const LAYER_STYLES = {
  CUT: {
    color: "#e11d48",
    label: "CUT",
    description: "Solid red cutting path",
  },
  CREASE: {
    color: "#2563eb",
    label: "CREASE",
    description: "Dashed blue folding path",
  },
  GLUE: {
    color: "#f59e0b",
    label: "GLUE",
    description: "Lightly shaded adhesive area",
  },
  LABELS: {
    color: "#334155",
    label: "LABELS",
    description: "Preview annotations; optional in export",
  },
} as const;
