import type { ValidationIssue } from "@/src/box-engine/types";

interface ValidationMessagesProps {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export function ValidationMessages({
  errors,
  warnings,
}: ValidationMessagesProps) {
  if (errors.length === 0 && warnings.length === 0) {
    return (
      <div
        className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3"
        role="status"
      >
        <p className="text-xs font-semibold text-emerald-900">
          Dimensions are valid for prototype generation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3" aria-live="polite">
      {errors.length > 0 && (
        <section
          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3"
          aria-labelledby="box-engine-errors"
          role="alert"
        >
          <h3
            id="box-engine-errors"
            className="text-xs font-bold tracking-[0.12em] text-rose-800 uppercase"
          >
            Fix before generation
          </h3>
          <ul className="mt-2 space-y-1.5 text-xs leading-5 text-rose-950">
            {errors.map((issue) => (
              <li key={issue.code} className="flex gap-2">
                <span aria-hidden="true">•</span>
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {warnings.length > 0 && (
        <section
          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
          aria-labelledby="box-engine-warnings"
        >
          <h3
            id="box-engine-warnings"
            className="text-xs font-bold tracking-[0.12em] text-amber-800 uppercase"
          >
            Manufacturing review
          </h3>
          <ul className="mt-2 space-y-1.5 text-xs leading-5 text-amber-950">
            {warnings.map((issue) => (
              <li key={issue.code} className="flex gap-2">
                <span aria-hidden="true">•</span>
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
