/* eslint-disable @typescript-eslint/no-require-imports */
require("./register-typescript.cjs");

const assert = require("node:assert/strict");
const test = require("node:test");
const { DEFAULT_DIMENSIONS } = require("../constants.ts");
const { createRtePdf } = require("../pdf-export.ts");
const { generateRteGeometry } = require("../rte-generator.ts");
const { createRteSvg } = require("../svg-export.ts");

const geometry = generateRteGeometry({ ...DEFAULT_DIMENSIONS });

test("production SVG preserves the required vector layer groups", () => {
  const svg = createRteSvg(geometry);

  for (const layer of ["CUT", "CREASE", "GLUE", "LABELS"]) {
    assert.match(svg, new RegExp(`<g id="${layer}"`));
  }
  assert.match(svg, /id="CREASE"[^>]*stroke-dasharray="4 3"/);
  assert.match(svg, /data-exported="false"/);
  assert.doesNotMatch(svg, /<script|<foreignObject|(?:href|src)="https?:\/\//);
});

test("SVG labels are optional and output remains deterministic", () => {
  const withoutLabels = createRteSvg(geometry);
  const withLabels = createRteSvg(geometry, { includeLabels: true });

  assert.equal(withoutLabels, createRteSvg(geometry));
  assert.doesNotMatch(withoutLabels, /id="label-width"/);
  assert.match(withLabels, /id="label-width"/);
  assert.match(withLabels, /W 100 mm/);
});

test("PDF output uses vector drawing commands and logical layer marks", () => {
  const pdf = createRtePdf(geometry);

  assert.ok(pdf.startsWith("%PDF-1.4"));
  assert.ok(pdf.endsWith("%%EOF\n"));
  assert.match(pdf, /\/CUT BMC/);
  assert.match(pdf, /\/CREASE BMC/);
  assert.match(pdf, /\/GLUE BMC/);
  assert.match(pdf, /\sm\n.+\sl S/);
  assert.doesNotMatch(pdf, /\/Subtype \/Image/);
  assert.equal(pdf, createRtePdf(geometry));
});
