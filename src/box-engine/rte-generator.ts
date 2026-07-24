import { TEMPLATE_ID } from "./constants";
import {
  calculateRteMetrics,
  formatMm,
  point,
  polygon,
  rectangle,
  segment,
} from "./geometry";
import type {
  BoxDimensions,
  DielineLabel,
  LineSegment,
  RteGeometry,
} from "./types";

function addPolyline(
  target: LineSegment[],
  idPrefix: string,
  points: ReturnType<typeof point>[],
): void {
  for (let index = 0; index < points.length - 1; index += 1) {
    target.push(
      segment(
        `${idPrefix}-${index + 1}`,
        points[index],
        points[index + 1],
      ),
    );
  }
}

export function generateRteGeometry(
  dimensions: BoxDimensions,
): RteGeometry {
  const { width, depth, height } = dimensions;
  const metrics = calculateRteMetrics(dimensions);
  const {
    glueFlap,
    dustFlap,
    totalClosure,
    closureDepth,
    taper,
    dustInset,
    overallWidth,
    overallHeight,
  } = metrics;

  const x0 = 0;
  const x1 = glueFlap;
  const x2 = x1 + width;
  const x3 = x2 + depth;
  const x4 = x3 + width;
  const x5 = x4 + depth;

  const y0 = 0;
  const bodyBottom = totalClosure;
  const bodyTop = bodyBottom + height;
  const bottomTuckHinge = bodyBottom - closureDepth;
  const topTuckHinge = bodyTop + closureDepth;
  const y5 = overallHeight;

  const cutLines: LineSegment[] = [
    segment("cut-left-edge", point(x0, bodyBottom), point(x0, bodyTop)),
    segment("cut-right-edge", point(x5, bodyBottom), point(x5, bodyTop)),
    segment("cut-top-glue", point(x0, bodyTop), point(x1, bodyTop)),
  ];

  addPolyline(cutLines, "cut-top-front-tuck", [
    point(x1, bodyTop),
    point(x1, topTuckHinge),
    point(x1 + taper, y5),
    point(x2 - taper, y5),
    point(x2, topTuckHinge),
    point(x2, bodyTop),
  ]);
  addPolyline(cutLines, "cut-top-side-left", [
    point(x2, bodyTop),
    point(x2 + dustInset, bodyTop + dustFlap),
    point(x3 - dustInset, bodyTop + dustFlap),
    point(x3, bodyTop),
  ]);
  cutLines.push(
    segment("cut-top-back", point(x3, bodyTop), point(x4, bodyTop)),
  );
  addPolyline(cutLines, "cut-top-side-right", [
    point(x4, bodyTop),
    point(x4 + dustInset, bodyTop + dustFlap),
    point(x5 - dustInset, bodyTop + dustFlap),
    point(x5, bodyTop),
  ]);

  cutLines.push(
    segment(
      "cut-bottom-glue",
      point(x0, bodyBottom),
      point(x1, bodyBottom),
    ),
    segment(
      "cut-bottom-front",
      point(x1, bodyBottom),
      point(x2, bodyBottom),
    ),
  );
  addPolyline(cutLines, "cut-bottom-side-left", [
    point(x2, bodyBottom),
    point(x2 + dustInset, bodyBottom - dustFlap),
    point(x3 - dustInset, bodyBottom - dustFlap),
    point(x3, bodyBottom),
  ]);
  addPolyline(cutLines, "cut-bottom-back-tuck", [
    point(x3, bodyBottom),
    point(x3, bottomTuckHinge),
    point(x3 + taper, y0),
    point(x4 - taper, y0),
    point(x4, bottomTuckHinge),
    point(x4, bodyBottom),
  ]);
  addPolyline(cutLines, "cut-bottom-side-right", [
    point(x4, bodyBottom),
    point(x4 + dustInset, bodyBottom - dustFlap),
    point(x5 - dustInset, bodyBottom - dustFlap),
    point(x5, bodyBottom),
  ]);

  const creaseLines: LineSegment[] = [
    segment("crease-glue", point(x1, bodyBottom), point(x1, bodyTop)),
    segment("crease-front-side", point(x2, bodyBottom), point(x2, bodyTop)),
    segment("crease-side-back", point(x3, bodyBottom), point(x3, bodyTop)),
    segment("crease-back-side", point(x4, bodyBottom), point(x4, bodyTop)),
    segment("crease-top-front", point(x1, bodyTop), point(x2, bodyTop)),
    segment("crease-top-side-left", point(x2, bodyTop), point(x3, bodyTop)),
    segment("crease-top-side-right", point(x4, bodyTop), point(x5, bodyTop)),
    segment(
      "crease-bottom-side-left",
      point(x2, bodyBottom),
      point(x3, bodyBottom),
    ),
    segment(
      "crease-bottom-back",
      point(x3, bodyBottom),
      point(x4, bodyBottom),
    ),
    segment(
      "crease-bottom-side-right",
      point(x4, bodyBottom),
      point(x5, bodyBottom),
    ),
    segment(
      "crease-top-tuck-hinge",
      point(x1, topTuckHinge),
      point(x2, topTuckHinge),
    ),
    segment(
      "crease-bottom-tuck-hinge",
      point(x3, bottomTuckHinge),
      point(x4, bottomTuckHinge),
    ),
  ];

  const previewRegions = [
    rectangle("region-glue", x0, bodyBottom, glueFlap, height),
    rectangle("region-front", x1, bodyBottom, width, height),
    rectangle("region-side-left", x2, bodyBottom, depth, height),
    rectangle("region-back", x3, bodyBottom, width, height),
    rectangle("region-side-right", x4, bodyBottom, depth, height),
    polygon("region-top-tuck", [
      point(x1, bodyTop),
      point(x1, topTuckHinge),
      point(x1 + taper, y5),
      point(x2 - taper, y5),
      point(x2, topTuckHinge),
      point(x2, bodyTop),
    ]),
    polygon("region-bottom-tuck", [
      point(x3, bodyBottom),
      point(x3, bottomTuckHinge),
      point(x3 + taper, y0),
      point(x4 - taper, y0),
      point(x4, bottomTuckHinge),
      point(x4, bodyBottom),
    ]),
  ];

  const labels: DielineLabel[] = [
    {
      id: "label-template",
      text: TEMPLATE_ID,
      position: point(x1 + width / 2, bodyTop - 18),
      anchor: "middle",
      kind: "note",
    },
    {
      id: "label-width",
      text: `W ${formatMm(width)}`,
      position: point(x1 + width / 2, bodyBottom + 20),
      anchor: "middle",
      kind: "dimension",
    },
    {
      id: "label-depth",
      text: `D ${formatMm(depth)}`,
      position: point(x2 + depth / 2, bodyBottom + 20),
      anchor: "middle",
      kind: "dimension",
    },
    {
      id: "label-height",
      text: `H ${formatMm(height)}`,
      position: point(x1 + 18, bodyBottom + height / 2),
      rotation: -90,
      anchor: "middle",
      kind: "dimension",
    },
    {
      id: "label-front",
      text: "FRONT",
      position: point(x1 + width / 2, bodyBottom + height / 2),
      anchor: "middle",
      kind: "panel",
    },
    {
      id: "label-side-left",
      text: "SIDE",
      position: point(x2 + depth / 2, bodyBottom + height / 2),
      anchor: "middle",
      kind: "panel",
    },
    {
      id: "label-back",
      text: "BACK",
      position: point(x3 + width / 2, bodyBottom + height / 2),
      anchor: "middle",
      kind: "panel",
    },
    {
      id: "label-side-right",
      text: "SIDE",
      position: point(x4 + depth / 2, bodyBottom + height / 2),
      anchor: "middle",
      kind: "panel",
    },
    {
      id: "label-glue",
      text: "GLUE",
      position: point(x0 + glueFlap / 2, bodyBottom + height / 2),
      rotation: -90,
      anchor: "middle",
      kind: "panel",
    },
  ];

  return {
    templateId: TEMPLATE_ID,
    dimensions: { ...dimensions },
    metrics,
    bounds: {
      minX: 0,
      minY: 0,
      maxX: overallWidth,
      maxY: overallHeight,
      width: overallWidth,
      height: overallHeight,
    },
    cutLines,
    creaseLines,
    glueAreas: [
      rectangle("glue-side-flap", x0, bodyBottom, glueFlap, height),
    ],
    previewRegions,
    labels,
  };
}
