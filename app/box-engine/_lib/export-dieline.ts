import {
  BOX_TEMPLATE,
  formatMillimeters,
  type DielineRegion,
  type Point,
  type RteGeometry,
} from "./rte-geometry";

const SVG_COLORS = {
  cut: "#e23d52",
  fold: "#2563eb",
  dimension: "#64748b",
  panelFill: "#f8fafc",
  flapFill: "#eef2f7",
  glueFill: "#fef3c7",
  glueStroke: "#d97706",
  text: "#334155",
} as const;

export function buildSvgDocument(geometry: RteGeometry): string {
  const { sheetWidthMm, sheetHeightMm } = geometry;
  const metadata = [
    `Template: ${geometry.templateCode}`,
    `Rule: ${geometry.ruleVersion}`,
    `Material: ${BOX_TEMPLATE.material}`,
    `Dimensions: ${formatDimensionSet(geometry)}`,
    "Status: internal prototype; not production tooling",
  ].join(" | ");

  const regionMarkup = geometry.regions
    .map((region) => {
      const fill =
        region.kind === "glue"
          ? SVG_COLORS.glueFill
          : region.kind === "flap"
            ? SVG_COLORS.flapFill
            : SVG_COLORS.panelFill;
      const stroke =
        region.kind === "glue" ? SVG_COLORS.glueStroke : "#cbd5e1";

      return `<polygon id="${region.id}" data-region="${region.kind}" points="${pointsAttribute(region.points)}" fill="${fill}" stroke="${stroke}" stroke-width="0.35" vector-effect="non-scaling-stroke"/>`;
    })
    .join("");

  const cutMarkup = geometry.cutLines
    .map(
      (line) =>
        `<line id="${line.id}" x1="${line.start.x}" y1="${line.start.y}" x2="${line.end.x}" y2="${line.end.y}" vector-effect="non-scaling-stroke"/>`,
    )
    .join("");

  const foldMarkup = geometry.foldLines
    .map(
      (line) =>
        `<line id="${line.id}" x1="${line.start.x}" y1="${line.start.y}" x2="${line.end.x}" y2="${line.end.y}" vector-effect="non-scaling-stroke"/>`,
    )
    .join("");

  const dimensionMarkup = geometry.dimensionGuides
    .map((guide) => {
      const rotation = guide.rotation
        ? ` transform="rotate(${guide.rotation} ${guide.labelPoint.x} ${guide.labelPoint.y})"`
        : "";
      return [
        `<g id="${guide.id}">`,
        `<g fill="none" stroke="${SVG_COLORS.dimension}" stroke-width="0.35">`,
        `<line x1="${guide.start.x}" y1="${guide.start.y}" x2="${guide.end.x}" y2="${guide.end.y}" vector-effect="non-scaling-stroke"/>`,
        tickMarkup(guide.start, guide.end),
        tickMarkup(guide.end, guide.start),
        "</g>",
        `<text x="${guide.labelPoint.x}" y="${guide.labelPoint.y}"${rotation} fill="${SVG_COLORS.text}" stroke="none">${escapeXml(guide.label)}</text>`,
        "</g>",
      ].join("");
    })
    .join("");

  const labelMarkup = geometry.labels
    .map((label) => {
      const rotation = label.rotation
        ? ` transform="rotate(${label.rotation} ${label.x} ${label.y})"`
        : "";
      const weight = label.emphasis ? ' font-weight="700"' : "";
      return `<text id="${label.id}" x="${label.x}" y="${label.y}"${rotation}${weight}>${escapeXml(label.text)}</text>`;
    })
    .join("");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${sheetWidthMm}mm" height="${sheetHeightMm}mm" viewBox="0 0 ${sheetWidthMm} ${sheetHeightMm}" role="img" aria-labelledby="title description">`,
    `<title id="title">${geometry.templateCode} dieline</title>`,
    `<desc id="description">${escapeXml(metadata)}</desc>`,
    `<metadata>${escapeXml(metadata)}</metadata>`,
    `<rect width="${sheetWidthMm}" height="${sheetHeightMm}" fill="#ffffff"/>`,
    `<g id="REGIONS">${regionMarkup}</g>`,
    `<g id="CUT" data-layer="CUT" fill="none" stroke="${SVG_COLORS.cut}" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round">${cutMarkup}</g>`,
    `<g id="SCORE" data-layer="SCORE" fill="none" stroke="${SVG_COLORS.fold}" stroke-width="0.55" stroke-dasharray="4 3" stroke-linecap="round">${foldMarkup}</g>`,
    `<g id="DIMENSION" data-layer="DIMENSION" font-family="Arial, Helvetica, sans-serif" font-size="7" text-anchor="middle">${dimensionMarkup}</g>`,
    `<g id="ANNOTATION" data-layer="ANNOTATION" fill="${SVG_COLORS.text}" font-family="Arial, Helvetica, sans-serif" font-size="7" text-anchor="middle" dominant-baseline="middle">${labelMarkup}</g>`,
    "</svg>",
  ].join("");
}

