import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contributionCache, userProfiles } from "@/lib/schema";
import { eq } from "drizzle-orm";

interface ContributionWeekRow {
  weekNumber: number;
  startDate: string;
  totalCommits: number;
}

function calculateStatsFromCache(
  rows: { data: unknown }[],
): { totalCommits: number; activeWeeks: number; currentStreak: number; longestStreak: number } {
  // Flatten all weeks from all years, sort chronologically
  const allWeeks: ContributionWeekRow[] = [];
  for (const row of rows) {
    const weeks = row.data as ContributionWeekRow[];
    if (Array.isArray(weeks)) {
      allWeeks.push(...weeks);
    }
  }

  allWeeks.sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  // Filter to only past (completed) weeks — exclude current and future weeks
  // so an incomplete current week with 0 commits doesn't break the streak
  const now = new Date();
  const currentWeekStart = new Date(now);
  currentWeekStart.setDate(now.getDate() - now.getDay());
  currentWeekStart.setHours(0, 0, 0, 0);
  const pastWeeks = allWeeks.filter(
    (w) => new Date(w.startDate).getTime() < currentWeekStart.getTime(),
  );

  let totalCommits = 0;
  let activeWeeks = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (const week of allWeeks) {
    totalCommits += week.totalCommits;
    if (week.totalCommits > 0) {
      activeWeeks++;
    }
  }

  for (const week of pastWeeks) {
    if (week.totalCommits > 0) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Current streak: count backwards from most recent completed week
  let currentStreak = 0;
  for (let i = pastWeeks.length - 1; i >= 0; i--) {
    if (pastWeeks[i].totalCommits > 0) {
      currentStreak++;
    } else {
      break;
    }
  }

  return { totalCommits, activeWeeks, currentStreak, longestStreak };
}

export async function GET(request: NextRequest) {
  try {
    const sort = request.nextUrl.searchParams.get("sort") || "commits";

    // Get all users who have contribution data
    const profiles = await db.select().from(userProfiles);

    const results: {
      githubId: string;
      username: string;
      avatarUrl: string | null;
      totalCommits: number;
      activeWeeks: number;
      currentStreak: number;
      longestStreak: number;
    }[] = [];

    for (const profile of profiles) {
      const cacheRows = await db
        .select({ data: contributionCache.data })
        .from(contributionCache)
        .where(eq(contributionCache.githubId, profile.githubId));

      if (cacheRows.length === 0) continue;

      const stats = calculateStatsFromCache(cacheRows);

      // Skip users with zero commits
      if (stats.totalCommits === 0) continue;

      results.push({
        githubId: profile.githubId,
        username: profile.githubUsername,
        avatarUrl: profile.githubAvatarUrl,
        ...stats,
      });
    }

    // Sort based on query param
    switch (sort) {
      case "active":
        results.sort((a, b) => b.activeWeeks - a.activeWeeks);
        break;
      case "streak":
        results.sort((a, b) => b.currentStreak - a.currentStreak);
        break;
      case "best":
        results.sort((a, b) => b.longestStreak - a.longestStreak);
        break;
      case "commits":
      default:
        results.sort((a, b) => b.totalCommits - a.totalCommits);
        break;
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 },
    );
  }
}
