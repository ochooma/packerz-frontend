"use client";

import { useState } from "react";
import {
  buildExportFilename,
  buildPdfBlob,
  buildSvgDocument,
} from "../_lib/export-dieline";
import type { RteGeometry } from "../_lib/rte-geometry";

type ExportActionsProps = {
  geometry: RteGeometry | null;
};

type ExportFormat = "svg" | "pdf";

export function ExportActions({ geometry }: ExportActionsProps) {
  const [activeDownload, setActiveDownload] =
    useState<ExportFormat | null>(null);

  const download = (format: ExportFormat) => {
    if (!geometry) {
      return;
    }

    setActiveDownload(format);

    const blob =
      format === "svg"
        ? new Blob([buildSvgDocument(geometry)], {
            type: "image/svg+xml;charset=utf-8",
          })
        : buildPdfBlob(geometry);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = buildExportFilename(geometry, format);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    window.setTimeout(() => setActiveDownload(null), 350);
  };

  return (
    <section
      className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.07)] sm:p-6"
      aria-labelledby="export-actions-title"
    >
      <p className="text-[11px] font-bold tracking-[0.2em] text-teal-700 uppercase">
        03 / Export
      </p>
      <h2
        id="export-actions-title"
        className="mt-2 text-xl font-semibold tracking-tight text-slate-950"
      >
        Local downloads
      </h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        SVG and vector PDF are generated directly in this browser.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <DownloadButton
          format="svg"
          label="Download SVG"
          detail="Layered vector · millimeters"
          disabled={!geometry}
          active={activeDownload === "svg"}
          onClick={() => download("svg")}
        />
        <DownloadButton
          format="pdf"
          label="Download PDF"
          detail="Vector PDF · 1:1 custom page"
          disabled={!geometry}
          active={activeDownload === "pdf"}
          onClick={() => download("pdf")}
        />
      </div>

      <div className="mt-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
        <div className="mt-0.5 shrink-0 text-amber-700">
          <ShieldIcon />
        </div>
        <p className="text-xs leading-5 text-amber-950">
          Internal prototype only. Export dimensions and flap rules are not
          approved for CNC cutting or production.
        </p>
      </div>
    </section>
  );
}

function DownloadButton({
  format,
  label,
  detail,
  disabled,
  active,
  onClick,
}: {
  format: ExportFormat;
  label: string;
  detail: string;
  disabled: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "group flex min-h-16 items-center gap-3 rounded-2xl border px-4 text-left transition",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600",
        disabled
          ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-50"
          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-teal-500 hover:shadow-md",
      ].join(" ")}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-[10px] font-black tracking-wide text-white uppercase">
        {format}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-950">
          {active ? "Preparing…" : label}
        </span>
        <span className="mt-0.5 block truncate text-xs text-slate-500">
          {detail}
        </span>
      </span>
      <span
        className="text-slate-400 transition group-hover:translate-y-0.5 group-hover:text-teal-700"
        aria-hidden="true"
      >
        <DownloadIcon />
      </span>
    </button>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M9 2.5v8m0 0 3-3m-3 3-3-3M3 13.5h12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
      <path
        d="M8.5 1.75 14 4v3.6c0 3.4-2.25 6.25-5.5 7.65C5.25 13.85 3 11 3 7.6V4l5.5-2.25Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 5v4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M8.5 11.4h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
