"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CellData, CellState } from "@/lib/types";

// Color maps per theme
const COLORS_DARK: Record<CellState, string> = {
  future: "transparent",
  "pre-github": "#0A0A0A",
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

// Responsive cell sizing
const CELL_SIZES = { desktop: 8, tablet: 6, mobile: 5 } as const;
const CELL_GAP = 2;
const TAP_TARGET_MOBILE = 12;

const LABEL_WIDTH = 36;
const LABEL_HEIGHT = 16;

// X-axis labels
const X_LABELS = [1, 10, 20, 30, 40, 50];

function useCellSize() {
  const [size, setSize] = useState<number>(CELL_SIZES.desktop);

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w < 768) setSize(CELL_SIZES.mobile);
      else if (w <= 1024) setSize(CELL_SIZES.tablet);
      else setSize(CELL_SIZES.desktop);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return size;
}

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

  useEffect(() => {
    if (typeof window === "undefined" || typeof MutationObserver === "undefined") {
      return;
    }
    // Sync initial state
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

function formatDateRange(date: Date): string {
  const start = new Date(date);
  const end = new Date(date);
  end.setDate(end.getDate() + 6);
  const sameYear = start.getFullYear() === end.getFullYear();
  const fmtNoYear = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  const fmtWithYear = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (sameYear) {
    return `${fmtNoYear.format(start)} - ${fmtWithYear.format(end)}`;
  }
  return `${fmtWithYear.format(start)} - ${fmtWithYear.format(end)}`;
}

function SkeletonGrid({ expectedAge }: { expectedAge: number }) {
  const cellSize = useCellSize();
  const cellStep = cellSize + CELL_GAP;
  const rows = Math.min(expectedAge, 90);
  const svgWidth = LABEL_WIDTH + 52 * cellStep;
  const svgHeight = LABEL_HEIGHT + rows * cellStep;

  // Y-axis labels every 5 years
  const yLabels: number[] = [];
  for (let age = 0; age <= rows; age += 5) yLabels.push(age);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto"
        role="img"
        aria-label="Loading grid"
      >
        {/* X-axis labels */}
        {X_LABELS.map((w) => (
          <text
            key={`sxl-${w}`}
            x={LABEL_WIDTH + (w - 1) * cellStep + cellSize / 2}
            y={LABEL_HEIGHT - 4}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={10}
          >
            {w}
          </text>
        ))}

        {/* Y-axis labels */}
        {yLabels.map((age) => (
          <text
            key={`syl-${age}`}
            x={LABEL_WIDTH - 4}
            y={LABEL_HEIGHT + age * cellStep + cellSize / 2 + 3}
            textAnchor="end"
            className="fill-muted-foreground"
            fontSize={10}
          >
            {age}
          </text>
        ))}

        {/* All cells as skeleton */}
        {Array.from({ length: rows }, (_, y) =>
          Array.from({ length: 52 }, (_, x) => (
            <rect
              key={`${y}-${x}`}
              x={LABEL_WIDTH + x * cellStep}
              y={LABEL_HEIGHT + y * cellStep}
              width={cellSize}
              height={cellSize}
              rx={2}
              fill="transparent"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth={0.5}
              opacity={0.4 + Math.random() * 0.3}
            />
          )),
        )}

        {/* Shimmer animation overlay */}
        <rect
          x={0}
          y={0}
          width={svgWidth}
          height={svgHeight}
          fill="url(#shimmer)"
          opacity={0.15}
        />
        <defs>
          <linearGradient id="shimmer" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="transparent">
              <animate attributeName="offset" values="-1;2" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="50%" stopColor="white" stopOpacity="0.1">
              <animate attributeName="offset" values="-0.5;2.5" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="transparent">
              <animate attributeName="offset" values="0;3" dur="2s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function GridCell({
  cell,
  x,
  y,
  isDark,
  cellSize,
  cellStep,
}: {
  cell: CellData;
  x: number;
  y: number;
  isDark: boolean;
  cellSize: number;
  cellStep: number;
}) {
  const t = useTranslations("dashboard");
  const colors = isDark ? COLORS_DARK : COLORS_LIGHT;
  const isCurrent = cell.state === "current";
  const isFuture = cell.state === "future";
  const strokeColor = isDark ? CURRENT_STROKE_DARK : CURRENT_STROKE_LIGHT;
  const tapTarget = cellSize < 8 ? TAP_TARGET_MOBILE : cellSize;

  // Current week: green fill with glow
  const fill = isCurrent
    ? (isDark ? "rgba(57,211,83,0.3)" : "rgba(225,111,36,0.2)")
    : colors[cell.state];

  const hasGlow = cell.state === "level-3" || cell.state === "level-4";

  const tooltipContent = `${formatDateRange(cell.date)} | ${t("age")}: ${cell.year} | ${t("week")}: ${cell.week}${
    cell.commits !== undefined ? ` | ${t("commits")}: ${cell.commits}` : ""
  }`;

  const px = LABEL_WIDTH + x * cellStep;
  const py = LABEL_HEIGHT + y * cellStep;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <g>
            {/* Invisible tap target for mobile */}
            <rect
              x={px - (tapTarget - cellSize) / 2}
              y={py - (tapTarget - cellSize) / 2}
              width={tapTarget}
              height={tapTarget}
              fill="transparent"
            />
            {/* Glow effect for high-activity cells */}
            {hasGlow && isDark && (
              <rect
                x={px - 1}
                y={py - 1}
                width={cellSize + 2}
                height={cellSize + 2}
                rx={3}
                fill="none"
                stroke="rgba(57,211,83,0.3)"
                strokeWidth={2}
                filter="url(#glow)"
              />
            )}
            <rect
              x={px}
              y={py}
              width={cellSize}
              height={cellSize}
              rx={2}
              fill={fill}
              stroke={isCurrent ? strokeColor : isFuture ? (isDark ? "rgba(255,255,255,0.04)" : "#d0d7de") : "none"}
              strokeWidth={isCurrent ? 1.5 : isFuture ? 0.5 : 0}
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
  const cellSize = useCellSize();
  const cellStep = cellSize + CELL_GAP;

  // Pre-build a Map for O(1) cell lookup instead of O(n) find per cell
  const cellMap = useMemo(() => {
    const map = new Map<string, CellData>();
    for (const cell of cells) {
      map.set(`${cell.year}-${cell.week}`, cell);
    }
    return map;
  }, [cells]);

  // Build grid: rows = years, cols = weeks (1-52)
  const grid = useMemo(() => {
    const rows: (CellData | null)[][] = [];
    for (let year = 0; year < expectedAge; year++) {
      const row: (CellData | null)[] = [];
      for (let week = 1; week <= 52; week++) {
        row.push(cellMap.get(`${year}-${week}`) ?? null);
      }
      rows.push(row);
    }
    return rows;
  }, [cellMap, expectedAge]);

  if (loading) {
    return <SkeletonGrid expectedAge={expectedAge} />;
  }

  const svgWidth = LABEL_WIDTH + 52 * cellStep;
  const svgHeight = LABEL_HEIGHT + expectedAge * cellStep;

  // Y-axis labels: every 5 years
  const yLabels: number[] = [];
  for (let age = 0; age <= expectedAge; age += 5) {
    yLabels.push(age);
  }

  return (
      <div className="w-full">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto"
          role="img"
          aria-label="Life in weeks grid"
        >
          {/* SVG glow filter */}
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* X-axis labels */}
          {X_LABELS.map((w) => (
            <text
              key={`xl-${w}`}
              x={LABEL_WIDTH + (w - 1) * cellStep + cellSize / 2}
              y={LABEL_HEIGHT - 4}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize={10}
            >
              {w}
            </text>
          ))}

          {/* Y-axis labels */}
          {yLabels.map((age) => (
            <text
              key={`yl-${age}`}
              x={LABEL_WIDTH - 4}
              y={LABEL_HEIGHT + age * cellStep + cellSize / 2 + 3}
              textAnchor="end"
              className="fill-muted-foreground"
              fontSize={10}
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
                  cellSize={cellSize}
                  cellStep={cellStep}
                />
              ) : (
                <rect
                  key={`${y}-${x}`}
                  x={LABEL_WIDTH + x * cellStep}
                  y={LABEL_HEIGHT + y * cellStep}
                  width={cellSize}
                  height={cellSize}
                  rx={2}
                  className="fill-muted"
                />
              ),
            ),
          )}
        </svg>
      </div>
  );
}
