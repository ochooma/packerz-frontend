export const BOX_TEMPLATE = {
  code: "BOX-RTE-001",
  name: "Reverse Tuck End",
  material: "Ivory Board 400gsm",
  glueMethod: "Single side-seam glue flap",
  unit: "mm",
  ruleVersion: "prototype-rte-001-v1",
} as const;

export const DEFAULT_DIMENSIONS: BoxDimensions = {
  width: 100,
  depth: 100,
  height: 340,
};

export const DIMENSION_RULES = {
  width: {
    label: "Width",
    shortLabel: "W",
    min: 40,
    max: 300,
    step: 1,
    description: "Front and back panel width",
  },
  depth: {
    label: "Depth",
    shortLabel: "D",
    min: 30,
    max: 200,
    step: 1,
    description: "Side panel and closure depth",
  },
  height: {
    label: "Height",
    shortLabel: "H",
    min: 80,
    max: 500,
    step: 1,
    description: "Finished vertical body height",
  },
} as const;

export type DimensionKey = keyof typeof DIMENSION_RULES;

export type DimensionInputs = Record<DimensionKey, string>;

export type BoxDimensions = Record<DimensionKey, number>;

export type ValidationLevel = "error" | "warning";

export type ValidationIssue = {
  code: string;
  level: ValidationLevel;
  message: string;
  field?: DimensionKey;
};

export type ValidationResult = {
  dimensions: BoxDimensions | null;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
};

export type Point = {
  x: number;
  y: number;
};

export type DielineSegment = {
  id: string;
  start: Point;
  end: Point;
};

export type DielineRegionKind = "panel" | "flap" | "glue";

export type DielineRegion = {
  id: string;
  kind: DielineRegionKind;
  points: Point[];
};

export type DielineLabel = {
  id: string;
  text: string;
  x: number;
  y: number;
  rotation?: number;
  emphasis?: boolean;
};

export type DimensionGuide = {
  id: string;
  label: string;
  start: Point;
  end: Point;
  labelPoint: Point;
  rotation?: number;
};

export type RteGeometry = {
  templateCode: typeof BOX_TEMPLATE.code;
  ruleVersion: typeof BOX_TEMPLATE.ruleVersion;
  dimensions: BoxDimensions;
  sheetWidthMm: number;
  sheetHeightMm: number;
  glueFlapWidthMm: number;
  closureDepthMm: number;
  tuckTongueDepthMm: number;
  cutLines: DielineSegment[];
  foldLines: DielineSegment[];
  regions: DielineRegion[];
  labels: DielineLabel[];
  dimensionGuides: DimensionGuide[];
};

const DIMENSION_KEYS = Object.keys(DIMENSION_RULES) as DimensionKey[];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const roundGeometry = (value: number) => Math.round(value * 1000) / 1000;

export function createDefaultInputs(): DimensionInputs {
  return {
    width: String(DEFAULT_DIMENSIONS.width),
    depth: String(DEFAULT_DIMENSIONS.depth),
    height: String(DEFAULT_DIMENSIONS.height),
  };
}

