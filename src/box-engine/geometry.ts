import { GEOMETRY_ASSUMPTIONS } from "./constants";
import type {
  BoxDimensions,
  LineSegment,
  Point,
  Polygon,
  RteMetrics,
} from "./types";

export function roundMm(value: number, places = 3): number {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function point(x: number, y: number): Point {
  return { x: roundMm(x), y: roundMm(y) };
}

export function segment(
  id: string,
  from: Point,
  to: Point,
): LineSegment {
  return { id, from, to };
}

export function polygon(id: string, points: Point[]): Polygon {
  return { id, points };
}

export function rectangle(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
): Polygon {
  return polygon(id, [
    point(x, y),
    point(x + width, y),
    point(x + width, y + height),
    point(x, y + height),
  ]);
}

export function formatMm(value: number): string {
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)} mm`;
}

export function calculateRteMetrics(
  dimensions: BoxDimensions,
): RteMetrics {
  const { width, depth, height } = dimensions;
  const glueFlap = roundMm(
    clamp(
      width * GEOMETRY_ASSUMPTIONS.glueFlapWidthRatio,
      GEOMETRY_ASSUMPTIONS.glueFlapMin,
      GEOMETRY_ASSUMPTIONS.glueFlapMax,
    ),
  );
  const tuckTongue = roundMm(
    clamp(
      depth * GEOMETRY_ASSUMPTIONS.tuckTongueRatio,
      GEOMETRY_ASSUMPTIONS.tuckTongueMin,
      GEOMETRY_ASSUMPTIONS.tuckTongueMax,
    ),
  );
  const dustFlap = roundMm(
    clamp(
      Math.min(
        depth * GEOMETRY_ASSUMPTIONS.dustFlapDepthRatio,
        width * GEOMETRY_ASSUMPTIONS.dustFlapWidthRatio,
      ),
      GEOMETRY_ASSUMPTIONS.dustFlapMin,
      GEOMETRY_ASSUMPTIONS.dustFlapMax,
    ),
  );
  const taper = roundMm(
    clamp(
      width * GEOMETRY_ASSUMPTIONS.flapTaperRatio,
      GEOMETRY_ASSUMPTIONS.flapTaperMin,
      GEOMETRY_ASSUMPTIONS.flapTaperMax,
    ),
  );
  const dustInset = roundMm(
    clamp(
      Math.min(width, depth) * GEOMETRY_ASSUMPTIONS.dustInsetRatio,
      GEOMETRY_ASSUMPTIONS.dustInsetMin,
      GEOMETRY_ASSUMPTIONS.dustInsetMax,
    ),
  );
  const closureDepth = roundMm(depth);
  const totalClosure = roundMm(closureDepth + tuckTongue);

  return {
    glueFlap,
    dustFlap,
    tuckTongue,
    closureDepth,
    totalClosure,
    taper,
    dustInset,
    overallWidth: roundMm(glueFlap + width * 2 + depth * 2),
    overallHeight: roundMm(height + totalClosure * 2),
  };
}
