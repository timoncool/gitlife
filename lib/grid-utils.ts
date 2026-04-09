import type {
  CellData,
  CellState,
  GridStats,
  YearContribution,
} from "@/lib/types";

/**
 * Get the week number of a date using a simplified 52-week model.
 * Extra days (day 365/366) are absorbed into week 52.
 */
export function getWeekNumber(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  const week = Math.ceil(dayOfYear / 7);
  return Math.min(week, 52);
}

/**
 * Map GitHub contributions to a "YYYY-WW" -> commit count map.
 */
export function mapContributionsToWeeks(
  yearContributions: YearContribution[],
): Map<string, number> {
  const weekMap = new Map<string, number>();

  for (const contrib of yearContributions) {
    const date = new Date(contrib.date);
    const year = date.getFullYear();
    const week = getWeekNumber(date);
    const key = `${year}-${String(week).padStart(2, "0")}`;
    weekMap.set(key, (weekMap.get(key) ?? 0) + contrib.count);
  }

  return weekMap;
}

/**
 * Determine the cell state based on commit count.
 */
function getCommitLevel(commits: number): CellState {
  if (commits === 0) return "no-commits";
  if (commits <= 3) return "level-1";
  if (commits <= 9) return "level-2";
  if (commits <= 19) return "level-3";
  return "level-4";
}

/**
 * Generate grid cells for the life-in-weeks visualization.
 */
export function generateGridCells(
  birthDate: Date,
  expectedAge: number,
  githubCreatedAt: Date | null,
  contributions: Map<string, number>,
): CellData[] {
  const cells: CellData[] = [];
  const now = new Date();
  const totalWeeks = expectedAge * 52;

  for (let i = 0; i < totalWeeks; i++) {
    const year = Math.floor(i / 52);
    const week = (i % 52) + 1;

    // Calculate the date for this cell
    const cellDate = new Date(birthDate);
    cellDate.setFullYear(cellDate.getFullYear() + year);
    cellDate.setDate(cellDate.getDate() + (week - 1) * 7);

    // Determine state
    let state: CellState;

    const cellYear = cellDate.getFullYear();
    const cellWeek = getWeekNumber(cellDate);
    const nowYear = now.getFullYear();
    const nowWeek = getWeekNumber(now);

    if (cellYear === nowYear && cellWeek === nowWeek) {
      state = "current";
    } else if (cellDate > now) {
      state = "future";
    } else if (githubCreatedAt && cellDate < githubCreatedAt) {
      state = "pre-github";
    } else {
      const key = `${cellYear}-${String(cellWeek).padStart(2, "0")}`;
      const commits = contributions.get(key) ?? 0;
      state = getCommitLevel(commits);
    }

    cells.push({
      year,
      week,
      state,
      date: cellDate,
      commits:
        state !== "future" && state !== "pre-github"
          ? (contributions.get(
              `${cellYear}-${String(cellWeek).padStart(2, "0")}`,
            ) ?? 0)
          : undefined,
    });
  }

  return cells;
}

/**
 * Calculate statistics from the grid cells.
 */
export function calculateStats(cells: CellData[]): GridStats {
  const weeksTotal = cells.length;
  const pastCells = cells.filter(
    (c) => c.state !== "future",
  );
  const weeksLived = pastCells.length;
  const percentLived =
    weeksTotal > 0 ? Math.round((weeksLived / weeksTotal) * 1000) / 10 : 0;

  // Active weeks = weeks with at least 1 commit
  const activeWeeks = cells.filter(
    (c) => c.commits !== undefined && c.commits > 0,
  ).length;

  // Streak calculation — iterate past cells in chronological order
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (const cell of pastCells) {
    if (cell.commits !== undefined && cell.commits > 0) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Current streak: count backwards from the most recent past cell
  // Skip current (incomplete) week if it has no commits yet — stale data shouldn't break streak
  for (let i = pastCells.length - 1; i >= 0; i--) {
    const cell = pastCells[i];
    if (cell.state === "current" && (!cell.commits || cell.commits === 0)) continue;
    if (cell.commits !== undefined && cell.commits > 0) {
      currentStreak++;
    } else {
      break;
    }
  }

  return {
    weeksLived,
    weeksTotal,
    percentLived,
    activeWeeks,
    currentStreak,
    longestStreak,
  };
}
