import { EXPORT_MARGIN_MM } from "./constants";
import { roundMm } from "./geometry";
import type {
  DielineLabel,
  ExportOptions,
  LineSegment,
  Polygon,
  RteGeometry,
} from "./types";

const POINTS_PER_MM = 72 / 25.4;

function mmToPoints(value: number): number {
  return roundMm(value * POINTS_PER_MM);
}

function pdfNumber(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function escapePdfText(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function lineCommand(line: LineSegment, margin: number): string {
  return [
    `${pdfNumber(mmToPoints(line.from.x + margin))} ${pdfNumber(mmToPoints(line.from.y + margin))} m`,
    `${pdfNumber(mmToPoints(line.to.x + margin))} ${pdfNumber(mmToPoints(line.to.y + margin))} l S`,
  ].join("\n");
}

function polygonCommand(value: Polygon, margin: number): string {
  const [first, ...rest] = value.points;
  const commands = [
    `${pdfNumber(mmToPoints(first.x + margin))} ${pdfNumber(mmToPoints(first.y + margin))} m`,
    ...rest.map(
      (item) =>
        `${pdfNumber(mmToPoints(item.x + margin))} ${pdfNumber(mmToPoints(item.y + margin))} l`,
    ),
    "h f",
  ];
  return commands.join("\n");
}

function labelCommand(label: DielineLabel, margin: number): string {
  const x = pdfNumber(mmToPoints(label.position.x + margin));
  const y = pdfNumber(mmToPoints(label.position.y + margin));
  const fontSize = label.kind === "panel" ? 7 : 8;
  const matrix = label.rotation === -90 ? `0 -1 1 0 ${x} ${y}` : `1 0 0 1 ${x} ${y}`;

  return [
    "BT",
    `/F1 ${fontSize} Tf`,
    `${matrix} Tm`,
    `(${escapePdfText(label.text)}) Tj`,
    "ET",
  ].join("\n");
}

function buildPdf(objects: string[]): string {
  const header = "%PDF-1.4\n%Packerz\n";
  const chunks: string[] = [header];
  const offsets: number[] = [0];
  let length = header.length;

  objects.forEach((body, index) => {
    offsets.push(length);
    const object = `${index + 1} 0 obj\n${body}\nendobj\n`;
    chunks.push(object);
    length += object.length;
  });

  const xrefOffset = length;
  const xref = [
    `xref\n0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets
      .slice(1)
      .map((offset) => `${offset.toString().padStart(10, "0")} 00000 n `),
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 6 0 R >>`,
    `startxref\n${xrefOffset}`,
    "%%EOF",
    "",
  ].join("\n");
  chunks.push(xref);

  return chunks.join("");
}

function safeMargin(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value) || value < 0) {
    return EXPORT_MARGIN_MM;
  }
  return roundMm(value);
}

export function createRtePdf(
  geometry: RteGeometry,
  options: ExportOptions = {},
): string {
  const margin = safeMargin(options.marginMm);
  const pageWidth = mmToPoints(geometry.bounds.width + margin * 2);
  const pageHeight = mmToPoints(geometry.bounds.height + margin * 2);
  const includeLabels = options.includeLabels ?? false;

  const content = [
    "q",
    "1 J 1 j",
    "/GLUE BMC",
    "0.98 0.78 0.25 rg",
    ...geometry.glueAreas.map((area) => polygonCommand(area, margin)),
    "EMC",
    "/CUT BMC",
    "0.88 0.11 0.28 RG",
    `${pdfNumber(mmToPoints(0.35))} w`,
    "[] 0 d",
    ...geometry.cutLines.map((line) => lineCommand(line, margin)),
    "EMC",
    "/CREASE BMC",
    "0.15 0.39 0.92 RG",
    `${pdfNumber(mmToPoints(0.3))} w`,
    `[${pdfNumber(mmToPoints(4))} ${pdfNumber(mmToPoints(3))}] 0 d`,
    ...geometry.creaseLines.map((line) => lineCommand(line, margin)),
    "EMC",
    "/LABELS BMC",
    ...(includeLabels
      ? [
          "0.2 0.25 0.33 rg",
          "[] 0 d",
          ...geometry.labels.map((label) => labelCommand(label, margin)),
        ]
      : []),
    "EMC",
    "Q",
  ].join("\n");

  const contentLength = new TextEncoder().encode(content).length;
  const title =
    `${geometry.templateId} ${geometry.dimensions.width}x` +
    `${geometry.dimensions.depth}x${geometry.dimensions.height}mm`;

  return buildPdf([
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfNumber(pageWidth)} ${pdfNumber(pageHeight)}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${contentLength} >>\nstream\n${content}\nendstream`,
    `<< /Title (${escapePdfText(title)}) /Subject (Unprinted structural carton dieline - verify scale and convert to AI in Adobe Illustrator before CNC) /Creator (Packerz Box Engine) /Producer (Packerz vector PDF exporter) >>`,
  ]);
}

export function pdfFilename(geometry: RteGeometry): string {
  const { width, depth, height } = geometry.dimensions;
  return `${geometry.templateId}_${width}x${depth}x${height}mm.pdf`;
}
