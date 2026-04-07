"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CellData, CellState, GridScale } from "@/lib/types";

// Color maps per theme
// Canonical GitHub contribution graph colors
const COLORS_DARK: Record<CellState, string> = {
  future: "#0d1117",
  "pre-github": "#0d1117",
  "no-commits": "#21262d",
  "level-1": "#0e4429",
  "level-2": "#006d32",
  "level-3": "#26a641",
  "level-4": "#39d353",
  current: "#161b22",
};

const COLORS_LIGHT: Record<CellState, string> = {
  future: "#f6f8fa",
  "pre-github": "#f6f8fa",
  "no-commits": "#d0d7de",
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

const LABEL_WIDTH = 46;
const LABEL_HEIGHT = 26;

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
  scale?: GridScale;
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
              className="fill-muted"
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

// Aggregate cells by month: 12 cols per year-row
function aggregateMonths(cells: CellData[], expectedAge: number): (CellData | null)[][] {
  const rows: (CellData | null)[][] = [];
  for (let year = 0; year < expectedAge; year++) {
    const row: (CellData | null)[] = [];
    for (let month = 0; month < 12; month++) {
      const startWeek = Math.floor(month * (52 / 12)) + 1;
      const endWeek = Math.floor((month + 1) * (52 / 12));
      const mc = cells.filter(c => c.year === year && c.week >= startWeek && c.week <= endWeek);
      if (mc.length === 0) { row.push(null); continue; }
      const commits = mc.reduce((s, c) => s + (c.commits ?? 0), 0);
      const hasCurrent = mc.some(c => c.state === "current");
      const allFuture = mc.every(c => c.state === "future");
      const allPre = mc.every(c => c.state === "pre-github");
      let state: CellState;
      if (hasCurrent) state = "current";
      else if (allFuture) state = "future";
      else if (allPre) state = "pre-github";
      else if (commits === 0) state = "no-commits";
      else if (commits <= 12) state = "level-1";
      else if (commits <= 36) state = "level-2";
      else if (commits <= 80) state = "level-3";
      else state = "level-4";
      row.push({ ...mc[0], state, commits, week: month + 1 });
    }
    rows.push(row);
  }
  return rows;
}

// Aggregate cells by year: 10 cols, rows of decades
function aggregateYears(cells: CellData[], expectedAge: number): (CellData | null)[][] {
  const yearCells: (CellData | null)[] = [];
  for (let year = 0; year < expectedAge; year++) {
    const yc = cells.filter(c => c.year === year);
    if (yc.length === 0) { yearCells.push(null); continue; }
    const commits = yc.reduce((s, c) => s + (c.commits ?? 0), 0);
    const hasCurrent = yc.some(c => c.state === "current");
    const allFuture = yc.every(c => c.state === "future");
    const allPre = yc.every(c => c.state === "pre-github");
    let state: CellState;
    if (hasCurrent) state = "current";
    else if (allFuture) state = "future";
    else if (allPre) state = "pre-github";
    else if (commits === 0) state = "no-commits";
    else if (commits <= 50) state = "level-1";
    else if (commits <= 200) state = "level-2";
    else if (commits <= 500) state = "level-3";
    else state = "level-4";
    yearCells.push({ ...yc[0], state, commits, week: 1, year });
  }
  const rows: (CellData | null)[][] = [];
  for (let i = 0; i < yearCells.length; i += 10) {
    const row = yearCells.slice(i, i + 10);
    while (row.length < 10) row.push(null);
    rows.push(row);
  }
  return rows;
}

export function LifeGrid({ cells, expectedAge, loading, scale = "weeks" }: LifeGridProps) {
  const t = useTranslations("dashboard");
  const isDark = useIsDark();
  const cellSize = useCellSize();
  const cellStep = cellSize + CELL_GAP;

  const cellMap = useMemo(() => {
    const map = new Map<string, CellData>();
    for (const cell of cells) map.set(`${cell.year}-${cell.week}`, cell);
    return map;
  }, [cells]);

  // Build grid based on scale
  const { grid, cols, xLabels, yLabelStep } = useMemo(() => {
    if (scale === "months") {
      return {
        grid: aggregateMonths(cells, expectedAge),
        cols: 12,
        xLabels: [1, 3, 6, 9, 12],
        yLabelStep: 5,
      };
    }
    if (scale === "years") {
      return {
        grid: aggregateYears(cells, expectedAge),
        cols: 10,
        xLabels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        yLabelStep: 1, // every row = decade
      };
    }
    const rows: (CellData | null)[][] = [];
    for (let year = 0; year < expectedAge; year++) {
      const row: (CellData | null)[] = [];
      for (let week = 1; week <= 52; week++) row.push(cellMap.get(`${year}-${week}`) ?? null);
      rows.push(row);
    }
    return { grid: rows, cols: 52, xLabels: X_LABELS, yLabelStep: 5 };
  }, [cellMap, expectedAge, cells, scale]);

  if (loading) {
    return <SkeletonGrid expectedAge={expectedAge} />;
  }

  const gridRows = grid.length;
  // Same cell size for ALL scales
  const svgWidth = LABEL_WIDTH + cols * cellStep;
  const svgHeight = LABEL_HEIGHT + gridRows * cellStep;

  // Y-axis labels
  const yLabels: { row: number; label: string }[] = [];
  if (scale === "years") {
    for (let r = 0; r < gridRows; r++) yLabels.push({ row: r, label: String(r * 10) });
  } else {
    for (let age = 0; age <= gridRows; age += yLabelStep) yLabels.push({ row: age, label: String(age) });
  }

  // Weeks: stretch to full width. Months/Years: match weeks cell size on screen.
  // We calculate the pixel ratio from the weeks viewBox to achieve same cell size.
  const weeksViewBoxWidth = LABEL_WIDTH + 52 * cellStep;
  // When weeks SVG is w-full, 1 viewBox unit = containerWidth/weeksViewBoxWidth pixels
  // For months/years to have same cell size, their pixel width = svgWidth/weeksViewBoxWidth * containerWidth
  // Which is the same as: width = (svgWidth/weeksViewBoxWidth) * 100%
  const widthPercent = scale === "weeks" ? "100%" : `${(svgWidth / weeksViewBoxWidth) * 100}%`;

  return (
      <div className="w-full flex justify-center">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: widthPercent, height: "auto" }}
          role="img"
          aria-label="Life grid"
        >
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
          {xLabels.map((w) => (
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
          {yLabels.map((yl) => (
            <text
              key={`yl-${yl.row}`}
              x={LABEL_WIDTH - 4}
              y={LABEL_HEIGHT + yl.row * cellStep + cellSize / 2 + 3}
              textAnchor="end"
              className="fill-muted-foreground"
              fontSize={10}
            >
              {yl.label}
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

          {/* Pre-GitHub badge */}
          {(() => {
            const preCells = cells.filter(c => c.state === "pre-github");
            if (preCells.length < 10) return null;
            // Find the vertical center of the pre-github zone
            const minYear = Math.min(...preCells.map(c => c.year));
            const maxYear = Math.max(...preCells.map(c => c.year));
            const midYear = Math.floor((minYear + maxYear) / 2);
            const cy = LABEL_HEIGHT + midYear * cellStep + cellSize / 2;
            const cx = LABEL_WIDTH + (cols * cellStep) / 2;
            const badgeW = Math.min(cols * cellStep * 0.6, 200);
            const badgeH = 14;
            return (
              <g>
                <rect
                  x={cx - badgeW / 2}
                  y={cy - badgeH / 2}
                  width={badgeW}
                  height={badgeH}
                  rx={3}
                  fill={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}
                />
                <text
                  x={cx}
                  y={cy + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)"}
                  fontSize={8}
                  fontWeight={500}
                >
                  {t("preGithub")}
                </text>
              </g>
            );
          })()}

          {/* GitHub registration cell marker */}
          {(() => {
            const preCells = cells.filter(c => c.state === "pre-github");
            if (preCells.length === 0) return null;
            const last = preCells[preCells.length - 1];
            const regAge = last.year;
            const regWeek = last.week + 1;
            let row: number, col: number;
            if (scale === "years") {
              row = Math.floor(regAge / 10);
              col = regAge % 10;
            } else if (scale === "months") {
              row = regAge;
              col = Math.floor((regWeek - 1) / (52 / 12));
            } else {
              row = regAge;
              col = regWeek - 1;
            }
            if (row >= grid.length || col >= (grid[0]?.length ?? 0)) return null;
            return (
              <rect
                x={LABEL_WIDTH + col * cellStep}
                y={LABEL_HEIGHT + row * cellStep}
                width={cellSize}
                height={cellSize}
                rx={2}
                fill={isDark ? "#0ea5e9" : "#38bdf8"}
              />
            );
          })()}

          {/* X-axis title — centered above column numbers, same gap as Y title from its numbers */}
          <text
            x={LABEL_WIDTH + (cols * cellStep) / 2}
            y={LABEL_HEIGHT - 18}
            textAnchor="middle"
            className="fill-muted-foreground/70"
            fontSize={8}
            
          >
            {t(scale === "months" ? "axisMonth" : scale === "years" ? "axisYear" : "axisWeek")}
          </text>

          {/* Y-axis title — rotated, same gap from numbers as X title */}
          <text
            textAnchor="middle"
            className="fill-muted-foreground/70"
            fontSize={8}
            
            transform={`translate(${LABEL_WIDTH - 25}, ${LABEL_HEIGHT + (gridRows * cellStep) / 2}) rotate(-90)`}
          >
            {t("axisAge")}
          </text>
        </svg>
      </div>
  );
}
