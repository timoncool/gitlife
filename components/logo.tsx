"use client";

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className || "h-6 w-6"} fill="none">
      {/* 4x4 grid of cells — like a mini life grid */}
      {[0, 1, 2, 3].map(row =>
        [0, 1, 2, 3].map(col => {
          // Create a pattern: top-left dim, bottom-right bright
          const intensity = (row + col) / 6;
          const colors = ["#0e4429", "#006d32", "#26a641", "#39d353"];
          const idx = Math.min(Math.floor(intensity * 4), 3);
          return (
            <rect
              key={`${row}-${col}`}
              x={2 + col * 5.5}
              y={2 + row * 5.5}
              width={4.5}
              height={4.5}
              rx={1}
              fill={colors[idx]}
            />
          );
        })
      )}
    </svg>
  );
}
