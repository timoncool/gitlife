import { NextRequest, NextResponse } from "next/server";
import { getWeekNumber } from "@/lib/grid-utils";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import type { ContributionWeek } from "@/lib/types";

// Fetch public user profile — NO auth needed
async function fetchPublicProfile(username: string) {
  const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
    headers: { Accept: "application/vnd.github.v3+json" },
    next: { revalidate: 86400 }, // cache 24h
  });
  if (!res.ok) return null;
  return res.json();
}

// Fetch contribution calendar from GitHub's public page — NO auth, NO token
// Fetches ALL years from account creation to now
async function fetchPublicContributions(username: string, joinYear: number): Promise<Record<number, ContributionWeek[]>> {
  const currentYear = new Date().getFullYear();
  const allDayData: { date: string; level: number }[] = [];

  // Fetch each year in parallel
  const yearPromises = [];
  for (let y = joinYear; y <= currentYear; y++) {
    yearPromises.push(
      fetch(`https://github.com/users/${encodeURIComponent(username)}/contributions?from=${y}-01-01&to=${y}-12-31`, {
        headers: { Accept: "text/html" },
        next: { revalidate: 86400 },
      }).then(r => r.ok ? r.text() : "")
    );
  }
  const htmlPages = await Promise.all(yearPromises);

  for (const html of htmlPages) {
    if (!html) continue;

    const dateRegex = /data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"/g;
    let match;
    while ((match = dateRegex.exec(html)) !== null) {
      allDayData.push({ date: match[1], level: parseInt(match[2], 10) });
    }
    // Alternative format
    if (allDayData.length === 0) {
      const altRegex = /data-date="(\d{4}-\d{2}-\d{2})"[^>]*?(?:data-count="(\d+)"|data-level="(\d)")/g;
      while ((match = altRegex.exec(html)) !== null) {
        const count = match[2] ? parseInt(match[2], 10) : parseInt(match[3] || "0", 10);
        allDayData.push({ date: match[1], level: count > 0 ? Math.min(count, 4) : 0 });
      }
    }
  }

  const contributions: Record<number, ContributionWeek[]> = {};

  // Group by year and week
  const weekMap = new Map<string, number>();

  for (const { date, level } of allDayData) {
    const d = new Date(date);
    const year = d.getFullYear();
    const week = getWeekNumber(d);
    const key = `${year}-${week}`;
    // Estimate commits from level: 0=0, 1=1, 2=4, 3=10, 4=20
    const estimatedCommits = [0, 1, 4, 10, 20][level] || 0;
    weekMap.set(key, (weekMap.get(key) || 0) + estimatedCommits);
  }

  for (const [key, totalCommits] of weekMap) {
    const [yearStr, weekStr] = key.split("-");
    const year = parseInt(yearStr, 10);
    const weekNum = parseInt(weekStr, 10);
    if (!contributions[year]) contributions[year] = [];
    contributions[year].push({
      weekNumber: weekNum,
      startDate: new Date(year, 0, 1 + (weekNum - 1) * 7).toISOString(),
      totalCommits,
    });
  }

  // Sort weeks within each year
  for (const year of Object.keys(contributions)) {
    contributions[parseInt(year, 10)].sort((a, b) => a.weekNumber - b.weekNumber);
  }

  return contributions;
}

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get("username");
    if (!username || !/^[a-zA-Z0-9-]+$/.test(username)) {
      return NextResponse.json(
        { error: "Valid username required" },
        { status: 400 },
      );
    }

    const profile = await fetchPublicProfile(username);
    if (!profile) {
      return NextResponse.json(
        { error: `GitHub user "${username}" not found` },
        { status: 404 },
      );
    }

    const createdAt = profile.created_at as string;
    const joinYear = new Date(createdAt).getFullYear();
    const contributions = await fetchPublicContributions(username, joinYear);
    const years = Object.keys(contributions).map(Number).sort();

    // Check if this user is registered — pull their real birthDate and expectedAge
    let birthDate: string | null = null;
    let expectedAge: number | null = null;
    try {
      const githubId = String(profile.id);
      const [saved] = await db
        .select({ birthDate: userProfiles.birthDate, expectedAge: userProfiles.expectedAge })
        .from(userProfiles)
        .where(eq(userProfiles.githubId, githubId))
        .limit(1);
      if (saved) {
        birthDate = saved.birthDate;
        expectedAge = saved.expectedAge;
      }
    } catch {
      // DB unavailable — not critical, continue without saved data
    }

    return NextResponse.json({
      username,
      createdAt,
      avatarUrl: profile.avatar_url,
      years,
      contributions,
      ...(birthDate && { birthDate }),
      ...(expectedAge && { expectedAge }),
    });
  } catch (error) {
    console.error("Demo API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
