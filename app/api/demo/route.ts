import { NextRequest, NextResponse } from "next/server";
import { getWeekNumber } from "@/lib/grid-utils";
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
async function fetchPublicContributions(username: string): Promise<Record<number, ContributionWeek[]>> {
  const url = `https://github.com/users/${encodeURIComponent(username)}/contributions`;
  const res = await fetch(url, {
    headers: { Accept: "text/html" },
    next: { revalidate: 86400 },
  });
  if (!res.ok) return {};

  const html = await res.text();
  const contributions: Record<number, ContributionWeek[]> = {};

  // Parse contribution data from HTML
  // GitHub serves contribution cells as <td> elements with data-date and data-level attributes
  // Or as <tool-tip> elements with contribution counts
  const dateRegex = /data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"/g;
  let match;

  const dayData: { date: string; level: number }[] = [];
  while ((match = dateRegex.exec(html)) !== null) {
    dayData.push({ date: match[1], level: parseInt(match[2], 10) });
  }

  // If data-date/data-level parsing didn't work, try alternative format
  if (dayData.length === 0) {
    // Try parsing from the newer GitHub contribution graph format
    const altRegex = /data-date="(\d{4}-\d{2}-\d{2})"[^>]*?(?:data-count="(\d+)"|data-level="(\d)")/g;
    while ((match = altRegex.exec(html)) !== null) {
      const count = match[2] ? parseInt(match[2], 10) : parseInt(match[3] || "0", 10);
      dayData.push({ date: match[1], level: count > 0 ? Math.min(count, 4) : 0 });
    }
  }

  // Group by year and week
  const weekMap = new Map<string, number>(); // "YYYY-WW" -> estimated commits

  for (const { date, level } of dayData) {
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
    const contributions = await fetchPublicContributions(username);
    const years = Object.keys(contributions).map(Number).sort();

    return NextResponse.json({
      username,
      createdAt,
      avatarUrl: profile.avatar_url,
      years,
      contributions,
    });
  } catch (error) {
    console.error("Demo API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
