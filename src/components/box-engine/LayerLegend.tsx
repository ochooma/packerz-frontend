import { LAYER_STYLES } from "@/src/box-engine/constants";
import type { SvgLayerId } from "@/src/box-engine/types";

const LAYERS: SvgLayerId[] = ["CUT", "CREASE", "GLUE", "LABELS"];

export function LayerLegend() {
  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-medium text-slate-300"
      aria-label="Dieline layer legend"
    >
      {LAYERS.map((layer) => {
        const style = LAYER_STYLES[layer];
        return (
          <span
            key={layer}
            className="flex items-center gap-1.5"
            title={style.description}
          >
            <span
              className={[
                "inline-block",
                layer === "GLUE"
                  ? "h-2.5 w-3 rounded-sm"
                  : layer === "LABELS"
                    ? "size-2.5 rounded-full"
                    : "h-px w-4",
              ].join(" ")}
              style={{
                backgroundColor: style.color,
                backgroundImage:
                  layer === "CREASE"
                    ? `repeating-linear-gradient(90deg, ${style.color} 0 4px, transparent 4px 7px)`
                    : undefined,
              }}
              aria-hidden="true"
            />
            {style.label}
          </span>
        );
      })}
    </div>
  );
}
