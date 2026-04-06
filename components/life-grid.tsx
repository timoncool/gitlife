"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CellData, CellState } from "@/lib/types";

// Color maps per theme
const COLORS_DARK: Record<CellState, string> = {
  future: "#30363d",
  "pre-github": "#161b22",
  "no-commits": "#21262d",
  "level-1": "#0e4429",
  "level-2": "#006d32",
  "level-3": "#26a641",
  "level-4": "#39d353",
  current: "#21262d",
};

const COLORS_LIGHT: Record<CellState, string> = {
  future: "#d0d7de",
  "pre-github": "#f6f8fa",
  "no-commits": "#ebedf0",
  "level-1": "#9be9a8",
  "level-2": "#40c463",
  "level-3": "#30a14e",
  "level-4": "#216e39",
  current: "#ebedf0",
};

const CURRENT_STROKE_DARK = "#f0883e";
const CURRENT_STROKE_LIGHT = "#e16f24";

// Cell sizing
const CELL_SIZE = 8;
const CELL_GAP = 2;
const CELL_STEP = CELL_SIZE + CELL_GAP;
const TAP_TARGET = 12;

const LABEL_WIDTH = 30;
const LABEL_HEIGHT = 16;

// X-axis labels
const X_LABELS = [1, 10, 20, 30, 40, 50];

interface LifeGridProps {
  cells: CellData[];
  expectedAge: number;
  loading?: boolean;
}

function useIsDark() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  // Observe class changes on <html>
  if (typeof window !== "undefined" && typeof MutationObserver !== "undefined") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMemo(() => {
      const observer = new MutationObserver(() => {
        setIsDark(document.documentElement.classList.contains("dark"));
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      return () => observer.disconnect();
    }, []);
  }

  return isDark;
}

function formatDateRange(date: Date): string {
  const start = new Date(date);
  const end = new Date(date);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `${fmt(start)} - ${fmt(end)}`;
}

function SkeletonGrid({ expectedAge }: { expectedAge: number }) {
  const rows = Math.min(expectedAge, 90);
  const width = LABEL_WIDTH + 52 * CELL_STEP;
  const height = LABEL_HEIGHT + rows * CELL_STEP;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width={width}
        height={height}
        className="animate-pulse"
        role="img"
        aria-label="Loading grid"
      >
        {Array.from({ length: Math.min(rows, 20) }, (_, y) =>
          Array.from({ length: 52 }, (_, x) => (
            <rect
              key={`${y}-${x}`}
              x={LABEL_WIDTH + x * CELL_STEP}
              y={LABEL_HEIGHT + y * CELL_STEP}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={2}
              className="fill-muted"
            />
          )),
        )}
      </svg>
    </div>
  );
}

function GridCell({
  cell,
  x,
  y,
  isDark,
}: {
  cell: CellData;
  x: number;
  y: number;
  isDark: boolean;
}) {
  const t = useTranslations("dashboard");
  const colors = isDark ? COLORS_DARK : COLORS_LIGHT;
  const fill = colors[cell.state];
  const isCurrent = cell.state === "current";
  const strokeColor = isDark ? CURRENT_STROKE_DARK : CURRENT_STROKE_LIGHT;

  const tooltipContent = `${formatDateRange(cell.date)} | ${t("age")}: ${cell.year} | ${t("week")}: ${cell.week}${
    cell.commits !== undefined ? ` | ${t("commits")}: ${cell.commits}` : ""
  }`;

  const px = LABEL_WIDTH + x * CELL_STEP;
  const py = LABEL_HEIGHT + y * CELL_STEP;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <g>
            {/* Invisible tap target for mobile */}
            <rect
              x={px - (TAP_TARGET - CELL_SIZE) / 2}
              y={py - (TAP_TARGET - CELL_SIZE) / 2}
              width={TAP_TARGET}
              height={TAP_TARGET}
              fill="transparent"
            />
            <rect
              x={px}
              y={py}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={2}
              fill={fill}
              stroke={isCurrent ? strokeColor : "none"}
              strokeWidth={isCurrent ? 1.5 : 0}
            />
          </g>
        }
      />
      <TooltipContent side="top" className="text-xs max-w-[280px]">
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  );
}

export function LifeGrid({ cells, expectedAge, loading }: LifeGridProps) {
  const isDark = useIsDark();

  // Build grid: rows = years, cols = weeks (1-52)
  const grid = useMemo(() => {
    const rows: (CellData | null)[][] = [];
    for (let year = 0; year < expectedAge; year++) {
      const row: (CellData | null)[] = [];
      for (let week = 1; week <= 52; week++) {
        const cell = cells.find((c) => c.year === year && c.week === week);
        row.push(cell ?? null);
      }
      rows.push(row);
    }
    return rows;
  }, [cells, expectedAge]);

  if (loading) {
    return <SkeletonGrid expectedAge={expectedAge} />;
  }

  const svgWidth = LABEL_WIDTH + 52 * CELL_STEP;
  const svgHeight = LABEL_HEIGHT + expectedAge * CELL_STEP;

  // Y-axis labels: every 5 years
  const yLabels: number[] = [];
  for (let age = 0; age <= expectedAge; age += 5) {
    yLabels.push(age);
  }

  return (
    <TooltipProvider delay={100}>
      <div className="w-full overflow-x-auto">
        <svg
          width={svgWidth}
          height={svgHeight}
          role="img"
          aria-label="Life in weeks grid"
        >
          {/* X-axis labels */}
          {X_LABELS.map((w) => (
            <text
              key={`xl-${w}`}
              x={LABEL_WIDTH + (w - 1) * CELL_STEP + CELL_SIZE / 2}
              y={LABEL_HEIGHT - 4}
              textAnchor="middle"
              className="fill-muted-foreground text-[8px]"
            >
              {w}
            </text>
          ))}

          {/* Y-axis labels */}
          {yLabels.map((age) => (
            <text
              key={`yl-${age}`}
              x={LABEL_WIDTH - 4}
              y={LABEL_HEIGHT + age * CELL_STEP + CELL_SIZE / 2 + 3}
              textAnchor="end"
              className="fill-muted-foreground text-[8px]"
            >
              {age}
            </text>
          ))}

          {/* Grid cells */}
          {grid.map((row, y) =>
            row.map((cell, x) =>
              cell ? (
                <GridCell
                  key={`${y}-${x}`}
                  cell={cell}
                  x={x}
                  y={y}
                  isDark={isDark}
                />
              ) : (
                <rect
                  key={`${y}-${x}`}
                  x={LABEL_WIDTH + x * CELL_STEP}
                  y={LABEL_HEIGHT + y * CELL_STEP}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  rx={2}
                  className="fill-muted"
                />
              ),
            ),
          )}
        </svg>
      </div>
    </TooltipProvider>
  );
}
