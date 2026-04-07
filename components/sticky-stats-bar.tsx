"use client";

import type { GridStats } from "@/lib/types";

interface StickyStatsBarProps {
  show: boolean;
  stats: GridStats;
  name?: string;
  avatarUrl?: string;
  githubUsername?: string;
  githubSince?: Date | null;
  weeksLabel: string;
  activeLabel: string;
  streakLabel: string;
  bestLabel: string;
  sinceLabel?: string;
}

export function StickyStatsBar({
  show, stats, name, avatarUrl, githubUsername, githubSince,
  weeksLabel, activeLabel, streakLabel, bestLabel, sinceLabel,
}: StickyStatsBarProps) {
  return (
    <div
      className={`fixed top-14 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm px-4 border-b border-border/50 transition-all duration-300 ${show ? "opacity-100 py-2" : "opacity-0 py-0 pointer-events-none -translate-y-full"}`}
    >
      <div className="container mx-auto flex items-center gap-4 text-[11px] text-muted-foreground tabular-nums">
        {avatarUrl && (
          <img src={avatarUrl} alt="" className="h-6 w-6 rounded-full shrink-0" />
        )}
        {name && (
          githubUsername ? (
            <a href={`https://github.com/${githubUsername}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-foreground truncate hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0">
              {name}
            </a>
          ) : (
            <span className="text-sm font-semibold text-foreground truncate shrink-0">{name}</span>
          )
        )}
        {githubUsername && (
          <a href={`https://github.com/${githubUsername}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground/60 hover:text-foreground transition-colors shrink-0">
            @{githubUsername}
          </a>
        )}

        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          <span className="font-semibold text-foreground text-sm">{stats.percentLived}%</span>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden w-16">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.percentLived}%` }} />
          </div>
        </div>
        <div>{stats.weeksLived.toLocaleString()}/{stats.weeksTotal.toLocaleString()} <span className="text-muted-foreground/60">{weeksLabel}</span></div>
        <div><span className="text-emerald-600 dark:text-emerald-400">{stats.activeWeeks}</span> <span className="text-muted-foreground/60">{activeLabel}</span></div>
        <div>{stats.currentStreak} <span className="text-muted-foreground/60">{streakLabel}</span></div>
        <div>{stats.longestStreak} <span className="text-muted-foreground/60">{bestLabel}</span></div>
        {githubSince && sinceLabel && (
          <div><span className="text-muted-foreground/60">{sinceLabel}</span> {new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short" }).format(githubSince)}</div>
        )}
      </div>
    </div>
  );
}
