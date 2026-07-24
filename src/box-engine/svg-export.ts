import { EXPORT_MARGIN_MM, LAYER_STYLES } from "./constants";
import { roundMm } from "./geometry";
import type {
  DielineLabel,
  ExportOptions,
  LineSegment,
  Point,
  Polygon,
  RteGeometry,
} from "./types";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function serializePoint(value: number): string {
  return roundMm(value).toString();
}

function lineToSvg(line: LineSegment): string {
  return (
    `<line id="${escapeXml(line.id)}" ` +
    `x1="${serializePoint(line.from.x)}" y1="${serializePoint(line.from.y)}" ` +
    `x2="${serializePoint(line.to.x)}" y2="${serializePoint(line.to.y)}" />`
  );
}

function polygonToSvg(value: Polygon): string {
  const points = value.points
    .map((item) => `${serializePoint(item.x)},${serializePoint(item.y)}`)
    .join(" ");
  return `<polygon id="${escapeXml(value.id)}" points="${points}" />`;
}

function labelToSvg(
  label: DielineLabel,
  pageHeight: number,
  margin: number,
): string {
  const x = roundMm(label.position.x + margin);
  const y = roundMm(pageHeight - margin - label.position.y);
  const rotation = label.rotation
    ? ` transform="rotate(${label.rotation} ${x} ${y})"`
    : "";
  const fontSize = label.kind === "panel" ? 7 : 8;

  return (
    `<text id="${escapeXml(label.id)}" x="${x}" y="${y}"` +
    ` text-anchor="${label.anchor ?? "start"}"${rotation}` +
    ` font-size="${fontSize}" font-family="Arial, Helvetica, sans-serif">` +
    `${escapeXml(label.text)}</text>`
  );
}

function safeMargin(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value) || value < 0) {
    return EXPORT_MARGIN_MM;
  }
  return roundMm(value);
}

export function createRteSvg(
  geometry: RteGeometry,
  options: ExportOptions = {},
): string {
  const margin = safeMargin(options.marginMm);
  const pageWidth = roundMm(geometry.bounds.width + margin * 2);
  const pageHeight = roundMm(geometry.bounds.height + margin * 2);
  const includeLabels = options.includeLabels ?? false;
  const transform =
    `translate(${margin} ${roundMm(geometry.bounds.height + margin)}) ` +
    "scale(1 -1)";

  const glue = geometry.glueAreas.map(polygonToSvg).join("\n      ");
  const cut = geometry.cutLines.map(lineToSvg).join("\n      ");
  const crease = geometry.creaseLines.map(lineToSvg).join("\n      ");
  const labels = includeLabels
    ? geometry.labels
        .map((label) => labelToSvg(label, pageHeight, margin))
        .join("\n      ")
    : "";

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${pageWidth}mm" height="${pageHeight}mm" viewBox="0 0 ${pageWidth} ${pageHeight}" role="img" aria-labelledby="title description">`,
    `  <title id="title">${geometry.templateId} production dieline</title>`,
    `  <desc id="description">Unprinted Reverse Tuck End carton, ${geometry.dimensions.width} × ${geometry.dimensions.depth} × ${geometry.dimensions.height} mm. Units are millimeters.</desc>`,
    `  <g id="GLUE" data-layer="GLUE" transform="${transform}" fill="${LAYER_STYLES.GLUE.color}" fill-opacity="0.16" stroke="none">`,
    `      ${glue}`,
    "  </g>",
    `  <g id="CUT" data-layer="CUT" transform="${transform}" fill="none" stroke="${LAYER_STYLES.CUT.color}" stroke-width="0.35" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke">`,
    `      ${cut}`,
    "  </g>",
    `  <g id="CREASE" data-layer="CREASE" transform="${transform}" fill="none" stroke="${LAYER_STYLES.CREASE.color}" stroke-width="0.3" stroke-dasharray="4 3" stroke-linecap="round" vector-effect="non-scaling-stroke">`,
    `      ${crease}`,
    "  </g>",
    `  <g id="LABELS" data-layer="LABELS" data-exported="${includeLabels}" fill="${LAYER_STYLES.LABELS.color}">`,
    labels ? `      ${labels}` : "",
    "  </g>",
    "</svg>",
    "",
  ].join("\n");
}

export function svgFilename(geometry: RteGeometry): string {
  const { width, depth, height } = geometry.dimensions;
  return `${geometry.templateId}_${width}x${depth}x${height}mm.svg`;
}

export function pointsToSvg(points: Point[]): string {
  return points
    .map((item) => `${serializePoint(item.x)},${serializePoint(item.y)}`)
    .join(" ");
}
