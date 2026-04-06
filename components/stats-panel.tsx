"use client";

import { useTranslations } from "next-intl";
import type { GridStats } from "@/lib/types";

interface StatsPanelProps {
  stats: GridStats;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
      <div
        className="h-full bg-primary rounded-full transition-all duration-500"
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

export function StatsPanel({ stats }: StatsPanelProps) {
  const t = useTranslations("dashboard");

  const items = [
    {
      label: t("weeksLived"),
      value: `${stats.weeksLived.toLocaleString()} / ${stats.weeksTotal.toLocaleString()}`,
    },
    {
      label: t("lifeLived"),
      value: `${stats.percentLived}%`,
      progress: stats.percentLived,
    },
    {
      label: t("activeWeeks"),
      value: stats.activeWeeks.toLocaleString(),
    },
    {
      label: t("currentStreak"),
      value: `${stats.currentStreak} ${t("week")}${stats.currentStreak !== 1 ? "s" : ""}`,
    },
    {
      label: t("longestStreak"),
      value: `${stats.longestStreak} ${t("week")}${stats.longestStreak !== 1 ? "s" : ""}`,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-white/[0.08] bg-card p-5 hover:border-white/[0.12] hover:bg-[#0E0E0E] transition-colors relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/40 rounded-l-lg" />
          <div className="text-xs text-muted-foreground uppercase tracking-wider">
            {item.label}
          </div>
          <div
            className="font-mono text-2xl font-semibold tabular-nums mt-1"
          >
            {item.value}
          </div>
          {item.progress !== undefined && (
            <ProgressBar value={item.progress} />
          )}
        </div>
      ))}
    </div>
  );
}
