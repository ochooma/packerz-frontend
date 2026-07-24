"use client";

import { useState } from "react";
import { createRtePdf, pdfFilename } from "@/src/box-engine/pdf-export";
import { createRteSvg, svgFilename } from "@/src/box-engine/svg-export";
import type { RteGeometry } from "@/src/box-engine/types";

interface ExportButtonsProps {
  geometry: RteGeometry | null;
}

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function ExportButtons({ geometry }: ExportButtonsProps) {
  const [includeLabels, setIncludeLabels] = useState(false);

  const downloadSvg = () => {
    if (!geometry) return;
    const source = createRteSvg(geometry, { includeLabels });
    downloadBlob(
      svgFilename(geometry),
      new Blob([source], { type: "image/svg+xml;charset=utf-8" }),
    );
  };

  const downloadPdf = () => {
    if (!geometry) return;
    const source = createRtePdf(geometry, { includeLabels });
    downloadBlob(
      pdfFilename(geometry),
      new Blob([source], { type: "application/pdf" }),
    );
  };

  return (
    <section
      className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      aria-labelledby="export-title"
    >
      <p className="text-[10px] font-bold tracking-[0.2em] text-teal-700 uppercase">
        03 / Export
      </p>
      <h2
        id="export-title"
        className="mt-1 text-lg font-semibold tracking-tight text-slate-950"
      >
        Vector production files
      </h2>

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
        <input
          type="checkbox"
          checked={includeLabels}
          onChange={(event) => setIncludeLabels(event.target.checked)}
          className="mt-0.5 size-4 accent-teal-700"
        />
        <span>
          <span className="block text-xs font-semibold text-slate-800">
            Include LABELS annotations
          </span>
          <span className="mt-1 block text-[11px] leading-4 text-slate-500">
            Off by default for production paths. Layer group remains present.
          </span>
        </span>
      </label>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        <button
          type="button"
          onClick={downloadSvg}
          disabled={!geometry}
          className="rounded-xl bg-slate-950 px-4 py-3 text-xs font-bold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Download production SVG
        </button>
        <button
          type="button"
          onClick={downloadPdf}
          disabled={!geometry}
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-bold text-slate-800 transition hover:border-slate-500 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
        >
          Download vector PDF
        </button>
      </div>

      <p className="mt-4 text-[11px] leading-5 text-slate-500">
        No native AI file is generated. Factory workflow: verify size and
        layers in Adobe Illustrator, then save an AI working file before CNC.
      </p>
    </section>
  );
}
