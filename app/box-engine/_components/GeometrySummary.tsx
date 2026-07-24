import {
  BOX_TEMPLATE,
  formatMillimeters,
  type RteGeometry,
} from "../_lib/rte-geometry";

type GeometrySummaryProps = {
  geometry: RteGeometry | null;
};

export function GeometrySummary({ geometry }: GeometrySummaryProps) {
  const metrics = geometry
    ? [
        {
          label: "Flat sheet",
          value: `${formatMillimeters(geometry.sheetWidthMm)} × ${formatMillimeters(geometry.sheetHeightMm)} mm`,
        },
        {
          label: "Glue flap",
          value: `${formatMillimeters(geometry.glueFlapWidthMm)} mm`,
        },
        {
          label: "Cut segments",
          value: String(geometry.cutLines.length),
        },
        {
          label: "Fold lines",
          value: String(geometry.foldLines.length),
        },
      ]
    : [
        { label: "Flat sheet", value: "—" },
        { label: "Glue flap", value: "—" },
        { label: "Cut segments", value: "—" },
        { label: "Fold lines", value: "—" },
      ];

  return (
    <section
      className="rounded-[28px] border border-slate-200 bg-[#eef1ed] p-5 sm:p-6"
      aria-labelledby="geometry-summary-title"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-slate-500 uppercase">
            Geometry report
          </p>
          <h2
            id="geometry-summary-title"
            className="mt-2 font-semibold text-slate-950"
          >
            {BOX_TEMPLATE.ruleVersion}
          </h2>
        </div>
        <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[10px] font-bold tracking-wide text-slate-600 uppercase">
          {geometry ? "Generated" : "Waiting"}
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-white p-3.5">
            <dt className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
              {metric.label}
            </dt>
            <dd className="mt-1.5 text-sm font-semibold text-slate-900">
              {metric.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
