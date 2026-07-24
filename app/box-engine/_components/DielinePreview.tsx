import type { RteGeometry } from "../_lib/rte-geometry";

type DielinePreviewProps = {
  geometry: RteGeometry | null;
};

const REGION_FILL = {
  panel: "#f8fafc",
  flap: "#eef2f7",
  glue: "#fef3c7",
} as const;

export function DielinePreview({ geometry }: DielinePreviewProps) {
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
        <DielineLegend />
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
          <div className="relative flex min-h-[406px] items-center justify-center overflow-auto rounded-2xl border border-slate-300/80 bg-white/85 p-3 shadow-inner sm:min-h-[520px] sm:p-6 lg:min-h-[610px]">
            <svg
              key={`${geometry.dimensions.width}-${geometry.dimensions.depth}-${geometry.dimensions.height}`}
              className="h-auto max-h-[580px] w-full min-w-[460px]"
              viewBox={`0 0 ${geometry.sheetWidthMm} ${geometry.sheetHeightMm}`}
              role="img"
              aria-labelledby="live-dieline-title live-dieline-description"
              preserveAspectRatio="xMidYMid meet"
            >
              <title id="live-dieline-title">
                {`${geometry.templateCode} live dieline`}
              </title>
              <desc id="live-dieline-description">
                Reverse tuck end dieline with cut lines, score lines, a single
                glue flap, and dimension labels.
              </desc>

              <g id="preview-regions">
                {geometry.regions.map((region) => (
                  <polygon
                    key={region.id}
                    points={region.points
                      .map((point) => `${point.x},${point.y}`)
                      .join(" ")}
                    fill={REGION_FILL[region.kind]}
                    stroke={region.kind === "glue" ? "#d97706" : "#cbd5e1"}
                    strokeWidth="0.35"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </g>

              <g
                id="preview-cut-lines"
                fill="none"
                stroke="#e23d52"
                strokeWidth="0.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {geometry.cutLines.map((line) => (
                  <line
                    key={line.id}
                    x1={line.start.x}
                    y1={line.start.y}
                    x2={line.end.x}
                    y2={line.end.y}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </g>

              <g
                id="preview-fold-lines"
                fill="none"
                stroke="#2563eb"
                strokeWidth="0.55"
                strokeDasharray="4 3"
                strokeLinecap="round"
              >
                {geometry.foldLines.map((line) => (
                  <line
                    key={line.id}
                    x1={line.start.x}
                    y1={line.start.y}
                    x2={line.end.x}
                    y2={line.end.y}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </g>

              <g
                id="preview-dimensions"
                fill="none"
                stroke="#64748b"
                strokeWidth="0.35"
              >
                {geometry.dimensionGuides.map((guide) => (
                  <g key={guide.id}>
                    <line
                      x1={guide.start.x}
                      y1={guide.start.y}
                      x2={guide.end.x}
                      y2={guide.end.y}
                      vectorEffect="non-scaling-stroke"
                    />
                    <GuideTick
                      point={guide.start}
                      toward={guide.end}
                    />
                    <GuideTick point={guide.end} toward={guide.start} />
                    <text
                      x={guide.labelPoint.x}
                      y={guide.labelPoint.y}
                      fill="#475569"
                      stroke="none"
                      fontSize="7"
                      fontWeight="600"
                      textAnchor="middle"
                      transform={
                        guide.rotation
                          ? `rotate(${guide.rotation} ${guide.labelPoint.x} ${guide.labelPoint.y})`
                          : undefined
                      }
                    >
                      {guide.label}
                    </text>
                  </g>
                ))}
              </g>

              <g
                id="preview-labels"
                fill="#334155"
                fontSize="7"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {geometry.labels.map((label) => (
                  <text
                    key={label.id}
                    x={label.x}
                    y={label.y}
                    fontWeight={label.emphasis ? "700" : "500"}
                    transform={
                      label.rotation
                        ? `rotate(${label.rotation} ${label.x} ${label.y})`
                        : undefined
                    }
                  >
                    {label.text}
                  </text>
                ))}
              </g>
            </svg>
          </div>
        ) : (
          <div className="relative flex min-h-[406px] items-center justify-center rounded-2xl border border-dashed border-slate-400 bg-white/70 p-8 text-center sm:min-h-[520px] lg:min-h-[610px]">
            <div className="max-w-sm">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                <PauseIcon />
              </div>
              <h3 className="mt-4 font-semibold text-slate-950">
                Geometry generation paused
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Correct the dimension errors to regenerate the SVG dieline.
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

function DielineLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-medium text-slate-300">
      <LegendItem color="#e23d52" label="Cut" />
      <LegendItem color="#2563eb" label="Fold / score" dashed />
      <LegendItem color="#f59e0b" label="Glue flap" block />
    </div>
  );
}

function LegendItem({
  color,
  label,
  dashed = false,
  block = false,
}: {
  color: string;
  label: string;
  dashed?: boolean;
  block?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={block ? "h-2.5 w-3 rounded-sm" : "h-px w-4"}
        style={{
          backgroundColor: color,
          backgroundImage: dashed
            ? `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 7px)`
            : undefined,
        }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

function GuideTick({
  point,
  toward,
}: {
  point: { x: number; y: number };
  toward: { x: number; y: number };
}) {
  const dx = toward.x - point.x;
  const dy = toward.y - point.y;
  const length = Math.hypot(dx, dy) || 1;
  const perpendicularX = (-dy / length) * 2.5;
  const perpendicularY = (dx / length) * 2.5;

  return (
    <line
      x1={point.x - perpendicularX}
      y1={point.y - perpendicularY}
      x2={point.x + perpendicularX}
      y2={point.y + perpendicularY}
      vectorEffect="non-scaling-stroke"
    />
  );
}

function PauseIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="6"
        y="5"
        width="3"
        height="12"
        rx="1"
        fill="currentColor"
      />
      <rect
        x="13"
        y="5"
        width="3"
        height="12"
        rx="1"
        fill="currentColor"
      />
    </svg>
  );
}
