"use client";

import { useTranslations } from "next-intl";
import type { GridScale } from "@/lib/types";

interface ScaleSelectorProps {
  scale: GridScale;
  onChange: (scale: GridScale) => void;
}

const SCALES: GridScale[] = ["weeks", "months", "years"];

export function ScaleSelector({ scale, onChange }: ScaleSelectorProps) {
  const t = useTranslations("dashboard");

  const labels: Record<GridScale, string> = {
    weeks: t("scaleWeeks"),
    months: t("scaleMonths"),
    years: t("scaleYears"),
  };

  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-card/50 p-0.5">
      {SCALES.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
            scale === s
              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {labels[s]}
        </button>
      ))}
    </div>
  );
}
