import {
  DIMENSION_RULES,
  type DimensionInputs,
  type DimensionKey,
  type ValidationIssue,
  type ValidationResult,
} from "../_lib/rte-geometry";

type DimensionControlsProps = {
  inputs: DimensionInputs;
  validation: ValidationResult;
  onChange: (field: DimensionKey, value: string) => void;
  onReset: () => void;
};

const DIMENSION_KEYS = Object.keys(DIMENSION_RULES) as DimensionKey[];

export function DimensionControls({
  inputs,
  validation,
  onChange,
  onReset,
}: DimensionControlsProps) {
  return (
    <section
      className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] sm:p-6"
      aria-labelledby="dimension-controls-title"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-teal-700 uppercase">
            01 / Dimensions
          </p>
          <h2
            id="dimension-controls-title"
            className="mt-2 text-xl font-semibold tracking-tight text-slate-950"
          >
            Finished box size
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Enter the finished Width × Depth × Height in millimeters.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
        >
          Reset
        </button>
      </div>

      <div className="mt-6 space-y-5">
        {DIMENSION_KEYS.map((key) => {
          const rule = DIMENSION_RULES[key];
          const issue = findFieldIssue(key, validation);
          const inputId = `box-engine-${key}`;
          const hintId = `${inputId}-hint`;
          const issueId = `${inputId}-issue`;

          return (
            <label key={key} htmlFor={inputId} className="block">
              <span className="flex items-end justify-between gap-4">
                <span>
                  <span className="text-sm font-semibold text-slate-900">
                    {rule.label}
                  </span>
                  <span className="ml-2 text-xs font-bold text-slate-400">
                    {rule.shortLabel}
                  </span>
                </span>
                <span className="text-[11px] text-slate-500">
                  {rule.min}–{rule.max} mm
                </span>
              </span>

              <span className="relative mt-2 block">
                <input
                  id={inputId}
                  type="number"
                  inputMode="decimal"
                  min={rule.min}
                  max={rule.max}
                  step="0.1"
                  value={inputs[key]}
                  onChange={(event) => onChange(key, event.target.value)}
                  aria-invalid={issue?.level === "error"}
                  aria-describedby={`${hintId}${issue ? ` ${issueId}` : ""}`}
                  className={[
                    "h-14 w-full rounded-2xl border bg-slate-50 px-4 pr-14 text-lg font-semibold text-slate-950 outline-none transition",
                    "focus:bg-white focus:ring-4",
                    issue?.level === "error"
                      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
                      : issue?.level === "warning"
                        ? "border-amber-400 focus:border-amber-500 focus:ring-amber-100"
                        : "border-slate-200 focus:border-teal-600 focus:ring-teal-100",
                  ].join(" ")}
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-bold tracking-wide text-slate-400 uppercase">
                  mm
                </span>
              </span>

              <span
                id={hintId}
                className="mt-1.5 block text-xs leading-5 text-slate-500"
              >
                {rule.description}
              </span>
              {issue ? (
                <span
                  id={issueId}
                  className={[
                    "mt-1.5 flex items-start gap-1.5 text-xs leading-5",
                    issue.level === "error"
                      ? "text-rose-700"
                      : "text-amber-700",
                  ].join(" ")}
                >
                  <IssueIcon level={issue.level} />
                  {issue.message}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <ValidationSummary validation={validation} />
      </div>
    </section>
  );
}

function findFieldIssue(
  field: DimensionKey,
  validation: ValidationResult,
): ValidationIssue | undefined {
  return (
    validation.errors.find((issue) => issue.field === field) ??
    validation.warnings.find((issue) => issue.field === field)
  );
}

function ValidationSummary({
  validation,
}: {
  validation: ValidationResult;
}) {
  const valid = validation.errors.length === 0;
  const contextualWarnings = validation.warnings.filter(
    (warning) => !warning.field,
  );

  return (
    <div aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={[
              "flex size-7 items-center justify-center rounded-full",
              valid
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700",
            ].join(" ")}
            aria-hidden="true"
          >
            {valid ? <CheckIcon /> : <IssueIcon level="error" />}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {valid ? "Dimensions valid" : "Check dimensions"}
            </p>
            <p className="text-xs text-slate-500">
              {valid
                ? "Live geometry is up to date."
                : `${validation.errors.length} blocking issue${validation.errors.length === 1 ? "" : "s"}.`}
            </p>
          </div>
        </div>
        <span
          className={[
            "rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase",
            valid
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700",
          ].join(" ")}
        >
          {valid ? "Ready" : "Paused"}
        </span>
      </div>

      {contextualWarnings.length > 0 ? (
        <ul className="mt-4 space-y-2 rounded-2xl bg-amber-50 p-3.5">
          {contextualWarnings.map((warning) => (
            <li
              key={warning.code}
              className="flex items-start gap-2 text-xs leading-5 text-amber-900"
            >
              <IssueIcon level="warning" />
              <span>{warning.message}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m3 7.2 2.4 2.3L11 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IssueIcon({ level }: { level: "error" | "warning" }) {
  return (
    <svg
      className="mt-0.5 shrink-0"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      {level === "error" ? (
        <>
          <circle
            cx="7"
            cy="7"
            r="5.5"
            stroke="currentColor"
            strokeWidth="1.3"
          />
          <path
            d="M7 4.1v3.4M7 9.8h.01"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <path
            d="M6.14 2.15a1 1 0 0 1 1.72 0l4.48 7.67a1 1 0 0 1-.86 1.5H2.52a1 1 0 0 1-.86-1.5l4.48-7.67Z"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path
            d="M7 5v2.7M7 9.7h.01"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
