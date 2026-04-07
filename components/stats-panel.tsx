"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useCountUp } from "@/lib/use-count-up";
import type { GridStats, GridScale } from "@/lib/types";

interface StatsPanelProps {
  stats: GridStats;
  scale?: GridScale;
  githubSince?: Date | null;
}

function ProgressBar({ value }: { value: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);
  return (
    <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
      <div
        className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
        style={{ width: mounted ? `${Math.min(value, 100)}%` : "0%" }}
      />
    </div>
  );
}

export function StatsPanel({ stats, scale = "weeks", githubSince }: StatsPanelProps) {
  const t = useTranslations("dashboard");

  // Convert weeks to months or years
  const toScale = (weeks: number) => {
    if (scale === "years") return Math.round(weeks / 52 * 10) / 10;
    if (scale === "months") return Math.round(weeks / (52 / 12));
    return weeks;
  };

  const unitLabel = scale === "years" ? t("scaleYears").toLowerCase()
    : scale === "months" ? t("scaleMonths").toLowerCase()
    : t("weeksShort");

  const livedLabel = scale === "years" ? t("scaleYears")
    : scale === "months" ? t("scaleMonths")
    : t("weeksLived");

  const lived = toScale(stats.weeksLived);
  const total = toScale(stats.weeksTotal);

  const animLived = useCountUp(Math.round(lived));
  const animTotal = useCountUp(Math.round(total));
  const animPercent = useCountUp(Math.round(stats.percentLived));
  const animActive = useCountUp(Math.round(toScale(stats.activeWeeks)));
  const animCurrent = useCountUp(Math.round(toScale(stats.currentStreak)));
  const animLongest = useCountUp(Math.round(toScale(stats.longestStreak)));

  const items = [
    {
      label: livedLabel,
      value: `${animLived.toLocaleString()} / ${animTotal.toLocaleString()}`,
    },
    {
      label: t("lifeLived"),
      value: `${animPercent}%`,
      progress: stats.percentLived,
    },
    {
      label: t("activeWeeks"),
      value: animActive.toLocaleString(),
    },
    {
      label: t("currentStreak"),
      value: `${animCurrent} ${unitLabel}`,
    },
    {
      label: t("longestStreak"),
      value: `${animLongest} ${unitLabel}`,
    },
    ...(githubSince ? [{
      label: t("githubSince"),
      value: new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short" }).format(githubSince),
    }] : []),
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-border bg-card p-5 hover:border-border/80 hover:bg-muted transition-colors relative overflow-hidden"
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
