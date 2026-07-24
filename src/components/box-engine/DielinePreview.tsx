"use client";

import { useState } from "react";
import { LAYER_STYLES } from "@/src/box-engine/constants";
import { formatMm } from "@/src/box-engine/geometry";
import type { RteGeometry } from "@/src/box-engine/types";
import { LayerLegend } from "./LayerLegend";

interface DielinePreviewProps {
  geometry: RteGeometry | null;
}

const MIN_ZOOM = 75;
const MAX_ZOOM = 200;
const ZOOM_STEP = 25;
const VIEW_PADDING = 12;

export function DielinePreview({ geometry }: DielinePreviewProps) {
  const [zoom, setZoom] = useState(100);

  return (
    <section
      className="overflow-hidden rounded-[28px] border border-slate-800 bg-[#111827] shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
      aria-labelledby="dieline-preview-title"
    >
      <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-teal-300 uppercase">
            02 / Live geometry
          </p>
          <h2
            id="dieline-preview-title"
            className="mt-1 text-base font-semibold text-white"
          >
            SVG dieline preview
          </h2>
        </div>
        <LayerLegend />
      </div>

      <div className="border-b border-white/10 bg-slate-900 px-5 py-3 sm:flex sm:items-center sm:justify-between sm:px-6">
        <p className="text-xs text-slate-300">
          {geometry ? (
            <>
              <span className="font-semibold text-white">
                {formatMm(geometry.dimensions.width)} ×{" "}
                {formatMm(geometry.dimensions.depth)} ×{" "}
                {formatMm(geometry.dimensions.height)}
              </span>
              <span className="mx-2 text-slate-600">/</span>
              Cut envelope{" "}
              <span className="font-semibold text-white">
                {formatMm(geometry.bounds.width)} ×{" "}
                {formatMm(geometry.bounds.height)}
              </span>
            </>
          ) : (
            "Enter valid dimensions to generate the dieline."
          )}
        </p>
        <div
          className="mt-3 inline-flex items-center rounded-lg border border-white/10 bg-white/5 p-1 sm:mt-0"
          aria-label="Preview zoom controls"
        >
          <button
            type="button"
            onClick={() =>
              setZoom((current) => Math.max(MIN_ZOOM, current - ZOOM_STEP))
            }
            disabled={zoom === MIN_ZOOM}
            aria-label="Zoom out"
            className="grid size-7 place-items-center rounded text-sm font-bold text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => setZoom(100)}
            className="min-w-14 rounded px-2 py-1 text-[10px] font-bold text-slate-300 hover:bg-white/10"
            aria-label={`Reset zoom, currently ${zoom}%`}
          >
            {zoom}%
          </button>
          <button
            type="button"
            onClick={() =>
              setZoom((current) => Math.min(MAX_ZOOM, current + ZOOM_STEP))
            }
            disabled={zoom === MAX_ZOOM}
            aria-label="Zoom in"
            className="grid size-7 place-items-center rounded text-sm font-bold text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
          >
            +
          </button>
        </div>
      </div>

      <div className="relative min-h-[430px] bg-[#dfe4e2] p-3 sm:min-h-[560px] sm:p-5 lg:min-h-[650px]">
        <div
          className="absolute inset-0 opacity-40"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(rgba(15,23,42,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,.08) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {geometry ? (
          <div className="relative flex min-h-[406px] items-center justify-center overflow-auto rounded-2xl border border-slate-300/80 bg-white/90 p-3 shadow-inner sm:min-h-[520px] sm:p-6 lg:min-h-[610px]">
            <svg
              key={`${geometry.dimensions.width}-${geometry.dimensions.depth}-${geometry.dimensions.height}`}
              className="block h-auto max-h-[570px] transition-[width] duration-200"
              style={{ width: `${zoom}%`, minWidth: zoom > 100 ? "620px" : 0 }}
              viewBox={`${-VIEW_PADDING} ${-VIEW_PADDING} ${geometry.bounds.width + VIEW_PADDING * 2} ${geometry.bounds.height + VIEW_PADDING * 2}`}
              role="img"
              aria-label={`${geometry.templateId} Reverse Tuck End dieline with solid cut lines, dashed crease lines, a single shaded glue flap, and dimension labels.`}
              preserveAspectRatio="xMidYMid meet"
            >
              <g
                transform={`translate(0 ${geometry.bounds.height}) scale(1 -1)`}
              >
                <g id="PREVIEW-REGIONS">
                  {geometry.previewRegions.map((region) => (
                    <polygon
                      key={region.id}
                      points={region.points
                        .map((item) => `${item.x},${item.y}`)
                        .join(" ")}
                      fill={
                        region.id === "region-glue" ? "#fef3c7" : "#f8fafc"
                      }
                      stroke="#cbd5e1"
                      strokeWidth="0.35"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                </g>

                <g
                  id="GLUE"
                  fill={LAYER_STYLES.GLUE.color}
                  fillOpacity="0.16"
                  stroke="none"
                >
                  {geometry.glueAreas.map((area) => (
                    <polygon
                      key={area.id}
                      points={area.points
                        .map((item) => `${item.x},${item.y}`)
                        .join(" ")}
                    />
                  ))}
                </g>

                <g
                  id="CUT"
                  fill="none"
                  stroke={LAYER_STYLES.CUT.color}
                  strokeWidth="0.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {geometry.cutLines.map((line) => (
                    <line
                      key={line.id}
                      x1={line.from.x}
                      y1={line.from.y}
                      x2={line.to.x}
                      y2={line.to.y}
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                </g>

                <g
                  id="CREASE"
                  fill="none"
                  stroke={LAYER_STYLES.CREASE.color}
                  strokeWidth="0.55"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                >
                  {geometry.creaseLines.map((line) => (
                    <line
                      key={line.id}
                      x1={line.from.x}
                      y1={line.from.y}
                      x2={line.to.x}
                      y2={line.to.y}
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                </g>
              </g>

              <g
                id="LABELS"
                fill={LAYER_STYLES.LABELS.color}
                fontFamily="Arial, Helvetica, sans-serif"
                textAnchor="middle"
              >
                {geometry.labels.map((label) => {
                  const x = label.position.x;
                  const y = geometry.bounds.height - label.position.y;
                  return (
                    <text
                      key={label.id}
                      x={x}
                      y={y}
                      fontSize={label.kind === "panel" ? 7 : 8}
                      fontWeight={
                        label.kind === "dimension" ? "700" : "600"
                      }
                      textAnchor={label.anchor ?? "start"}
                      dominantBaseline="middle"
                      transform={
                        label.rotation
                          ? `rotate(${label.rotation} ${x} ${y})`
                          : undefined
                      }
                    >
                      {label.text}
                    </text>
                  );
                })}
              </g>
            </svg>
          </div>
        ) : (
          <div className="relative flex min-h-[406px] items-center justify-center rounded-2xl border border-dashed border-slate-400 bg-white/70 p-8 text-center sm:min-h-[520px] lg:min-h-[610px]">
            <div className="max-w-sm">
              <div
                className="mx-auto grid size-12 place-items-center rounded-2xl bg-rose-100 text-xl font-black text-rose-700"
                aria-hidden="true"
              >
                !
              </div>
              <h3 className="mt-4 font-semibold text-slate-950">
                Geometry generation paused
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Correct the dimension errors to regenerate the dieline.
                Downloads remain disabled while the input is invalid.
              </p>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute right-5 bottom-5 rounded-full border border-slate-300 bg-white/90 px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase shadow-sm">
          Prototype / 1-up
        </div>
      </div>
    </section>
  );
}
