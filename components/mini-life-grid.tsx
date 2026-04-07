"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CellData, CellState } from "@/lib/types";

const COLORS_DARK: Record<CellState, string> = {
  future: "#0d1117",
  "pre-github": "#0d1117",
  "no-commits": "#21262d",
  "level-1": "#0e4429",
  "level-2": "#006d32",
  "level-3": "#26a641",
  "level-4": "#39d353",
  current: "#1a6334",
};

const COLORS_LIGHT: Record<CellState, string> = {
  future: "#f6f8fa",
  "pre-github": "#f6f8fa",
  "no-commits": "#ebedf0",
  "level-1": "#9be9a8",
  "level-2": "#40c463",
  "level-3": "#30a14e",
  "level-4": "#216e39",
  current: "#40c463",
};

interface MiniLifeGridProps {
  cells: CellData[];
  expectedAge: number;
}

export function MiniLifeGrid({ cells, expectedAge }: MiniLifeGridProps) {
  const [src, setSrc] = useState<string>("");
  const isDarkRef = useRef(false);

  const cellMap = useMemo(() => {
    const map = new Map<string, CellData>();
    for (const cell of cells) {
      map.set(`${cell.year}-${cell.week}`, cell);
    }
    return map;
  }, [cells]);

  useEffect(() => {
    isDarkRef.current = document.documentElement.classList.contains("dark");
    const colors = isDarkRef.current ? COLORS_DARK : COLORS_LIGHT;

    // 1 pixel per cell — scale up with CSS image-rendering: pixelated
    const w = 52;
    const h = expectedAge;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill background
    ctx.fillStyle = colors.future;
    ctx.fillRect(0, 0, w, h);

    // Draw cells
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const cell = cellMap.get(`${y}-${x + 1}`);
        if (!cell) continue;
        ctx.fillStyle = colors[cell.state];
        ctx.fillRect(x, y, 1, 1);
      }
    }

    setSrc(canvas.toDataURL("image/png"));

    // Re-render on theme change
    const obs = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains("dark");
      if (dark !== isDarkRef.current) {
        isDarkRef.current = dark;
        const c = dark ? COLORS_DARK : COLORS_LIGHT;
        ctx.fillStyle = c.future;
        ctx.fillRect(0, 0, w, h);
        for (let y2 = 0; y2 < h; y2++) {
          for (let x2 = 0; x2 < w; x2++) {
            const cell2 = cellMap.get(`${y2}-${x2 + 1}`);
            if (!cell2) continue;
            ctx.fillStyle = c[cell2.state];
            ctx.fillRect(x2, y2, 1, 1);
          }
        }
        setSrc(canvas.toDataURL("image/png"));
      }
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, [cellMap, expectedAge]);

  if (!src) return null;

  return (
    <img
      src={src}
      width={52 * 3}
      height={expectedAge * 3}
      className="w-full h-auto"
      style={{ imageRendering: "pixelated" }}
      alt="Life grid"
      draggable={false}
    />
  );
}
