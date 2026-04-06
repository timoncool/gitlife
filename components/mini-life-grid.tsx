"use client";

import { useEffect, useMemo, useState } from "react";
import type { CellData, CellState } from "@/lib/types";

const COLORS_DARK: Record<CellState, string> = {
  future: "transparent",
  "pre-github": "#12100A",
  "no-commits": "#1A1A1A",
  "level-1": "#0e4429",
  "level-2": "#006d32",
  "level-3": "#26a641",
  "level-4": "#39d353",
  current: "#1A1A1A",
};

const COLORS_LIGHT: Record<CellState, string> = {
  future: "transparent",
  "pre-github": "#f6f8fa",
  "no-commits": "#ebedf0",
  "level-1": "#9be9a8",
  "level-2": "#40c463",
  "level-3": "#30a14e",
  "level-4": "#216e39",
  current: "#ebedf0",
};

const CURRENT_STROKE_DARK = "#39D353";
const CURRENT_STROKE_LIGHT = "#e16f24";

function useIsDark() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

interface MiniLifeGridProps {
  cells: CellData[];
  expectedAge: number;
}

export function MiniLifeGrid({ cells, expectedAge }: MiniLifeGridProps) {
  const isDark = useIsDark();
  const colors = isDark ? COLORS_DARK : COLORS_LIGHT;
  const currentStroke = isDark ? CURRENT_STROKE_DARK : CURRENT_STROKE_LIGHT;

  const cellMap = useMemo(() => {
    const map = new Map<string, CellData>();
    for (const cell of cells) {
      map.set(`${cell.year}-${cell.week}`, cell);
    }
    return map;
  }, [cells]);

  const cellSize = 2;
  const cellGap = 0.5;
  const cellStep = cellSize + cellGap;
  const svgWidth = 52 * cellStep;
  const svgHeight = expectedAge * cellStep;

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full h-auto"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {Array.from({ length: expectedAge }, (_, y) =>
        Array.from({ length: 52 }, (_, x) => {
          const week = x + 1;
          const cell = cellMap.get(`${y}-${week}`);
          if (!cell) return null;

          const isCurrent = cell.state === "current";
          const isFuture = cell.state === "future";
          const fill = isCurrent
            ? (isDark ? "rgba(57,211,83,0.3)" : "rgba(225,111,36,0.35)")
            : colors[cell.state];

          return (
            <rect
              key={`${y}-${x}`}
              x={x * cellStep}
              y={y * cellStep}
              width={cellSize}
              height={cellSize}
              rx={0.5}
              fill={fill}
              stroke={
                isCurrent
                  ? currentStroke
                  : isFuture
                    ? (isDark ? "rgba(255,255,255,0.04)" : "#d0d7de")
                    : "none"
              }
              strokeWidth={isCurrent ? 0.5 : isFuture ? 0.2 : 0}
            />
          );
        }),
      )}
    </svg>
  );
}
