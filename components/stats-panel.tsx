"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GridStats } from "@/lib/types";

interface StatsPanelProps {
  stats: GridStats;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
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
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            {item.progress !== undefined && (
              <ProgressBar value={item.progress} />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
