import { MVP_DIMENSION_LIMITS } from "@/src/box-engine/constants";
import type {
  DimensionInputs,
  DimensionKey,
  ValidationIssue,
} from "@/src/box-engine/types";

interface DimensionFormProps {
  inputs: DimensionInputs;
  errors: ValidationIssue[];
  onChange: (field: DimensionKey, value: string) => void;
  onReset: () => void;
}

const FIELDS: Array<{
  key: DimensionKey;
  label: string;
  abbreviation: string;
}> = [
  { key: "width", label: "Width", abbreviation: "W" },
  { key: "depth", label: "Depth", abbreviation: "D" },
  { key: "height", label: "Height", abbreviation: "H" },
];

export function DimensionForm({
  inputs,
  errors,
  onChange,
  onReset,
}: DimensionFormProps) {
  return (
    <section
      className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      aria-labelledby="dimension-form-title"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-teal-700 uppercase">
            01 / Configure
          </p>
          <h2
            id="dimension-form-title"
            className="mt-1 text-lg font-semibold tracking-tight text-slate-950"
          >
            Finished inside dimensions
          </h2>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 uppercase">
          mm only
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {FIELDS.map(({ key, label, abbreviation }) => {
          const fieldError = errors.find((issue) => issue.field === key);
          const limit = MVP_DIMENSION_LIMITS[key];
          const helpId = `${key}-dimension-help`;
          const errorId = `${key}-dimension-error`;

          return (
            <div key={key}>
              <div className="mb-2 flex items-end justify-between gap-3">
                <label
                  htmlFor={`${key}-dimension`}
                  className="text-sm font-semibold text-slate-800"
                >
                  {label}
                  <span className="ml-1.5 text-xs font-medium text-slate-400">
                    ({abbreviation})
                  </span>
                </label>
                <span
                  id={helpId}
                  className="text-[10px] font-medium text-slate-500"
                >
                  {limit.min}–{limit.max} mm
                </span>
              </div>
              <div
                className={[
                  "flex h-12 items-center rounded-xl border bg-white transition",
                  fieldError
                    ? "border-rose-400 ring-2 ring-rose-100"
                    : "border-slate-300 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-100",
                ].join(" ")}
              >
                <input
                  id={`${key}-dimension`}
                  name={key}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={inputs[key]}
                  onChange={(event) => onChange(key, event.target.value)}
                  aria-invalid={Boolean(fieldError)}
                  aria-describedby={`${helpId}${fieldError ? ` ${errorId}` : ""}`}
                  className="min-w-0 flex-1 bg-transparent px-3.5 text-base font-semibold text-slate-950 outline-none"
                />
                <span className="border-l border-slate-200 px-3 text-xs font-bold text-slate-500">
                  mm
                </span>
              </div>
              {fieldError && (
                <p
                  id={errorId}
                  className="mt-1.5 text-xs leading-5 text-rose-700"
                >
                  {fieldError.message}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onReset}
        className="mt-5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-slate-500 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      >
        Reset to 100 × 100 × 340
      </button>
    </section>
  );
}