export function buildPdfBlob(geometry: RteGeometry): Blob {
  const pointsPerMillimeter = 72 / 25.4;
  const pageWidth = geometry.sheetWidthMm * pointsPerMillimeter;
  const pageHeight = geometry.sheetHeightMm * pointsPerMillimeter;
  const content: string[] = [];

  const toX = (value: number) => pdfNumber(value * pointsPerMillimeter);
  const toY = (value: number) =>
    pdfNumber(pageHeight - value * pointsPerMillimeter);

  content.push("q");
  for (const region of geometry.regions) {
    const fill =
      region.kind === "glue"
        ? "0.996 0.953 0.780"
        : region.kind === "flap"
          ? "0.933 0.949 0.969"
          : "0.973 0.980 0.988";
    content.push(`${fill} rg`);
    content.push(pdfPolygon(region, toX, toY));
    content.push("f");
  }
  content.push("Q");

  content.push("1 J 1 j");
  content.push("0.886 0.239 0.322 RG");
  content.push(`${pdfNumber(0.7 * pointsPerMillimeter)} w`);
  content.push("[] 0 d");
  for (const line of geometry.cutLines) {
    content.push(
      `${toX(line.start.x)} ${toY(line.start.y)} m ${toX(line.end.x)} ${toY(line.end.y)} l S`,
    );
  }

  content.push("0.145 0.388 0.922 RG");
  content.push(`${pdfNumber(0.55 * pointsPerMillimeter)} w`);
  content.push(
    `[${pdfNumber(4 * pointsPerMillimeter)} ${pdfNumber(3 * pointsPerMillimeter)}] 0 d`,
  );
  for (const line of geometry.foldLines) {
    content.push(
      `${toX(line.start.x)} ${toY(line.start.y)} m ${toX(line.end.x)} ${toY(line.end.y)} l S`,
    );
  }

  content.push("[] 0 d");
  content.push("0.392 0.455 0.545 RG");
  content.push(`${pdfNumber(0.35 * pointsPerMillimeter)} w`);
  for (const guide of geometry.dimensionGuides) {
    content.push(
      `${toX(guide.start.x)} ${toY(guide.start.y)} m ${toX(guide.end.x)} ${toY(guide.end.y)} l S`,
    );
    content.push(pdfTick(guide.start, guide.end, toX, toY));
    content.push(pdfTick(guide.end, guide.start, toX, toY));
  }

  content.push("0.200 0.255 0.333 rg");
  for (const label of geometry.labels) {
    content.push(
      pdfText(
        label.text,
        label.x,
        label.y,
        label.emphasis ? 8 : 7,
        toX,
        toY,
      ),
    );
  }
  for (const guide of geometry.dimensionGuides) {
    content.push(
      pdfText(
        guide.label,
        guide.labelPoint.x,
        guide.labelPoint.y,
        7,
        toX,
        toY,
      ),
    );
  }

  content.push(
    pdfText(
      `${geometry.templateCode} | ${formatDimensionSet(geometry)} | ${BOX_TEMPLATE.material}`,
      24,
      geometry.sheetHeightMm - 11,
      7,
      toX,
      toY,
      "left",
    ),
  );
  content.push(
    pdfText(
      "INTERNAL PROTOTYPE - NOT PRODUCTION TOOLING",
      geometry.sheetWidthMm - 24,
      geometry.sheetHeightMm - 11,
      7,
      toX,
      toY,
      "right",
    ),
  );

  const stream = content.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfNumber(pageWidth)} ${pdfNumber(pageHeight)}] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>`,
    `<< /Length ${byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Title (${escapePdf(`${geometry.templateCode} dieline`)}) /Subject (${escapePdf("Internal prototype dieline; not production tooling")}) /Creator (Packerz Box Engine Prototype) >>`,
  ];

  let pdf = "%PDF-1.4\n%PACKERZ\n";
  const offsets: number[] = [0];

  objects.forEach((object, index) => {
    offsets.push(byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 6 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

export function buildExportFilename(
  geometry: RteGeometry,
  extension: "svg" | "pdf",
): string {
  const { width, depth, height } = geometry.dimensions;
  return [
    geometry.templateCode,
    `${formatMillimeters(width)}x${formatMillimeters(depth)}x${formatMillimeters(height)}`,
    geometry.ruleVersion,
  ].join("_") + `.${extension}`;
}

function formatDimensionSet(geometry: RteGeometry): string {
  const { width, depth, height } = geometry.dimensions;
  return `${formatMillimeters(width)} x ${formatMillimeters(depth)} x ${formatMillimeters(height)} mm`;
}

function pointsAttribute(points: Point[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function tickMarkup(point: Point, toward: Point): string {
  const dx = toward.x - point.x;
  const dy = toward.y - point.y;
  const length = Math.hypot(dx, dy) || 1;
  const perpendicularX = (-dy / length) * 2.5;
  const perpendicularY = (dx / length) * 2.5;

  return `<line x1="${point.x - perpendicularX}" y1="${point.y - perpendicularY}" x2="${point.x + perpendicularX}" y2="${point.y + perpendicularY}"/>`;
}

function pdfPolygon(
  region: DielineRegion,
  toX: (value: number) => string,
  toY: (value: number) => string,
): string {
  const [first, ...rest] = region.points;
  const commands = [`${toX(first.x)} ${toY(first.y)} m`];
  for (const point of rest) {
    commands.push(`${toX(point.x)} ${toY(point.y)} l`);
  }
  commands.push("h");
  return commands.join(" ");
}

function pdfTick(
  point: Point,
  toward: Point,
  toX: (value: number) => string,
  toY: (value: number) => string,
): string {
  const dx = toward.x - point.x;
  const dy = toward.y - point.y;
  const length = Math.hypot(dx, dy) || 1;
  const perpendicularX = (-dy / length) * 2.5;
  const perpendicularY = (dx / length) * 2.5;
  return `${toX(point.x - perpendicularX)} ${toY(point.y - perpendicularY)} m ${toX(point.x + perpendicularX)} ${toY(point.y + perpendicularY)} l S`;
}

function pdfText(
  value: string,
  x: number,
  y: number,
  fontSize: number,
  toX: (value: number) => string,
  toY: (value: number) => string,
  alignment: "left" | "center" | "right" = "center",
): string {
  const approximateWidth = value.length * fontSize * 0.48;
  const xOffset =
    alignment === "right"
      ? approximateWidth
      : alignment === "center"
        ? approximateWidth / 2
        : 0;
  const xPosition = Number(toX(x)) - xOffset;
  return `BT /F1 ${fontSize} Tf ${pdfNumber(xPosition)} ${toY(y)} Td (${escapePdf(value)}) Tj ET`;
}

function pdfNumber(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function escapePdf(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}
