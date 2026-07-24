export type DimensionKey = "width" | "depth" | "height";

export type DimensionInputs = Record<DimensionKey, string>;

export interface BoxDimensions {
  width: number;
  depth: number;
  height: number;
}

export interface DimensionLimit {
  min: number;
  max: number;
}

export type DimensionLimits = Record<DimensionKey, DimensionLimit>;

export interface ValidationIssue {
  code: string;
  message: string;
  field?: DimensionKey;
}

export interface ValidationResult {
  dimensions: BoxDimensions | null;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface Point {
  x: number;
  y: number;
}

export interface LineSegment {
  id: string;
  from: Point;
  to: Point;
}

export interface Polygon {
  id: string;
  points: Point[];
}

export interface DielineLabel {
  id: string;
  text: string;
  position: Point;
  rotation?: number;
  anchor?: "start" | "middle" | "end";
  kind?: "dimension" | "panel" | "note";
}

export interface RteMetrics {
  glueFlap: number;
  dustFlap: number;
  tuckTongue: number;
  closureDepth: number;
  totalClosure: number;
  taper: number;
  dustInset: number;
  overallWidth: number;
  overallHeight: number;
}

export interface DielineBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface RteGeometry {
  templateId: "BOX-RTE-001";
  dimensions: BoxDimensions;
  metrics: RteMetrics;
  bounds: DielineBounds;
  cutLines: LineSegment[];
  creaseLines: LineSegment[];
  glueAreas: Polygon[];
  previewRegions: Polygon[];
  labels: DielineLabel[];
}

export interface ExportOptions {
  includeLabels?: boolean;
  marginMm?: number;
}

export type SvgLayerId = "CUT" | "CREASE" | "GLUE" | "LABELS";