export function formatMillimeters(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function validateDimensionInputs(
  inputs: DimensionInputs,
): ValidationResult {
  const parsed = {} as BoxDimensions;
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  for (const key of DIMENSION_KEYS) {
    const rawValue = inputs[key].trim();
    const rule = DIMENSION_RULES[key];

    if (!rawValue) {
      errors.push({
        code: "DIMENSION_REQUIRED",
        level: "error",
        field: key,
        message: `${rule.label} is required.`,
      });
      continue;
    }

    if (!/^\d+(?:\.\d)?$/.test(rawValue)) {
      errors.push({
        code: "DIMENSION_FORMAT_INVALID",
        level: "error",
        field: key,
        message: `${rule.label} must be a number with at most one decimal place.`,
      });
      continue;
    }

    const value = Number(rawValue);

    if (!Number.isFinite(value)) {
      errors.push({
        code: "DIMENSION_INVALID",
        level: "error",
        field: key,
        message: `${rule.label} must be a finite number.`,
      });
      continue;
    }

    if (value < rule.min || value > rule.max) {
      errors.push({
        code: "DIMENSION_OUT_OF_RANGE",
        level: "error",
        field: key,
        message: `${rule.label} must be between ${rule.min} and ${rule.max} mm.`,
      });
      continue;
    }

    parsed[key] = value;

    const range = rule.max - rule.min;
    if (value <= rule.min + range * 0.05) {
      warnings.push({
        code: "DIMENSION_NEAR_MINIMUM",
        level: "warning",
        field: key,
        message: `${rule.label} is close to the prototype minimum.`,
      });
    } else if (value >= rule.max - range * 0.05) {
      warnings.push({
        code: "DIMENSION_NEAR_MAXIMUM",
        level: "warning",
        field: key,
        message: `${rule.label} is close to the prototype maximum.`,
      });
    }
  }

  if (errors.length > 0) {
    return { dimensions: null, errors, warnings };
  }

  if (parsed.height / parsed.width > 3.2) {
    warnings.push({
      code: "TALL_PROFILE_REVIEW",
      level: "warning",
      message:
        "Tall profile: confirm board rigidity and scoring in a physical sample.",
    });
  }

  if (parsed.depth > parsed.width * 1.5) {
    warnings.push({
      code: "DEEP_PROFILE_REVIEW",
      level: "warning",
      message:
        "Depth is large relative to width; closure behavior needs a physical test.",
    });
  }

  if (parsed.width > parsed.depth * 3) {
    warnings.push({
      code: "SHALLOW_PROFILE_REVIEW",
      level: "warning",
      message:
        "Depth is small relative to width; dust-flap coverage needs a physical test.",
    });
  }

  return { dimensions: parsed, errors, warnings };
}

export function generateRteGeometry(
  dimensions: BoxDimensions,
): RteGeometry {
  const { width, depth, height } = dimensions;

  // These are deliberately provisional prototype rules. They are not factory
  // allowances and must be replaced after a physical RTE sample is approved.
  const glueFlapWidth = roundGeometry(clamp(width * 0.24, 20, 35));
  const tuckTongueDepth = roundGeometry(clamp(depth * 0.22, 16, 28));
  const closureDepth = roundGeometry(depth);
  const totalClosureDepth = closureDepth + tuckTongueDepth;
  const dustFlapDepth = roundGeometry(
    clamp(Math.min(depth * 0.48, width * 0.45), 16, 72),
  );
  const margin = 24;
  const rightGuideSpace = 28;

  const bodyX = margin + glueFlapWidth;
  const bodyTop = margin + totalClosureDepth;
  const bodyBottom = bodyTop + height;
  const panel1Left = bodyX;
  const panel1Right = panel1Left + width;
  const panel2Right = panel1Right + depth;
  const panel3Right = panel2Right + width;
  const panel4Right = panel3Right + depth;
  const sheetWidth = panel4Right + margin + rightGuideSpace;
  const sheetHeight = bodyBottom + totalClosureDepth + margin;

  const topClosureHinge = bodyTop - closureDepth;
  const topTongueEdge = margin;
  const bottomClosureHinge = bodyBottom + closureDepth;
  const bottomTongueEdge = sheetHeight - margin;
  const tuckTaper = roundGeometry(clamp(width * 0.08, 5, 14));
  const dustInset = roundGeometry(clamp(Math.min(width, depth) * 0.08, 4, 10));

  const regions: DielineRegion[] = [
    region("glue-flap", "glue", [
      point(margin, bodyTop + 9),
      point(bodyX, bodyTop),
      point(bodyX, bodyBottom),
      point(margin, bodyBottom - 9),
    ]),
    rectangleRegion(
      "front-panel",
      "panel",
      panel1Left,
      bodyTop,
      width,
      height,
    ),
    rectangleRegion(
      "right-side-panel",
      "panel",
      panel1Right,
      bodyTop,
      depth,
      height,
    ),
    rectangleRegion(
      "back-panel",
      "panel",
      panel2Right,
      bodyTop,
      width,
      height,
    ),
    rectangleRegion(
      "left-side-panel",
      "panel",
      panel3Right,
      bodyTop,
      depth,
      height,
    ),
    rectangleRegion(
      "top-closure-panel",
      "flap",
      panel1Left,
      topClosureHinge,
      width,
      closureDepth,
    ),
    region("top-tuck-tongue", "flap", [
      point(panel1Left, topClosureHinge),
      point(panel1Right, topClosureHinge),
      point(panel1Right - tuckTaper, topTongueEdge),
      point(panel1Left + tuckTaper, topTongueEdge),
    ]),
    dustFlapRegion(
      "top-right-dust-flap",
      panel1Right,
      panel2Right,
      bodyTop,
      bodyTop - dustFlapDepth,
      dustInset,
      "top",
    ),
    dustFlapRegion(
      "top-left-dust-flap",
      panel3Right,
      panel4Right,
      bodyTop,
      bodyTop - dustFlapDepth,
      dustInset,
      "top",
    ),
    rectangleRegion(
      "bottom-closure-panel",
      "flap",
      panel2Right,
      bodyBottom,
      width,
      closureDepth,
    ),
    region("bottom-tuck-tongue", "flap", [
      point(panel2Right, bottomClosureHinge),
      point(panel3Right, bottomClosureHinge),
      point(panel3Right - tuckTaper, bottomTongueEdge),
      point(panel2Right + tuckTaper, bottomTongueEdge),
    ]),
    dustFlapRegion(
      "bottom-right-dust-flap",
      panel1Right,
      panel2Right,
      bodyBottom,
      bodyBottom + dustFlapDepth,
      dustInset,
      "bottom",
    ),
    dustFlapRegion(
      "bottom-left-dust-flap",
      panel3Right,
      panel4Right,
      bodyBottom,
      bodyBottom + dustFlapDepth,
      dustInset,
      "bottom",
    ),
  ];

  const cutLines: DielineSegment[] = [];
  const foldLines: DielineSegment[] = [];
  let cutIndex = 0;
  let foldIndex = 0;

  const addCut = (start: Point, end: Point) => {
    cutIndex += 1;
    cutLines.push(segment(`cut-${cutIndex}`, start, end));
  };

  const addFold = (start: Point, end: Point) => {
    foldIndex += 1;
    foldLines.push(segment(`fold-${foldIndex}`, start, end));
  };

  // Glue-flap outer contour and free right edge.
  addCut(point(margin, bodyTop + 9), point(bodyX, bodyTop));
  addCut(point(margin, bodyTop + 9), point(margin, bodyBottom - 9));
  addCut(point(margin, bodyBottom - 9), point(bodyX, bodyBottom));
  addCut(point(panel4Right, bodyTop), point(panel4Right, bodyBottom));

  // Top main closure and tuck tongue, attached to the front panel.
  addCut(point(panel1Left, bodyTop), point(panel1Left, topClosureHinge));
  addCut(
    point(panel1Left, topClosureHinge),
    point(panel1Left + tuckTaper, topTongueEdge),
  );
  addCut(
    point(panel1Left + tuckTaper, topTongueEdge),
    point(panel1Right - tuckTaper, topTongueEdge),
  );
  addCut(
    point(panel1Right - tuckTaper, topTongueEdge),
    point(panel1Right, topClosureHinge),
  );
  addCut(point(panel1Right, topClosureHinge), point(panel1Right, bodyTop));

  addDustFlapCuts(
    addCut,
    panel1Right,
    panel2Right,
    bodyTop,
    bodyTop - dustFlapDepth,
    dustInset,
  );
  addCut(point(panel2Right, bodyTop), point(panel3Right, bodyTop));
  addDustFlapCuts(
    addCut,
    panel3Right,
    panel4Right,
    bodyTop,
    bodyTop - dustFlapDepth,
    dustInset,
  );

  // Bottom closure is attached to the opposite main panel: the RTE behavior.
  addCut(point(panel1Left, bodyBottom), point(panel1Right, bodyBottom));
  addDustFlapCuts(
    addCut,
    panel1Right,
    panel2Right,
    bodyBottom,
    bodyBottom + dustFlapDepth,
    dustInset,
  );
  addCut(point(panel2Right, bodyBottom), point(panel2Right, bottomClosureHinge));
  addCut(
    point(panel2Right, bottomClosureHinge),
    point(panel2Right + tuckTaper, bottomTongueEdge),
  );
  addCut(
    point(panel2Right + tuckTaper, bottomTongueEdge),
    point(panel3Right - tuckTaper, bottomTongueEdge),
  );
  addCut(
    point(panel3Right - tuckTaper, bottomTongueEdge),
    point(panel3Right, bottomClosureHinge),
  );
  addCut(point(panel3Right, bottomClosureHinge), point(panel3Right, bodyBottom));
  addDustFlapCuts(
    addCut,
    panel3Right,
    panel4Right,
    bodyBottom,
    bodyBottom + dustFlapDepth,
    dustInset,
  );

  // Body scores, flap hinges, and tuck-tongue scores.
  for (const x of [bodyX, panel1Right, panel2Right, panel3Right]) {
    addFold(point(x, bodyTop), point(x, bodyBottom));
  }
  addFold(point(panel1Left, bodyTop), point(panel1Right, bodyTop));
  addFold(point(panel1Right, bodyTop), point(panel2Right, bodyTop));
  addFold(point(panel3Right, bodyTop), point(panel4Right, bodyTop));
  addFold(
    point(panel1Left, topClosureHinge),
    point(panel1Right, topClosureHinge),
  );
  addFold(point(panel1Right, bodyBottom), point(panel2Right, bodyBottom));
  addFold(point(panel2Right, bodyBottom), point(panel3Right, bodyBottom));
  addFold(point(panel3Right, bodyBottom), point(panel4Right, bodyBottom));
  addFold(
    point(panel2Right, bottomClosureHinge),
    point(panel3Right, bottomClosureHinge),
  );

  const panelLabelY = bodyTop + height / 2;
  const labels: DielineLabel[] = [
    label(
      "front-label",
      "FRONT / W",
      panel1Left + width / 2,
      panelLabelY,
      true,
    ),
    label(
      "right-side-label",
      "SIDE / D",
      panel1Right + depth / 2,
      panelLabelY,
    ),
    label(
      "back-label",
      "BACK / W",
      panel2Right + width / 2,
      panelLabelY,
      true,
    ),
    label(
      "left-side-label",
      "SIDE / D",
      panel3Right + depth / 2,
      panelLabelY,
    ),
    {
      ...label(
        "glue-label",
        "GLUE",
        margin + glueFlapWidth / 2,
        panelLabelY,
      ),
      rotation: -90,
    },
    label(
      "top-tuck-label",
      "TOP TUCK",
      panel1Left + width / 2,
      topClosureHinge + closureDepth / 2,
    ),
    label(
      "bottom-tuck-label",
      "BOTTOM TUCK",
      panel2Right + width / 2,
      bodyBottom + closureDepth / 2,
    ),
  ];

  const guideInset = clamp(Math.min(width, depth) * 0.12, 5, 12);
  const dimensionGuides: DimensionGuide[] = [
    {
      id: "width-guide",
      label: `W ${formatMillimeters(width)} mm`,
      start: point(panel1Left + guideInset, bodyTop + 26),
      end: point(panel1Right - guideInset, bodyTop + 26),
      labelPoint: point(panel1Left + width / 2, bodyTop + 20),
    },
    {
      id: "depth-guide",
      label: `D ${formatMillimeters(depth)} mm`,
      start: point(panel1Right + guideInset, bodyTop + 52),
      end: point(panel2Right - guideInset, bodyTop + 52),
      labelPoint: point(panel1Right + depth / 2, bodyTop + 46),
    },
    {
      id: "height-guide",
      label: `H ${formatMillimeters(height)} mm`,
      start: point(panel4Right + 13, bodyTop + 8),
      end: point(panel4Right + 13, bodyBottom - 8),
      labelPoint: point(panel4Right + 20, bodyTop + height / 2),
      rotation: 90,
    },
  ];

  return {
    templateCode: BOX_TEMPLATE.code,
    ruleVersion: BOX_TEMPLATE.ruleVersion,
    dimensions,
    sheetWidthMm: roundGeometry(sheetWidth),
    sheetHeightMm: roundGeometry(sheetHeight),
    glueFlapWidthMm: glueFlapWidth,
    closureDepthMm: closureDepth,
    tuckTongueDepthMm: tuckTongueDepth,
    cutLines,
    foldLines,
    regions,
    labels,
    dimensionGuides,
  };
}

function point(x: number, y: number): Point {
  return { x: roundGeometry(x), y: roundGeometry(y) };
}

function segment(id: string, start: Point, end: Point): DielineSegment {
  return { id, start, end };
}

function region(
  id: string,
  kind: DielineRegionKind,
  points: Point[],
): DielineRegion {
  return { id, kind, points };
}

function rectangleRegion(
  id: string,
  kind: DielineRegionKind,
  x: number,
  y: number,
  width: number,
  height: number,
): DielineRegion {
  return region(id, kind, [
    point(x, y),
    point(x + width, y),
    point(x + width, y + height),
    point(x, y + height),
  ]);
}

function dustFlapRegion(
  id: string,
  panelLeft: number,
  panelRight: number,
  bodyEdgeY: number,
  outsideY: number,
  inset: number,
  direction: "top" | "bottom",
): DielineRegion {
  const outsideInset = inset * 1.5;
  const points =
    direction === "top"
      ? [
          point(panelLeft, bodyEdgeY),
          point(panelRight, bodyEdgeY),
          point(panelRight - outsideInset, outsideY),
          point(panelLeft + outsideInset, outsideY),
        ]
      : [
          point(panelLeft, bodyEdgeY),
          point(panelLeft + outsideInset, outsideY),
          point(panelRight - outsideInset, outsideY),
          point(panelRight, bodyEdgeY),
        ];

  return region(id, "flap", points);
}

function addDustFlapCuts(
  addCut: (start: Point, end: Point) => void,
  panelLeft: number,
  panelRight: number,
  bodyEdgeY: number,
  outsideY: number,
  inset: number,
) {
  const outsideInset = inset * 1.5;
  addCut(
    point(panelLeft, bodyEdgeY),
    point(panelLeft + outsideInset, outsideY),
  );
  addCut(
    point(panelLeft + outsideInset, outsideY),
    point(panelRight - outsideInset, outsideY),
  );
  addCut(
    point(panelRight - outsideInset, outsideY),
    point(panelRight, bodyEdgeY),
  );
}

function label(
  id: string,
  text: string,
  x: number,
  y: number,
  emphasis = false,
): DielineLabel {
  return {
    id,
    text,
    x: roundGeometry(x),
    y: roundGeometry(y),
    emphasis,
  };
}
