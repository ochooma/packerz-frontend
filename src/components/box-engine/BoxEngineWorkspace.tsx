"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_DIMENSION_INPUTS,
  GLUE_METHOD,
  MATERIAL_NAME,
  PRINTING_SPEC,
  TEMPLATE_ID,
  TEMPLATE_NAME,
} from "@/src/box-engine/constants";
import { generateRteGeometry } from "@/src/box-engine/rte-generator";
import type {
  DimensionInputs,
  DimensionKey,
} from "@/src/box-engine/types";
import { validateDimensions } from "@/src/box-engine/validation";
import { DielinePreview } from "./DielinePreview";
import { DimensionForm } from "./DimensionForm";
import { ExportButtons } from "./ExportButtons";
import { ValidationMessages } from "./ValidationMessages";

export function BoxEngineWorkspace() {
  const [inputs, setInputs] = useState<DimensionInputs>(() => ({
    ...DEFAULT_DIMENSION_INPUTS,
  }));
  const validation = useMemo(() => validateDimensions(inputs), [inputs]);
  const geometry = useMemo(
    () =>
      validation.dimensions
        ? generateRteGeometry(validation.dimensions)
        : null,
    [validation.dimensions],
  );

  const updateDimension = (field: DimensionKey, value: string) => {
    setInputs((current) => ({ ...current, [field]: value }));
  };

  const resetDimensions = () => {
    setInputs({ ...DEFAULT_DIMENSION_INPUTS });
  };

  return (
    <main
      className="min-h-screen bg-[#f5f6f2] text-slate-950"
      style={{ backgroundColor: "#f5f6f2", colorScheme: "light" }}
    >
      <header className="border-b border-slate-800 bg-[#0d1720] text-white">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span
              className="grid size-8 place-items-center rounded-lg bg-teal-300 text-xs font-black text-slate-950"
              aria-hidden="true"
            >
              P
            </span>
            <div>
              <p className="text-sm font-bold tracking-[0.14em]">PACKERZ</p>
              <p className="text-[9px] font-semibold tracking-[0.2em] text-slate-400 uppercase">
                Box Engine Lab
              </p>
            </div>
          </div>
          <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-[10px] font-bold tracking-[0.16em] text-amber-200 uppercase">
            Internal prototype
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-[1480px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <section className="grid gap-8 border-b border-slate-200 pb-8 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-12">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold tracking-[0.14em] text-teal-700 uppercase">
              <span>{TEMPLATE_ID}</span>
              <span className="text-slate-300">/</span>
              <span>MVP geometry</span>
            </div>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
              Reverse tuck end
              <span className="mt-2 block text-slate-400">
                Unprinted folding carton
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Configure one {TEMPLATE_NAME} carton and inspect its flattened
              cut, crease, glue, and label layers in real time. Calculations and
              exports stay entirely in this browser.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:max-w-xl lg:justify-end">
            <SpecChip label="Material" value={MATERIAL_NAME} />
            <SpecChip label="Glue" value={GLUE_METHOD} />
            <SpecChip label="Printing" value={PRINTING_SPEC} />
            <SpecChip label="Output" value="SVG · PDF" />
          </div>
        </section>

        <div className="mt-8 grid items-start gap-6 xl:grid-cols-[370px_minmax(0,1fr)]">
          <aside className="space-y-6 xl:sticky xl:top-6">
            <DimensionForm
              inputs={inputs}
              errors={validation.errors}
              onChange={updateDimension}
              onReset={resetDimensions}
            />
            <ValidationMessages
              errors={validation.errors}
              warnings={validation.warnings}
            />
            <ExportButtons geometry={geometry} />
          </aside>

          <DielinePreview geometry={geometry} />
        </div>

        <footer className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Prototype limits and flap formulas are provisional. Physical CNC,
            fold, glue, and sample approval are required before manufacturing.
          </p>
          <p className="font-semibold text-slate-600">
            No API · No database · No payment · No production integration
          </p>
        </footer>
      </div>
    </main>
  );
}

function SpecChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3.5 py-3 shadow-sm">
      <p className="text-[9px] font-bold tracking-[0.15em] text-slate-400 uppercase">
        {label}
      </p>
      <p className="mt-1 max-w-44 text-xs font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}
